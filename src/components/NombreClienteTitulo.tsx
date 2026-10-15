"use client";

import { useState, useTransition } from "react";
import type { AccionResultado } from "@/lib/accion";

// Nombre del cliente en el encabezado de la orden, editable. El cambio
// aplica a todas las maletas del mismo recibo.
export function NombreClienteTitulo({
  nombre,
  guardarNombre,
  compacto = false,
}: {
  nombre: string;
  guardarNombre: (nombre: string) => Promise<AccionResultado>;
  compacto?: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(nombre);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function cancelar() {
    setValor(nombre);
    setError(null);
    setEditando(false);
  }

  function guardar() {
    if (!valor.trim()) {
      setError("Escribe un nombre.");
      return;
    }
    startTransition(async () => {
      const res = await guardarNombre(valor);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setError(null);
      setEditando(false);
    });
  }

  if (editando) {
    return (
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            disabled={pending}
            value={valor}
            maxLength={100}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                guardar();
              } else if (e.key === "Escape") {
                cancelar();
              }
            }}
            className={`min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-slate-900 focus:border-slate-500 focus:outline-none ${compacto ? "text-sm" : "text-base font-semibold"}`}
          />
          <button
            type="button"
            onClick={guardar}
            disabled={pending}
            className="text-sm font-medium text-emerald-600 active:text-emerald-800 disabled:opacity-60"
          >
            {pending ? "…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={cancelar}
            disabled={pending}
            className="text-sm text-slate-400 active:text-slate-600"
          >
            Cancelar
          </button>
        </div>
        {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <h2
      className={`flex min-w-0 items-center gap-1.5 text-slate-900 ${
        compacto ? "text-sm font-medium" : "text-lg font-semibold"
      }`}
    >
      <span className="truncate">{nombre}</span>
      <button
        type="button"
        onClick={() => setEditando(true)}
        aria-label="Editar nombre del cliente"
        className="shrink-0 rounded-full bg-blue-50 p-1 text-blue-600 active:bg-blue-100 active:text-blue-800"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
          <path
            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </h2>
  );
}
