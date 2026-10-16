"use client";

import { useState, useTransition } from "react";
import { cambiarEstadoCotizacion, eliminarCotizacion } from "@/app/cotizaciones/actions";
import type { EstadoCotizacion } from "@/types/database";

const boton = "rounded-lg px-3 py-2.5 text-center text-sm font-semibold disabled:opacity-60";

export function CotizacionAcciones({
  id,
  estado,
  hrefWhatsapp,
  hrefOrden,
}: {
  id: string;
  estado: EstadoCotizacion;
  hrefWhatsapp: string;
  hrefOrden: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  function cambiar(nuevo: EstadoCotizacion) {
    startTransition(async () => {
      const res = await cambiarEstadoCotizacion(id, nuevo);
      setError(res?.error ?? null);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <a href={hrefWhatsapp} target="_blank" rel="noopener noreferrer" className={`${boton} bg-emerald-600 text-white active:bg-emerald-700`}>
        Enviar por WhatsApp
      </a>
      <a href={`/cotizaciones/${id}/imprimir`} className={`${boton} bg-blue-600 text-white active:bg-blue-700`}>
        Ver / imprimir
      </a>

      <div className="grid grid-cols-2 gap-2">
        {estado !== "aprobada" ? (
          <button type="button" disabled={pending} onClick={() => cambiar("aprobada")} className={`${boton} border border-emerald-300 bg-emerald-50 text-emerald-800`}>
            Marcar aprobada
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => cambiar("pendiente")} className={`${boton} border border-slate-300 bg-white text-slate-700`}>
            Volver a pendiente
          </button>
        )}
        {estado !== "rechazada" ? (
          <button type="button" disabled={pending} onClick={() => cambiar("rechazada")} className={`${boton} border border-red-300 bg-red-50 text-red-800`}>
            Marcar rechazada
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => cambiar("pendiente")} className={`${boton} border border-slate-300 bg-white text-slate-700`}>
            Volver a pendiente
          </button>
        )}
      </div>

      <a href={hrefOrden} className={`${boton} bg-slate-900 text-white active:bg-slate-700`}>
        Crear orden con estos datos
      </a>

      {confirmando ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
          <span className="text-red-800">¿Eliminar esta cotización?</span>
          <span className="flex gap-3">
            <button type="button" disabled={pending} onClick={() => startTransition(async () => { const res = await eliminarCotizacion(id); if (res?.error) setError(res.error); })} className="font-semibold text-red-700 disabled:opacity-60">Sí</button>
            <button type="button" onClick={() => setConfirmando(false)} className="text-slate-500">No</button>
          </span>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmando(true)} className="self-start text-xs font-medium text-red-600 underline">
          Eliminar cotización
        </button>
      )}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
