import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ActualizacionAutomatica } from "@/components/ActualizacionAutomatica";
import { DomicilioAcciones } from "@/components/DomicilioAcciones";
import { createClient } from "@/lib/supabase/server";
import {
  ESTADOS_ACTIVOS,
  ESTADOS_DOMICILIO,
  TIPOS_DOMICILIO,
  formatHora,
  mensajeDomicilio,
} from "@/lib/domicilios";
import { fechaColombia, linkWhatsapp } from "@/lib/estado";
import { fechaColombiaMasDias, formatFecha } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { Domicilio } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DomiciliosPage() {
  const supabase = await createClient();
  const hoy = fechaColombia(new Date());
  const manana = fechaColombiaMasDias(1);

  const { data, error } = await supabase
    .from("domicilios")
    .select("*")
    .or(
      `estado.in.(${ESTADOS_ACTIVOS.join(",")}),fecha.gte.${fechaColombiaMasDias(-30)}`,
    )
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true })
    .limit(500);

  const domicilios = (data ?? []) as Domicilio[];

  // Número de recibo → orden, para enlazar el domicilio con su maleta.
  const recibos = Array.from(
    new Set(domicilios.map((d) => d.numero_recibo).filter((r): r is string => Boolean(r))),
  );
  const ordenPorRecibo = new Map<string, string>();
  if (recibos.length > 0) {
    const { data: ordenes } = await supabase
      .from("ordenes")
      .select("id, numero_recibo")
      .in("numero_recibo", recibos);
    for (const o of ordenes ?? []) {
      if (!ordenPorRecibo.has(o.numero_recibo)) ordenPorRecibo.set(o.numero_recibo, o.id);
    }
  }

  const activos = domicilios.filter((d) => ESTADOS_ACTIVOS.includes(d.estado));
  const porConfirmar = activos.filter((d) => d.estado === "nuevo");
  const programados = activos.filter((d) => d.estado !== "nuevo");

  const secciones: { titulo: string; lista: Domicilio[]; resaltar?: boolean }[] = [
    { titulo: "Por confirmar", lista: porConfirmar, resaltar: true },
    { titulo: "Atrasados", lista: programados.filter((d) => d.fecha < hoy), resaltar: true },
    { titulo: "Hoy", lista: programados.filter((d) => d.fecha === hoy) },
    { titulo: "Mañana", lista: programados.filter((d) => d.fecha === manana) },
    { titulo: "Próximos", lista: programados.filter((d) => d.fecha > manana) },
    {
      titulo: "Historial (últimos 30 días)",
      lista: domicilios
        .filter((d) => !ESTADOS_ACTIVOS.includes(d.estado))
        .sort((a, b) => (a.fecha + a.hora < b.fecha + b.hora ? 1 : -1)),
    },
  ];

  function Tarjeta({ d }: { d: Domicilio }) {
    const estado = ESTADOS_DOMICILIO[d.estado];
    const ordenId = d.numero_recibo ? ordenPorRecibo.get(d.numero_recibo) : undefined;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{d.cliente_nombre}</p>
            <p className="text-sm text-slate-500">{d.cliente_telefono}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-sm font-bold text-slate-800">
              {formatFecha(d.fecha)} · {formatHora(d.hora)}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.badge}`}>
              {estado.label}
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-700">
          {d.direccion}
          {d.barrio ? ` · ${d.barrio}` : ""}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {TIPOS_DOMICILIO[d.tipo].label} · {formatMoney(d.costo)}
          {d.origen === "formulario" ? " · Formulario del cliente" : " · Registrado en el taller"}
        </p>
        {d.numero_recibo ? (
          <p className="mt-1 text-xs">
            {ordenId ? (
              <Link href={`/ordenes/${ordenId}`} className="font-medium text-blue-700 underline">
                Recibo #{d.numero_recibo}
              </Link>
            ) : (
              <span className="text-slate-500">Recibo #{d.numero_recibo} (no encontrado)</span>
            )}
          </p>
        ) : null}
        {d.notas ? <p className="mt-1 text-xs italic text-slate-500">“{d.notas}”</p> : null}
        <DomicilioAcciones
          id={d.id}
          estado={d.estado}
          hrefConfirmar={linkWhatsapp(d.cliente_telefono, mensajeDomicilio(d, "confirmar"))}
          hrefEnCamino={linkWhatsapp(d.cliente_telefono, mensajeDomicilio(d, "en_camino"))}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ActualizacionAutomatica />
      <AppHeader
        title="Domicilios"
        backHref="/"
        action={
          <Link
            href="/domicilios/nuevo"
            className="flex h-9 items-center justify-center rounded-full bg-slate-900 px-3 text-sm font-semibold text-white active:bg-slate-700"
          >
            + Nuevo
          </Link>
        }
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4 pb-10">
        {error ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            No se pudieron cargar los domicilios: {error.message}
          </div>
        ) : null}

        {!error && domicilios.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-slate-500">
            <p className="font-medium">Todavía no hay domicilios</p>
            <p className="mt-1 text-sm">
              El link del formulario para los clientes es{" "}
              <span className="font-mono text-xs">/domicilio</span>
            </p>
          </div>
        ) : null}

        {secciones
          .filter((s) => s.lista.length > 0)
          .map((s) => (
            <section key={s.titulo} className="flex flex-col gap-3">
              <h2
                className={`text-sm font-semibold uppercase tracking-wide ${
                  s.resaltar ? "text-red-700" : "text-slate-500"
                }`}
              >
                {s.titulo} ({s.lista.length})
              </h2>
              {s.lista.map((d) => (
                <Tarjeta key={d.id} d={d} />
              ))}
            </section>
          ))}
      </main>
    </div>
  );
}
