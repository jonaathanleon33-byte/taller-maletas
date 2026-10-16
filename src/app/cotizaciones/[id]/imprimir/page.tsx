import Link from "next/link";
import { notFound } from "next/navigation";
import { BotonImprimir } from "@/components/BotonImprimir";
import { createClient } from "@/lib/supabase/server";
import { obtenerNegocioConfig } from "@/lib/negocio";
import { numeroCotizacion, totalCotizacion } from "@/lib/cotizaciones";
import { formatFecha, formatFechaHora } from "@/lib/format";
import { calcularSubtotalItem, formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

// Vista de la cotización para mostrar o imprimir. No es una factura:
// lo dice el pie y no consume ningún consecutivo.
export default async function ImprimirCotizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: cotizacion } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!cotizacion) notFound();

  const [{ data: items }, negocio] = await Promise.all([
    supabase
      .from("cotizacion_items")
      .select("*")
      .eq("cotizacion_id", id)
      .order("created_at", { ascending: true }),
    obtenerNegocioConfig(),
  ]);
  const lista = items ?? [];
  const { subtotal, iva, total } = totalCotizacion(cotizacion, lista);

  return (
    <div className="mx-auto w-full max-w-2xl bg-white p-6 print:p-0">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href={`/cotizaciones/${id}`} className="text-sm font-medium text-slate-600 underline">
          Volver
        </Link>
        <BotonImprimir />
      </div>

      <header className="border-b border-slate-300 pb-3 text-center">
        {negocio.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={negocio.logo_url} alt="" className="mx-auto mb-2 h-14 object-contain" />
        ) : null}
        <p className="text-lg font-bold text-slate-900">{negocio.nombre}</p>
        <p className="text-xs text-slate-600">{negocio.nit} · {negocio.direccion} · {negocio.telefono}</p>
      </header>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <p className="text-xl font-bold text-slate-900">COTIZACIÓN</p>
          <p className="text-sm text-slate-600">{formatFechaHora(cotizacion.created_at)}</p>
        </div>
        <p className="text-xl font-bold text-slate-900">{numeroCotizacion(cotizacion.numero)}</p>
      </div>

      <div className="mt-4 text-sm text-slate-800">
        <p><span className="font-semibold">Cliente:</span> {cotizacion.cliente_nombre}</p>
        <p><span className="font-semibold">Teléfono:</span> {cotizacion.cliente_telefono}</p>
        <p><span className="font-semibold">Maleta:</span> {cotizacion.descripcion}</p>
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-300 text-left text-xs uppercase text-slate-500">
            <th className="py-1">Descripción</th>
            <th className="py-1 text-right">Cant.</th>
            <th className="py-1 text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((i) => (
            <tr key={i.id} className="border-b border-slate-100">
              <td className="py-1.5">
                {i.descripcion}
                {i.descuento_pct > 0 ? <span className="text-xs text-slate-400"> (-{i.descuento_pct}%)</span> : null}
              </td>
              <td className="py-1.5 text-right">{i.cantidad}</td>
              <td className="py-1.5 text-right">{formatMoney(calcularSubtotalItem(i))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 ml-auto w-56 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
        {cotizacion.descuento_global > 0 ? (
          <div className="flex justify-between"><span>Descuento</span><span>-{formatMoney(cotizacion.descuento_global)}</span></div>
        ) : null}
        {cotizacion.incluye_iva ? (
          <div className="flex justify-between"><span>IVA (19 %)</span><span>{formatMoney(iva)}</span></div>
        ) : null}
        <div className="flex justify-between border-t border-slate-300 pt-1 text-base font-bold">
          <span>Total</span><span>{formatMoney(total)}</span>
        </div>
      </div>

      {cotizacion.notas ? <p className="mt-4 text-sm text-slate-700">{cotizacion.notas}</p> : null}
      <p className="mt-6 text-xs text-slate-500">
        {cotizacion.vigencia_hasta ? `Cotización válida hasta el ${formatFecha(cotizacion.vigencia_hasta)}. ` : ""}
        Este documento es una cotización informativa, no es una factura ni
        un recibo de pago.
      </p>
    </div>
  );
}
