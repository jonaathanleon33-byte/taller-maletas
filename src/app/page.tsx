import Link from "next/link";
import { claveActivada } from "@/lib/auth";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { LogoTaller } from "@/components/LogoTaller";
import { OrdenCard } from "@/components/OrdenCard";
import { OrdenCardGrupo } from "@/components/OrdenCardGrupo";
import { SearchBar } from "@/components/SearchBar";
import { FiltroFechaEntrega } from "@/components/FiltroFechaEntrega";
import { ContadorEstados } from "@/components/ContadorEstados";
import { MascotasAmbiente } from "@/components/MascotasAmbiente";
import { ActualizacionAutomatica } from "@/components/ActualizacionAutomatica";
import { createClient } from "@/lib/supabase/server";
import { obtenerNegocioConfig } from "@/lib/negocio";
import { calcularTotales } from "@/lib/money";
import { formatFecha } from "@/lib/format";
import {
  DIAS_ALERTA,
  DIAS_RENOTIFICAR,
  corteRenotificar,
  } from "@/lib/estado";
import type { ComprobanteItem, Estado, Orden } from "@/types/database";
import type { ComprobanteResumen } from "@/components/OrdenCard";

type Filtro =
  | "recibida"
  | "lista"
  | "entregada"
  | "entregada_sin_reparar"
  | "atrasada"
  | "renotificar";

const FILTRO_LABELS: Record<Filtro, string> = {
  recibida: "Recibidas",
  lista: "Listas",
  entregada: "Entregadas",
  entregada_sin_reparar: "Entregadas sin reparar",
  atrasada: "Atrasadas",
  renotificar: "Por volver a notificar",
};

function esFiltroValido(valor: string | undefined): valor is Filtro {
  return (
    valor === "recibida" ||
    valor === "lista" ||
    valor === "entregada" ||
    valor === "entregada_sin_reparar" ||
    valor === "atrasada" ||
    valor === "renotificar"
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

const PAGINA = 60;

async function buscarOrdenes(
  q: string | undefined,
  fecha: string | undefined,
  filtro: Filtro | undefined,
  limite: number,
) {
  const supabase = await createClient();
  let query = supabase
    .from("ordenes")
    .select("*", { count: "exact" })
    .limit(limite);

  if (fecha) {
    query = query
      .eq("fecha_prometida", fecha)
      .order("fecha_prometida", { ascending: true });
  } else if (filtro === "renotificar") {
    query = query.order("notificada_lista_en", { ascending: true });
  } else if (filtro === "atrasada") {
    query = query.order("fecha_recibido", { ascending: true });
  } else {
    query = query.order("fecha_recibido", { ascending: false });
  }

  if (filtro === "renotificar") {
    query = query
      .eq("estado", "lista")
      .lt("notificada_lista_en", corteRenotificar());
  } else if (filtro === "atrasada") {
    query = query.eq("estado", "recibida").lte("fecha_recibido", cutoffAtrasada());
  } else if (filtro === "recibida") {
    query = query.eq("estado", "recibida").gt("fecha_recibido", cutoffAtrasada());
  } else if (
    filtro === "lista" ||
    filtro === "entregada" ||
    filtro === "entregada_sin_reparar"
  ) {
    query = query.eq("estado", filtro);
  }

  if (q) {
    const term = q.trim();
    // Un término corto y numérico es casi siempre un número de recibo,
    // no un teléfono (esos tienen 10 dígitos) — si lo mezclamos con la
    // búsqueda de teléfono, un recibo como "43" termina trayendo
    // clientes al azar cuyo celular simplemente contiene "43" en
    // cualquier parte. En ese caso buscamos solo por recibo.
    if (/^\d+$/.test(term) && term.length <= 6) {
      query = query.ilike("numero_recibo", `${term}%`);
    } else {
      query = query.or(
        `numero_recibo.ilike.%${term}%,cliente_nombre.ilike.%${term}%,cliente_telefono.ilike.%${term}%,dano_descripcion.ilike.%${term}%`,
      );
    }
  }

  return query;
}

// Un recibo con varias maletas se muestra siempre completo, aunque la
// página cortara el grupo a la mitad: traemos las hermanas que falten.
async function completarGrupos(ordenes: Orden[]) {
  const recibos = [...new Set(ordenes.map((o) => o.numero_recibo))];
  if (recibos.length === 0) return ordenes;

  const supabase = await createClient();
  const { data: todas } = await supabase
    .from("ordenes")
    .select("*")
    .in("numero_recibo", recibos);

  const porRecibo = new Map<string, Orden[]>();
  for (const o of todas ?? []) {
    const grupo = porRecibo.get(o.numero_recibo) ?? [];
    grupo.push(o);
    porRecibo.set(o.numero_recibo, grupo);
  }

  return recibos.flatMap((r) =>
    (porRecibo.get(r) ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at)),
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    fecha?: string;
    filtro?: string;
    n?: string;
  }>;
}) {
  const { q, fecha, filtro: filtroRaw, n } = await searchParams;
  const limite = Math.min(Math.max(Number(n) || PAGINA, PAGINA), 1000);
  const filtro = esFiltroValido(filtroRaw) ? filtroRaw : undefined;
  const negocio = await obtenerNegocioConfig();

  const missingEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let ordenes: Orden[] = [];
  let totalCoincidencias = 0;
  let cargadas = 0;
  let error: string | null = null;

  if (missingEnv) {
    error =
      "Falta configurar las variables de entorno de Supabase (.env.local).";
  } else {
    const { data, count, error: queryError } = await buscarOrdenes(
      q,
      fecha,
      filtro,
      limite,
    );
    if (queryError) {
      error = queryError.message;
    } else {
      cargadas = data?.length ?? 0;
      totalCoincidencias = count ?? cargadas;
      ordenes = await completarGrupos(data ?? []);
    }
  }

  // Contador por estado para el panel de arriba: siempre sobre el
  // total de órdenes, sin importar el buscador o el filtro de fecha
  // activos, para que sea un vistazo general y estable del taller.
  const contadores = {
    recibidas: 0,
    listas: 0,
    entregadas: 0,
    entregadasSinReparar: 0,
    atrasadas: 0,
  };
  let porRenotificar = 0;
  if (!missingEnv) {
    const supabase = await createClient();
    const contar = (estado: Estado) =>
      supabase
        .from("ordenes")
        .select("id", { count: "exact", head: true })
        .eq("estado", estado);

    const [recibidasTotal, atrasadas, listas, entregadas, sinReparar, renot] =
      await Promise.all([
        contar("recibida"),
        contar("recibida").lte("fecha_recibido", cutoffAtrasada()),
        contar("lista"),
        contar("entregada"),
        contar("entregada_sin_reparar"),
        contar("lista").lt("notificada_lista_en", corteRenotificar()),
      ]);

    contadores.atrasadas = atrasadas.count ?? 0;
    contadores.recibidas = (recibidasTotal.count ?? 0) - contadores.atrasadas;
    contadores.listas = listas.count ?? 0;
    contadores.entregadas = entregadas.count ?? 0;
    contadores.entregadasSinReparar = sinReparar.count ?? 0;
    porRenotificar = renot.count ?? 0;
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

  const paramsVerMas = new URLSearchParams();
  if (q) paramsVerMas.set("q", q);
  if (fecha) paramsVerMas.set("fecha", fecha);
  if (filtro) paramsVerMas.set("filtro", filtro);
  paramsVerMas.set("n", String(limite + PAGINA));
  const hrefVerMas = `/?${paramsVerMas.toString()}`;

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <MascotasAmbiente />
      <ActualizacionAutomatica />

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
            <Link
              href="/revision"
              className="flex h-9 items-center justify-center rounded-full border border-slate-300 px-3 text-sm font-medium text-slate-700 active:bg-slate-100"
            >
              Revisión
            </Link>
            {claveActivada() ? (
              <Link
                href="/logout"
                aria-label="Cerrar sesión"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-500 active:bg-slate-100"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ) : null}
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
            entregadasSinReparar={contadores.entregadasSinReparar}
            atrasadas={contadores.atrasadas}
            filtroActivo={filtro}
          />
        ) : null}

        {porRenotificar > 0 ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            <span>
              {porRenotificar === 1
                ? "1 cliente"
                : `${porRenotificar} clientes`}{" "}
              por volver a notificar (sin recoger hace {DIAS_RENOTIFICAR} días hábiles o
              más, de lunes a sábado)
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1 text-xs font-semibold uppercase">
              <Link
                href="/notificar"
                className="rounded-full bg-amber-600 px-3 py-1 text-white active:bg-amber-700"
              >
                Notificar
              </Link>
              <Link
                href={filtro === "renotificar" ? "/" : "/?filtro=renotificar"}
                className="underline"
              >
                {filtro === "renotificar" ? "Ver todas" : "Ver lista"}
              </Link>
            </span>
          </div>
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
            {totalCoincidencias > 0
              ? `Para entregar el ${formatFecha(fecha)} (${totalCoincidencias})`
              : `Nada prometido para el ${formatFecha(fecha)}`}
          </p>
        ) : filtro ? (
          <p className="mb-3 text-sm font-medium text-slate-600">
            {FILTRO_LABELS[filtro]} ({totalCoincidencias})
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

        {!error && cargadas < totalCoincidencias ? (
          <Link
            href={hrefVerMas}
            scroll={false}
            className="mt-4 flex items-center justify-center rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 active:bg-slate-50"
          >
            Ver más ({totalCoincidencias - cargadas} restantes)
          </Link>
        ) : null}
      </main>
    </div>
  );
}
