import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { EstadoBadge } from "@/components/EstadoBadge";
import { CambiarEstadoForm } from "@/components/CambiarEstadoForm";
import { EliminarOrdenButton } from "@/components/EliminarOrdenButton";
import { InfoRow } from "@/components/InfoRow";
import { TelefonoClienteRow } from "@/components/TelefonoClienteRow";
import { TecnicoAsignadoRow } from "@/components/TecnicoAsignadoRow";
import { EntregarYCobrarButton } from "@/components/EntregarYCobrarButton";
import { NavegacionMaletas } from "@/components/NavegacionMaletas";
import { NotificarWhatsappButton } from "@/components/NotificarWhatsappButton";
import { DescripcionArregloRow } from "@/components/DescripcionArregloRow";
import { createClient } from "@/lib/supabase/server";
import {
  ESTADO_LABELS,
  TAMANO_LABELS,
  TECNICOS,
  TIPO_LABELS,
  BODEGAJE,
  DIAS_PLAZO_RECOGIDA,
  debeRenotificar,
  destruccionVencida,
  diasDesdeNotificacion,
  esEntregada,
  fechaDestruccion,
  plazoVencido,
  linkWhatsapp,
  mensajeWhatsapp,
} from "@/lib/estado";
import { formatFecha, formatFechaHora } from "@/lib/format";
import { calcularTotales, formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function OrdenDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; n?: string }>;
}) {
  const { id } = await params;
  const { aviso, n: fallidas } = await searchParams;
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

  const { data: hermanas } = await supabase
    .from("ordenes")
    .select("id, estado")
    .eq("numero_recibo", orden.numero_recibo)
    .order("created_at", { ascending: true });

  const maletasPendientes = (hermanas ?? []).filter((h) => !esEntregada(h.estado));
  const hayVariasPendientes = maletasPendientes.length > 1;

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
  const renotificar = debeRenotificar(orden);
  const diasNotificada = diasDesdeNotificacion(orden);
  const vencido = plazoVencido(orden);
  const paraDestruccion = destruccionVencida(orden);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title={`Recibo #${orden.numero_recibo}`}
        backHref="/"
        backToHistory
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4 pb-10">
        {aviso === "fotos" ? (
          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-center text-sm font-medium text-red-800">
            La orden se creó, pero {Number(fallidas) > 1 ? `${fallidas} fotos no se subieron` : "una foto no se subió"}.
            Revisa las fotos de la orden y vuelve a tomarlas si hace falta.
          </p>
        ) : null}

        <NavegacionMaletas ordenId={orden.id} hermanas={hermanas ?? []} />

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {orden.cliente_nombre}
            </h2>
            <EstadoBadge orden={orden} />
          </div>

          <div className="divide-y divide-slate-100">
            <TelefonoClienteRow ordenId={orden.id} telefono={orden.cliente_telefono} />
            <InfoRow label="Maleta">
              {orden.marca} {orden.color}
            </InfoRow>
            <InfoRow label="Tamaño / tipo">
              {TAMANO_LABELS[orden.tamano]} · {TIPO_LABELS[orden.tipo]}
            </InfoRow>
            {orden.ubicacion ? (
              <InfoRow label="Ubicación">{orden.ubicacion}</InfoRow>
            ) : null}
            <InfoRow label="Recibido por">{orden.recibido_por || "—"}</InfoRow>
            <TecnicoAsignadoRow
              ordenId={orden.id}
              tecnico={orden.tecnico_asignado}
              tecnicos={TECNICOS}
            />
            <InfoRow label="Recibida">
              {formatFechaHora(orden.fecha_recibido)}
            </InfoRow>
            <InfoRow label="Fecha prometida">
              {formatFecha(orden.fecha_prometida)}
            </InfoRow>
            {orden.estado === "lista" ? (
              <InfoRow label="Notificado">
                {orden.notificada_lista_en ? (
                  <span className={renotificar ? "font-semibold text-amber-700" : ""}>
                    {formatFechaHora(orden.notificada_lista_en)}
                  </span>
                ) : (
                  "Sin notificar"
                )}
              </InfoRow>
            ) : null}
            {orden.estado === "lista" && orden.segunda_notificacion_en ? (
              <InfoRow label="Segundo aviso">
                <span className={vencido ? "font-semibold text-red-700" : ""}>
                  {formatFechaHora(orden.segunda_notificacion_en)}
                </span>
              </InfoRow>
            ) : null}
            <InfoRow label="Entregada">
              {formatFechaHora(orden.fecha_entregada)}
            </InfoRow>
          </div>

          <DescripcionArregloRow
            ordenId={orden.id}
            descripcion={orden.dano_descripcion}
          />
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
          className="flex items-center justify-between gap-3 rounded-lg bg-blue-600 p-4 shadow-md shadow-blue-600/30 active:bg-blue-700"
        >
          <span className="text-sm font-bold uppercase tracking-wide text-white">
            {comprobante ? "Factura" : "+ Crear factura"}
          </span>
          <span className="flex items-center gap-2 text-sm font-medium text-white">
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
              "→"
            )}
          </span>
        </Link>

        {hayVariasPendientes ? (
          <EntregarYCobrarButton
            ordenId={orden.id}
            cantidadMaletas={maletasPendientes.length}
          />
        ) : null}

        {comprobante && comprobanteTotal && comprobanteTotal > 0 && !esEntregada(orden.estado) ? (
          <EntregarYCobrarButton
            ordenId={orden.id}
            comprobanteId={comprobante.id}
            soloEsta={hayVariasPendientes}
          />
        ) : null}

        <Link
          href={`/ordenes/${orden.id}/etiqueta`}
          className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 text-center text-sm font-semibold text-white shadow-md shadow-purple-600/20 active:bg-purple-700"
        >
          Factura en sticker
        </Link>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Cambiar estado
          </h2>
          <CambiarEstadoForm ordenId={orden.id} estadoActual={orden.estado} />
        </section>

        {vencido ? (
          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-center text-sm font-medium text-red-900">
            {paraDestruccion
              ? `Pasaron 6 meses desde el segundo aviso: la maleta puede enviarse a destrucción (desde el ${formatFecha(fechaDestruccion(orden.segunda_notificacion_en!))}). `
              : `Pasaron los ${DIAS_PLAZO_RECOGIDA} días hábiles del segundo aviso: corresponde cobrar bodegaje de ${formatMoney(BODEGAJE)}. Envío a destrucción desde el ${formatFecha(fechaDestruccion(orden.segunda_notificacion_en!))}.`}
          </p>
        ) : null}

        {renotificar ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-center text-sm font-medium text-amber-900">
            Pasaron {diasNotificada} días hábiles (lunes a sábado) desde que le
            avisaste a este cliente que su maleta estaba lista y todavía no la
            recoge. Conviene volver a notificarlo.
          </p>
        ) : null}

        <NotificarWhatsappButton
          ordenId={orden.id}
          href={whatsappHref}
          registrar={orden.estado === "lista"}
          volver={renotificar}
        />

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
