import Link from "next/link";
import type { Orden } from "@/types/database";
import {
  TAMANO_LABELS,
  TIPO_LABELS,
  diasSinEntregar,
  getEstadoClasses,
} from "@/lib/estado";
import { EstadoBadge } from "@/components/EstadoBadge";
import { formatMoney } from "@/lib/money";

export type ComprobanteResumen = {
  total: number;
  abono: number;
  saldoPendiente: number;
  pagado: boolean;
};

export function ResumenPago({ resumen }: { resumen: ComprobanteResumen }) {
  if (resumen.pagado) {
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
          Pagado
        </span>
        <span className="font-medium text-slate-700">
          {formatMoney(resumen.total)}
        </span>
      </div>
    );
  }

  if (resumen.abono > 0) {
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
          Abono {formatMoney(resumen.abono)}
        </span>
        <span className="font-medium text-slate-700">
          Saldo {formatMoney(resumen.saldoPendiente)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
        Sin abono
      </span>
      <span className="font-medium text-slate-700">
        {formatMoney(resumen.total)}
      </span>
    </div>
  );
}

export function OrdenCard({
  orden,
  resumen,
}: {
  orden: Orden;
  resumen?: ComprobanteResumen;
}) {
  const classes = getEstadoClasses(orden);
  const dias = diasSinEntregar(orden);

  return (
    <Link
      href={`/ordenes/${orden.id}`}
      className={`block rounded-lg border border-slate-200 border-l-4 bg-white p-4 shadow-sm active:bg-slate-50 ${classes.bar}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">
            {orden.cliente_nombre}
          </p>
          <p className="text-sm text-slate-500">{orden.cliente_telefono}</p>
        </div>
        <EstadoBadge orden={orden} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
        <span className="font-medium text-slate-800">
          #{orden.numero_recibo}
        </span>
        <span>·</span>
        <span>
          {orden.marca} {orden.color}
        </span>
        <span>·</span>
        <span>
          {TAMANO_LABELS[orden.tamano]} · {TIPO_LABELS[orden.tipo]}
        </span>
      </div>

      <p className="mt-1 truncate text-sm text-slate-500">
        {orden.dano_descripcion}
      </p>

      <div className="mt-2 text-xs text-slate-400">
        {orden.estado === "entregada"
          ? "Entregada"
          : `${dias} ${dias === 1 ? "día" : "días"} sin entregar`}
      </div>

      {resumen ? (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <ResumenPago resumen={resumen} />
        </div>
      ) : null}
    </Link>
  );
}
