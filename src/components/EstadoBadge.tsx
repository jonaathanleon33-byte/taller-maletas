import type { Orden } from "@/types/database";
import { ESTADO_LABELS, estaAtrasada, getEstadoClasses } from "@/lib/estado";

export function EstadoBadge({
  orden,
}: {
  orden: Pick<Orden, "estado" | "fecha_recibido">;
}) {
  const classes = getEstadoClasses(orden);
  const atrasada = estaAtrasada(orden);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${classes.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${classes.dot}`} />
      {atrasada ? "Atrasada" : ESTADO_LABELS[orden.estado]}
    </span>
  );
}
