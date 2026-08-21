import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { EstadoBadge } from "@/components/EstadoBadge";
import { CambiarEstadoForm } from "@/components/CambiarEstadoForm";
import { EliminarOrdenButton } from "@/components/EliminarOrdenButton";
import { InfoRow } from "@/components/InfoRow";
import { createClient } from "@/lib/supabase/server";
import {
  ESTADO_LABELS,
  TAMANO_LABELS,
  TIPO_LABELS,
  linkWhatsapp,
  mensajeWhatsapp,
} from "@/lib/estado";
import { formatFecha, formatFechaHora } from "@/lib/format";
import { calcularTotales, formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function OrdenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: orden }, { data: fotos }, { data: historial }, { data: comprobante }] =
    await Promise.all([
      supabase.from("ordenes").select("*").eq("id", id).single(),
      supabase
        .from("fotos")
        .select("*")
        .eq("orden_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("historial_estados")
        .select("*")
        .eq("orden_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("comprobantes").select("*").eq("orden_id", id).maybeSingle(),
    ]);

  if (!orden) {
    notFound();
  }

  const { data: comprobanteItems } = comprobante
    ? await supabase
        .from("comprobante_items")
        .select("*")
        .eq("comprobante_id", comprobante.id)
    : { data: null };

  const comprobanteTotal = comprobante
    ? calcularTotales(
        comprobanteItems ?? [],
        comprobante.descuento_global,
        comprobante.impuestos,
      ).total
    : null;

  const mensaje = mensajeWhatsapp(orden);
  const whatsappHref = linkWhatsapp(orden.cliente_telefono, mensaje);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title={`Recibo #${orden.numero_recibo}`} backHref="/" />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4 pb-10">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {orden.cliente_nombre}
            </h2>
            <EstadoBadge orden={orden} />
          </div>

          <div className="divide-y divide-slate-100">
            <InfoRow label="Teléfono">{orden.cliente_telefono}</InfoRow>
            <InfoRow label="Maleta">
              {orden.marca} {orden.color}
            </InfoRow>
            <InfoRow label="Tamaño / tipo">
              {TAMANO_LABELS[orden.tamano]} · {TIPO_LABELS[orden.tipo]}
            </InfoRow>
            <InfoRow label="Ubicación">{orden.ubicacion}</InfoRow>
            <InfoRow label="Técnico asignado">
              {orden.tecnico_asignado || "—"}
            </InfoRow>
            <InfoRow label="Recibida">
              {formatFechaHora(orden.fecha_recibido)}
            </InfoRow>
            <InfoRow label="Fecha prometida">
              {formatFecha(orden.fecha_prometida)}
            </InfoRow>
            <InfoRow label="Entregada">
              {formatFechaHora(orden.fecha_entregada)}
            </InfoRow>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="mb-1 text-sm text-slate-500">Daño reportado</p>
            <p className="text-sm text-slate-900">{orden.dano_descripcion}</p>
          </div>
        </section>

        {fotos && fotos.length > 0 ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Fotos
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {fotos.map((foto) => (
                <a
                  key={foto.id}
                  href={foto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto.url}
                    alt="Foto de la maleta"
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <Link
          href={`/ordenes/nueva?recibo=${encodeURIComponent(orden.numero_recibo)}&cliente=${encodeURIComponent(orden.cliente_nombre)}&telefono=${encodeURIComponent(orden.cliente_telefono)}`}
          className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white py-3 text-center text-sm font-semibold text-slate-700 active:bg-slate-50"
        >
          + Agregar otra maleta a este recibo
        </Link>

        <Link
          href={`/ordenes/${orden.id}/comprobante`}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 active:bg-slate-50"
        >
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Comprobante
          </span>
          <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
            {comprobante ? (
              <>
                {formatMoney(comprobanteTotal ?? 0)}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    comprobante.pagado
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {comprobante.pagado ? "Pagado" : "Pendiente"}
                </span>
              </>
            ) : (
              "Crear →"
            )}
          </span>
        </Link>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Cambiar estado
          </h2>
          <CambiarEstadoForm ordenId={orden.id} estadoActual={orden.estado} />
        </section>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-center text-base font-semibold text-white active:bg-emerald-700"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.62-.6-2.84-1.23-4.7-4.1-4.84-4.29-.14-.19-1.16-1.54-1.16-2.94s.73-2.09.99-2.38c.26-.28.56-.35.75-.35.19 0 .38 0 .54.01.17.01.4-.07.63.48.24.57.81 1.98.88 2.12.07.14.12.31.02.5-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.28.36-.23.6-.14.24.09 1.53.72 1.79.85.26.13.43.19.5.3.07.11.07.63-.17 1.31z" />
          </svg>
          Notificar por WhatsApp
        </a>

        {historial && historial.length > 0 ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Historial de estados
            </h2>
            <ol className="flex flex-col gap-3">
              {historial.map((item) => (
                <li key={item.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">
                      {item.estado_anterior
                        ? `${ESTADO_LABELS[item.estado_anterior]} → ${ESTADO_LABELS[item.estado_nuevo]}`
                        : `Creada como ${ESTADO_LABELS[item.estado_nuevo]}`}
                    </p>
                    <p className="text-slate-400">
                      {formatFechaHora(item.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <EliminarOrdenButton ordenId={orden.id} />
      </main>
    </div>
  );
}
