import Link from "next/link";
import type { Orden } from "@/types/database";
import {
  ESTADO_LABELS,
  TAMANO_LABELS,
  TIPO_LABELS,
  DIAS_PLAZO_RECOGIDA,
  bodegajePendiente,
  debeRenotificar,
  destruccionVencida,
  diasDesdeNotificacion,
  diasDesdeSegundoAviso,
  diasSinEntregar,
  esEntregada,
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

// Línea chica en la tarjeta: cuándo se le avisó al cliente que su maleta
// estaba lista, y en ámbar cuando ya toca volver a avisarle.
export function AvisoNotificacion({
  orden,
}: {
  orden: Pick<Orden, "estado" | "notificada_lista_en" | "segunda_notificacion_en">;
}) {
  const diasSegundo = diasDesdeSegundoAviso(orden);
  if (diasSegundo !== null) {
    if (destruccionVencida(orden)) {
      return (
        <p className="mt-1 text-xs font-semibold text-red-700">
          Pasaron 6 meses del segundo aviso · puede enviarse a destrucción
        </p>
      );
    }
    const bodegaje = bodegajePendiente(orden);
    if (bodegaje) {
      return (
        <p className="mt-1 text-xs font-semibold text-red-700">
          Plazo vencido · cobrar bodegaje {formatMoney(bodegaje.monto)}
        </p>
      );
    }
    const faltan = DIAS_PLAZO_RECOGIDA - diasSegundo;
    return (
      <p className="mt-1 text-xs text-slate-500">
        2.º aviso hace {diasSegundo} {diasSegundo === 1 ? "día" : "días"} · faltan{" "}
        {faltan} {faltan === 1 ? "día hábil" : "días hábiles"} de plazo
      </p>
    );
  }

  const dias = diasDesdeNotificacion(orden);
  if (dias === null) return null;

  const bodegajePrimero = bodegajePendiente(orden);
  if (bodegajePrimero) {
    return (
      <p className="mt-1 text-xs font-semibold text-red-700">
        Plazo vencido · cobrar bodegaje {formatMoney(bodegajePrimero.monto)} · avisada hace {dias} días
      </p>
    );
  }

  if (debeRenotificar(orden)) {
    return (
      <p className="mt-1 text-xs font-semibold text-amber-700">
        Volver a notificar · avisada hace {dias} {dias === 1 ? "día" : "días"}
      </p>
    );
  }

  return (
    <p className="mt-1 text-xs text-slate-400">
      Notificada {dias === 0 ? "hoy" : `hace ${dias} ${dias === 1 ? "día" : "días"}`}
    </p>
  );
}

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
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-base font-bold text-slate-800">
            #{orden.numero_recibo}
          </span>
          <EstadoBadge orden={orden} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
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
        {esEntregada(orden.estado)
          ? ESTADO_LABELS[orden.estado]
          : `${dias} ${dias === 1 ? "día" : "días"} sin entregar`}
      </div>
      <AvisoNotificacion orden={orden} />

      {resumen ? (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <ResumenPago resumen={resumen} />
        </div>
      ) : null}
    </Link>
  );
}
