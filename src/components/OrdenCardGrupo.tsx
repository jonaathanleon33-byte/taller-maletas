import Link from "next/link";
import type { Orden } from "@/types/database";
import {
  TAMANO_LABELS,
  TIPO_LABELS,
  diasSinEntregar,
  getEstadoClasses,
} from "@/lib/estado";
import { EstadoBadge } from "@/components/EstadoBadge";

export function OrdenCardGrupo({ ordenes }: { ordenes: Orden[] }) {
  const primera = ordenes[0];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">
            {primera.cliente_nombre}
          </p>
          <p className="text-sm text-slate-500">{primera.cliente_telefono}</p>
        </div>
        <span className="shrink-0 text-sm font-medium text-slate-800">
          #{primera.numero_recibo}
        </span>
      </div>

      <ul className="mt-3 flex flex-col divide-y divide-slate-100 border-t border-slate-100">
        {ordenes.map((orden) => {
          const classes = getEstadoClasses(orden);
          const dias = diasSinEntregar(orden);
          return (
            <li key={orden.id}>
              <Link
                href={`/ordenes/${orden.id}`}
                className={`-ml-2 flex items-center justify-between gap-2 border-l-4 py-2 pl-2 active:bg-slate-50 ${classes.bar}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-700">
                    {orden.marca} {orden.color} · {TAMANO_LABELS[orden.tamano]} ·{" "}
                    {TIPO_LABELS[orden.tipo]}
                  </p>
                  <p className="text-xs text-slate-400">
                    {orden.estado === "entregada"
                      ? "Entregada"
                      : `${dias} ${dias === 1 ? "día" : "días"} sin entregar`}
                  </p>
                </div>
                <EstadoBadge orden={orden} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
