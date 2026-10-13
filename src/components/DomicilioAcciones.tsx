"use client";

import { useState, useTransition } from "react";
import { cambiarEstadoDomicilio } from "@/app/domicilios/actions";
import type { EstadoDomicilio } from "@/types/database";

const boton =
  "rounded-lg px-3 py-2 text-center text-sm font-semibold disabled:opacity-60";

// Confirmar y "en camino" abren WhatsApp con el mensaje ya escrito (es
// un link normal para que el navegador no lo bloquee) y a la vez
// actualizan el estado del domicilio.
export function DomicilioAcciones({
  id,
  estado,
  hrefConfirmar,
  hrefEnCamino,
}: {
  id: string;
  estado: EstadoDomicilio;
  hrefConfirmar: string;
  hrefEnCamino: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);

  function cambiar(nuevo: EstadoDomicilio) {
    startTransition(async () => {
      const res = await cambiarEstadoDomicilio(id, nuevo);
      setError(res?.error ?? null);
      setCancelando(false);
    });
  }

  if (estado === "hecho" || estado === "cancelado") {
    return (
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => cambiar("confirmado")}
          className="text-xs font-medium text-slate-500 underline disabled:opacity-60"
        >
          Reabrir
        </button>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {estado === "nuevo" ? (
          <a
            href={hrefConfirmar}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => cambiar("confirmado")}
            className={`${boton} col-span-2 bg-emerald-600 text-white active:bg-emerald-700`}
          >
            Confirmar por WhatsApp
          </a>
        ) : null}
        {estado === "confirmado" ? (
          <a
            href={hrefEnCamino}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => cambiar("en_camino")}
            className={`${boton} bg-amber-500 text-white active:bg-amber-600`}
          >
            Avisar: en camino
          </a>
        ) : null}
        {estado !== "nuevo" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => cambiar("hecho")}
            className={`${boton} bg-slate-900 text-white active:bg-slate-700 ${
              estado === "en_camino" ? "col-span-2" : ""
            }`}
          >
            Marcar hecho
          </button>
        ) : null}
      </div>
      {cancelando ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
          <span className="text-red-800">¿Cancelar este domicilio?</span>
          <span className="flex gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => cambiar("cancelado")}
              className="font-semibold text-red-700 disabled:opacity-60"
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => setCancelando(false)}
              className="text-slate-500"
            >
              No
            </button>
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCancelando(true)}
          className="self-start text-xs font-medium text-red-600 underline"
        >
          Cancelar domicilio
        </button>
      )}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
