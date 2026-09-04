import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { LogoTaller } from "@/components/LogoTaller";
import { OrdenCard } from "@/components/OrdenCard";
import { OrdenCardGrupo } from "@/components/OrdenCardGrupo";
import { SearchBar } from "@/components/SearchBar";
import { FiltroFechaEntrega } from "@/components/FiltroFechaEntrega";
import { ContadorEstados } from "@/components/ContadorEstados";
import { createClient } from "@/lib/supabase/server";
import { obtenerNegocioConfig } from "@/lib/negocio";
import { calcularTotales } from "@/lib/money";
import { formatFecha } from "@/lib/format";
import { DIAS_ALERTA, estaAtrasada } from "@/lib/estado";
import type { ComprobanteItem, Orden } from "@/types/database";
import type { ComprobanteResumen } from "@/components/OrdenCard";

type Filtro = "recibida" | "lista" | "entregada" | "atrasada";

const FILTRO_LABELS: Record<Filtro, string> = {
  recibida: "Recibidas",
  lista: "Listas",
  entregada: "Entregadas",
  atrasada: "Atrasadas",
};

function esFiltroValido(valor: string | undefined): valor is Filtro {
  return (
    valor === "recibida" ||
    valor === "lista" ||
    valor === "entregada" ||
    valor === "atrasada"
  );
}

function agruparPorRecibo(ordenes: Orden[]) {
  const grupos = new Map<string, Orden[]>();
  for (const orden of ordenes) {
    const grupo = grupos.get(orden.numero_recibo);
    if (grupo) {
      grupo.push(orden);
    } else {
      grupos.set(orden.numero_recibo, [orden]);
    }
  }
  return Array.from(grupos.values());
}

export const dynamic = "force-dynamic";

// diasSinEntregar() redondea hacia abajo los días transcurridos, así
// que "más de DIAS_ALERTA días" en la práctica solo se cumple desde
// el día DIAS_ALERTA+1 completo — este corte replica exactamente esa
// regla para que el filtro coincida con el contador de arriba.
function cutoffAtrasada() {
  return new Date(
    Date.now() - (DIAS_ALERTA + 1) * 24 * 60 * 60 * 1000,
  ).toISOString();
}

async function buscarOrdenes(
  q: string | undefined,
  fecha: string | undefined,
  filtro: Filtro | undefined,
) {
  const supabase = await createClient();
  let query = supabase.from("ordenes").select("*");

  if (fecha) {
    query = query
      .eq("fecha_prometida", fecha)
      .order("fecha_prometida", { ascending: true });
  } else if (filtro === "atrasada") {
    query = query.order("fecha_recibido", { ascending: true });
  } else {
    query = query.order("fecha_recibido", { ascending: false });
  }

  if (filtro === "atrasada") {
    query = query.eq("estado", "recibida").lte("fecha_recibido", cutoffAtrasada());
  } else if (filtro === "recibida") {
    query = query.eq("estado", "recibida").gt("fecha_recibido", cutoffAtrasada());
  } else if (filtro === "lista" || filtro === "entregada") {
    query = query.eq("estado", filtro);
  }

  if (q) {
    const term = q.trim();
    query = query.or(
      `numero_recibo.ilike.%${term}%,cliente_nombre.ilike.%${term}%,cliente_telefono.ilike.%${term}%,dano_descripcion.ilike.%${term}%`,
    );
  }

  return query;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; fecha?: string; filtro?: string }>;
}) {
  const { q, fecha, filtro: filtroRaw } = await searchParams;
  const filtro = esFiltroValido(filtroRaw) ? filtroRaw : undefined;
  const negocio = await obtenerNegocioConfig();

  const missingEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let ordenes: Orden[] = [];
  let error: string | null = null;

  if (missingEnv) {
    error =
      "Falta configurar las variables de entorno de Supabase (.env.local).";
  } else {
    const { data, error: queryError } = await buscarOrdenes(q, fecha, filtro);
    if (queryError) {
      error = queryError.message;
    } else {
      ordenes = data ?? [];
    }
  }

  // Contador por estado para el panel de arriba: siempre sobre el
  // total de órdenes, sin importar el buscador o el filtro de fecha
  // activos, para que sea un vistazo general y estable del taller.
  const contadores = { recibidas: 0, listas: 0, entregadas: 0, atrasadas: 0 };
  if (!missingEnv) {
    const supabase = await createClient();
    const { data: todas } = await supabase
      .from("ordenes")
      .select("estado, fecha_recibido");

    for (const o of todas ?? []) {
      if (estaAtrasada(o)) {
        contadores.atrasadas++;
      } else if (o.estado === "recibida") {
        contadores.recibidas++;
      } else if (o.estado === "lista") {
        contadores.listas++;
      } else if (o.estado === "entregada") {
        contadores.entregadas++;
      }
    }
  }

  // Saldo/abono por orden, para mostrarlo de una vez en cada tarjeta
  // del listado — se trae en dos consultas en bloque (no una por
  // orden) para no multiplicar las consultas con la cantidad de
  // órdenes.
  const resumenPorOrden = new Map<string, ComprobanteResumen>();
  if (ordenes.length > 0) {
    const supabase = await createClient();
    const ordenIds = ordenes.map((o) => o.id);

    const { data: comprobantes } = await supabase
      .from("comprobantes")
      .select("*")
      .in("orden_id", ordenIds);

    const comprobanteIds = (comprobantes ?? []).map((c) => c.id);
    const { data: items } =
      comprobanteIds.length > 0
        ? await supabase
            .from("comprobante_items")
            .select("*")
            .in("comprobante_id", comprobanteIds)
        : { data: [] as ComprobanteItem[] };

    const itemsPorComprobante = new Map<string, ComprobanteItem[]>();
    for (const item of items ?? []) {
      const lista = itemsPorComprobante.get(item.comprobante_id) ?? [];
      lista.push(item);
      itemsPorComprobante.set(item.comprobante_id, lista);
    }

    for (const c of comprobantes ?? []) {
      if (!c.orden_id) continue;
      const { total } = calcularTotales(
        itemsPorComprobante.get(c.id) ?? [],
        c.descuento_global,
        c.impuestos,
      );
      if (total <= 0) continue;
      resumenPorOrden.set(c.orden_id, {
        total,
        abono: c.abono,
        saldoPendiente: total - c.abono,
        pagado: c.pagado,
      });
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <AppHeader
        title="Taller de Maletas"
        titleIcon={
          negocio.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={negocio.logo_url}
              alt=""
              className="h-8 w-8 shrink-0 rounded object-contain"
            />
          ) : (
            <LogoTaller className="h-7 w-7 shrink-0 text-blue-700" />
          )
        }
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/ajustes/recibo"
              className="flex h-9 items-center justify-center rounded-full border border-slate-300 px-3 text-sm font-medium text-slate-700 active:bg-slate-100"
            >
              Recibo
            </Link>
            <Link
              href="/servicios"
              className="flex h-9 items-center justify-center rounded-full border border-slate-300 px-3 text-sm font-medium text-slate-700 active:bg-slate-100"
            >
              Precios
            </Link>
          </div>
        }
      />

      {negocio.fondo_home_url ? (
        <div className="w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={negocio.fondo_home_url}
            alt=""
            className="h-36 w-full object-cover sm:h-44"
          />
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <Link
            href="/ordenes/nueva"
            className="flex h-11 items-center justify-center gap-1 rounded-lg bg-blue-700 text-sm font-medium text-white active:bg-blue-800"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Orden nueva
          </Link>
          <Link
            href="/ventas/nueva"
            className="flex h-11 items-center justify-center gap-1 rounded-lg border border-blue-700 bg-white text-sm font-medium text-blue-700 active:bg-blue-50"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Venta directa
          </Link>
        </div>

        {!missingEnv && !error ? (
          <ContadorEstados
            recibidas={contadores.recibidas}
            listas={contadores.listas}
            entregadas={contadores.entregadas}
            atrasadas={contadores.atrasadas}
            filtroActivo={filtro}
          />
        ) : null}

        <div className="mb-2">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>

        <div className="mb-4">
          <Suspense fallback={null}>
            <FiltroFechaEntrega />
          </Suspense>
        </div>

        {fecha ? (
          <p className="mb-3 text-sm font-medium text-slate-600">
            {ordenes.length > 0
              ? `Para entregar el ${formatFecha(fecha)} (${ordenes.length})`
              : `Nada prometido para el ${formatFecha(fecha)}`}
          </p>
        ) : filtro ? (
          <p className="mb-3 text-sm font-medium text-slate-600">
            {FILTRO_LABELS[filtro]} ({ordenes.length})
          </p>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
          </div>
        ) : ordenes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 py-16 text-center text-slate-500">
            <p className="font-medium">
              {fecha
                ? "No hay maletas prometidas para esa fecha"
                : filtro
                  ? "No hay maletas en este estado"
                  : q
                    ? "No se encontraron órdenes"
                    : "Todavía no hay órdenes"}
            </p>
            <p className="text-sm">
              {fecha
                ? "Probá con otra fecha o quitá el filtro."
                : filtro
                  ? "Probá con otro estado o quitá el filtro."
                  : q
                    ? "Probá con otro número de recibo, nombre, teléfono o servicio."
                    : "Crea la primera con el botón “Nueva”."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {agruparPorRecibo(ordenes).map((grupo) => (
              <li key={grupo[0].id}>
                {grupo.length > 1 ? (
                  <OrdenCardGrupo ordenes={grupo} resumenPorOrden={resumenPorOrden} />
                ) : (
                  <OrdenCard
                    orden={grupo[0]}
                    resumen={resumenPorOrden.get(grupo[0].id)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
