import Link from "next/link";
import type { Orden } from "@/types/database";
import {
  TAMANO_LABELS,
  TIPO_LABELS,
  diasSinEntregar,
  getEstadoClasses,
} from "@/lib/estado";
import { EstadoBadge } from "@/components/EstadoBadge";

export function OrdenCard({ orden }: { orden: Orden }) {
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

      <div className="mt-2 text-xs text-slate-400">
        {orden.estado === "entregada"
          ? "Entregada"
          : `${dias} ${dias === 1 ? "día" : "días"} sin entregar`}
      </div>
    </Link>
  );
}
