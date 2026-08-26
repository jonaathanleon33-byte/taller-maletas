import { AgregarItemForm } from "@/components/AgregarItemForm";
import { ItemRow } from "@/components/ItemRow";
import { ComprobanteConfigForm } from "@/components/ComprobanteConfigForm";
import { calcularTotales, formatMoney } from "@/lib/money";
import type { Comprobante, ComprobanteItem, Servicio } from "@/types/database";

export function ComprobanteEditor({
  path,
  comprobante,
  items,
  servicios,
  tecnicos,
}: {
  path: string;
  comprobante: Comprobante;
  items: ComprobanteItem[];
  servicios: Servicio[];
  tecnicos: string[];
}) {
  const { subtotal, total } = calcularTotales(
    items,
    comprobante.descuento_global,
    comprobante.impuestos,
  );

  return (
    <>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Ítems
          </h2>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              comprobante.pagado
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {comprobante.pagado ? "Pagado" : "Pendiente de pago"}
          </span>
        </div>

        {items.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <ItemRow key={item.id} path={path} item={item} />
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-sm text-slate-500">
            Sin ítems todavía.
          </p>
        )}

        <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          {comprobante.descuento_global > 0 ? (
            <div className="flex justify-between text-slate-600">
              <span>Descuento global</span>
              <span>-{formatMoney(comprobante.descuento_global)}</span>
            </div>
          ) : null}
          {comprobante.impuestos > 0 ? (
            <div className="flex justify-between text-slate-600">
              <span>Impuestos</span>
              <span>{formatMoney(comprobante.impuestos)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
          {comprobante.abono > 0 ? (
            <>
              <div className="flex justify-between text-slate-600">
                <span>Abono</span>
                <span>-{formatMoney(comprobante.abono)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1 text-base font-semibold text-slate-900">
                <span>Saldo pendiente</span>
                <span>{formatMoney(total - comprobante.abono)}</span>
              </div>
            </>
          ) : null}
        </div>
      </section>

      <AgregarItemForm
        path={path}
        comprobanteId={comprobante.id}
        servicios={servicios}
      />

      <ComprobanteConfigForm
        path={path}
        comprobante={comprobante}
        tecnicos={tecnicos}
      />
    </>
  );
}
