"use client";

import { useState, useTransition } from "react";
import { actualizarDescripcionOrden } from "@/app/ordenes/[id]/actions";

export function DescripcionArregloRow({
  ordenId,
  descripcion,
}: {
  ordenId: string;
  descripcion: string;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(descripcion);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function cancelar() {
    setValor(descripcion);
    setError(null);
    setEditando(false);
  }

  function guardar() {
    startTransition(async () => {
      const resultado = await actualizarDescripcionOrden(ordenId, valor);
      if (resultado?.error) {
        setError(resultado.error);
        return;
      }
      setError(null);
      setEditando(false);
    });
  }

  if (editando) {
    return (
      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="mb-1 text-sm text-slate-500">Descripción del arreglo</p>
        <textarea
          autoFocus
          rows={4}
          disabled={pending}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
        />
        {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
        <div className="mt-2 flex justify-end gap-3 text-sm">
          <button
            type="button"
            onClick={cancelar}
            disabled={pending}
            className="text-slate-400 active:text-slate-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={pending}
            className="font-medium text-emerald-600 active:text-emerald-800 disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm text-slate-500">Descripción del arreglo</p>
        <button
          type="button"
          onClick={() => setEditando(true)}
          aria-label="Editar descripción del arreglo"
          className="rounded-full bg-blue-50 p-1 text-blue-600 active:bg-blue-100 active:text-blue-800"
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
      </div>
      <p className="whitespace-pre-wrap text-sm text-slate-900">{descripcion}</p>
    </div>
  );
}
