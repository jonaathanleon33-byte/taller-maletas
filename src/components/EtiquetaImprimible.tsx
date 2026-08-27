import { TAMANO_LABELS, TIPO_LABELS } from "@/lib/estado";
import { formatFecha } from "@/lib/format";
import type { Orden } from "@/types/database";

export function EtiquetaImprimible({
  negocioNombre,
  orden,
}: {
  negocioNombre: string;
  orden: Orden;
}) {
  return (
    <div className="mx-auto w-full max-w-[320px] font-sans leading-relaxed text-black print:max-w-[54mm] print:leading-snug print:font-bold">
      <p className="text-center text-[11px] font-bold uppercase tracking-wide print:text-[11px]">
        {negocioNombre}
      </p>

      <p className="mt-1 text-center text-2xl font-black print:text-[20px]">
        #{orden.numero_recibo}
      </p>

      {orden.fecha_prometida ? (
        <p className="text-center text-sm font-bold print:text-[11px]">
          Entrega {formatFecha(orden.fecha_prometida)}
        </p>
      ) : null}

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 print:text-[9px] print:text-black">
        Cliente
      </p>
      <p className="text-base font-bold print:text-[13px]">{orden.cliente_nombre}</p>
      <p className="text-sm font-bold print:text-[11px]">{orden.cliente_telefono}</p>

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 print:text-[9px] print:text-black">
        Maleta
      </p>
      <p className="text-base font-bold print:text-[13px]">
        {orden.marca} {orden.color}
      </p>
      <p className="text-sm font-bold print:text-[11px]">
        {TAMANO_LABELS[orden.tamano]} · {TIPO_LABELS[orden.tipo]}
      </p>

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 print:text-[9px] print:text-black">
        Servicio
      </p>
      <p className="text-base font-bold print:text-[13px]">{orden.dano_descripcion}</p>
    </div>
  );
}
