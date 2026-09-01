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

      <p className="text-center text-2xl font-bold uppercase tracking-wide print:text-[21px]">
        {negocioNombre}
      </p>

      <p className="mt-1 text-center text-7xl font-black print:text-[46px]">
        #{orden.numero_recibo}
      </p>

      {orden.fecha_prometida ? (
        <p className="text-center text-3xl font-bold print:text-[21px]">
          Entrega {formatFecha(orden.fecha_prometida)}
        </p>
      ) : null}

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-2xl font-bold uppercase tracking-wide text-slate-500 print:text-[19px] print:text-black">
        Cliente
      </p>
      <p className="text-4xl font-bold print:text-[25px]">{orden.cliente_nombre}</p>
      <p className="text-3xl font-bold print:text-[21px]">{orden.cliente_telefono}</p>

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-2xl font-bold uppercase tracking-wide text-slate-500 print:text-[19px] print:text-black">
        Maleta
      </p>
      <p className="text-4xl font-bold print:text-[25px]">
        {orden.marca} {orden.color}
      </p>
      <p className="text-3xl font-bold print:text-[21px]">
        {TAMANO_LABELS[orden.tamano]} · {TIPO_LABELS[orden.tipo]}
      </p>

      {orden.ubicacion ? (
        <>
          <hr className="my-2 border-dashed border-black print:my-1" />

          <p className="text-2xl font-bold uppercase tracking-wide text-slate-500 print:text-[19px] print:text-black">
            Ubicación
          </p>
          <p className="text-4xl font-bold print:text-[25px]">{orden.ubicacion}</p>
        </>
      ) : null}

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-2xl font-bold uppercase tracking-wide text-slate-500 print:text-[19px] print:text-black">
        Servicio
      </p>
      <p className="text-4xl font-bold print:text-[25px]">{orden.dano_descripcion}</p>

      {precioFinal ? (
        <>
          <hr className="my-2 border-dashed border-black print:my-1" />

          <p className="text-2xl font-bold uppercase tracking-wide text-slate-500 print:text-[19px] print:text-black">
            Total a pagar
          </p>
          <p className="text-6xl font-black print:text-[36px]">
            {formatMoney(precioFinal)}
          </p>
        </>
      ) : null}
    </div>
  );
}
