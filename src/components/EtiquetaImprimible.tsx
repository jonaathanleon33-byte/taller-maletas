import { TAMANO_LABELS, TIPO_LABELS } from "@/lib/estado";
import { formatFecha } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { Orden } from "@/types/database";

export function EtiquetaImprimible({
  id,
  negocioNombre,
  orden,
  precioFinal,
}: {
  id?: string;
  negocioNombre: string;
  orden: Orden;
  precioFinal?: number | null;
}) {
  return (
    <div
      id={id}
      className="mx-auto w-[320px] bg-white p-2 font-sans leading-relaxed text-black print:max-w-[54mm] print:leading-snug print:font-bold"
    >
      {/* Espacio en blanco al inicio: el cabezal de la impresora
          térmica imprime más claro en los primeros milímetros hasta
          "calentar" — mejor perder ese margen en blanco que en el
          nombre del negocio. */}
      <div className="h-16" />

      <p className="text-center text-sm font-bold uppercase tracking-wide print:text-[13px]">
        {negocioNombre}
      </p>

      <p className="mt-1 text-center text-3xl font-black print:text-[24px]">
        #{orden.numero_recibo}
      </p>

      {orden.fecha_prometida ? (
        <p className="text-center text-base font-bold print:text-[13px]">
          Entrega {formatFecha(orden.fecha_prometida)}
        </p>
      ) : null}

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-sm font-bold uppercase tracking-wide text-slate-500 print:text-[11px] print:text-black">
        Cliente
      </p>
      <p className="text-lg font-bold print:text-[15px]">{orden.cliente_nombre}</p>
      <p className="text-base font-bold print:text-[13px]">{orden.cliente_telefono}</p>

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-sm font-bold uppercase tracking-wide text-slate-500 print:text-[11px] print:text-black">
        Maleta
      </p>
      <p className="text-lg font-bold print:text-[15px]">
        {orden.marca} {orden.color}
      </p>
      <p className="text-base font-bold print:text-[13px]">
        {TAMANO_LABELS[orden.tamano]} · {TIPO_LABELS[orden.tipo]}
      </p>

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-sm font-bold uppercase tracking-wide text-slate-500 print:text-[11px] print:text-black">
        Servicio
      </p>
      <p className="text-lg font-bold print:text-[15px]">{orden.dano_descripcion}</p>

      {precioFinal ? (
        <>
          <hr className="my-2 border-dashed border-black print:my-1" />

          <p className="text-sm font-bold uppercase tracking-wide text-slate-500 print:text-[11px] print:text-black">
            Total a pagar
          </p>
          <p className="text-2xl font-black print:text-[20px]">
            {formatMoney(precioFinal)}
          </p>
        </>
      ) : null}
    </div>
  );
}
