import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AgregarItemForm } from "@/components/AgregarItemForm";
import { CotizacionAcciones } from "@/components/CotizacionAcciones";
import { CotizacionForm } from "@/components/CotizacionForm";
import { ItemRow } from "@/components/ItemRow";
import { createClient } from "@/lib/supabase/server";
import {
  ESTADOS_COTIZACION,
  estadoVisible,
  mensajeCotizacion,
  numeroCotizacion,
  totalCotizacion,
} from "@/lib/cotizaciones";
import { linkWhatsapp } from "@/lib/estado";
import { formatFecha } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import {
  actualizarPrecioItemCotizacion,
  agregarItemCotizacion,
  eliminarItemCotizacion,
} from "@/app/cotizaciones/actions";

export const dynamic = "force-dynamic";

export default async function CotizacionPage({
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

  const [{ data: items }, { data: servicios }] = await Promise.all([
    supabase
      .from("cotizacion_items")
      .select("*")
      .eq("cotizacion_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("servicios")
      .select("*")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
  ]);

  const lista = items ?? [];
  const { subtotal, iva, total } = totalCotizacion(cotizacion, lista);
  const estado = ESTADOS_COTIZACION[estadoVisible(cotizacion)];
  const hrefOrden = `/ordenes/nueva?cliente=${encodeURIComponent(cotizacion.cliente_nombre)}&telefono=${encodeURIComponent(cotizacion.cliente_telefono)}`;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title={`Cotización ${numeroCotizacion(cotizacion.numero)}`}
        backHref="/cotizaciones"
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4 pb-10">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-slate-900">{cotizacion.cliente_nombre}</h2>
              <p className="text-sm text-slate-500">{cotizacion.cliente_telefono}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${estado.badge}`}>
              {estado.label}
            </span>
          </div>
          <p className="text-sm text-slate-700">{cotizacion.descripcion}</p>
          {cotizacion.vigencia_hasta ? (
            <p className="mt-1 text-xs text-slate-400">Válida hasta el {formatFecha(cotizacion.vigencia_hasta)}</p>
          ) : null}
          {cotizacion.notas ? <p className="mt-1 text-xs italic text-slate-500">“{cotizacion.notas}”</p> : null}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Ítems</h2>
          {lista.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {lista.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  guardarPrecio={actualizarPrecioItemCotizacion.bind(null, id, item.id)}
                  eliminar={eliminarItemCotizacion.bind(null, id, item.id)}
                />
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-slate-500">Sin ítems todavía.</p>
          )}

          <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            {cotizacion.descuento_global > 0 ? (
              <div className="flex justify-between text-slate-600">
                <span>Descuento global</span>
                <span>-{formatMoney(cotizacion.descuento_global)}</span>
              </div>
            ) : null}
            {cotizacion.incluye_iva ? (
              <div className="flex justify-between text-slate-600">
                <span>IVA (19 %)</span>
                <span>{formatMoney(iva)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        </section>

        <AgregarItemForm
          action={agregarItemCotizacion.bind(null, id)}
          servicios={servicios ?? []}
        />

        <CotizacionAcciones
          id={id}
          estado={cotizacion.estado}
          hrefWhatsapp={linkWhatsapp(cotizacion.cliente_telefono, mensajeCotizacion(cotizacion, lista))}
          hrefOrden={hrefOrden}
        />

        <CotizacionForm cotizacion={cotizacion} />
      </main>
    </div>
  );
}
