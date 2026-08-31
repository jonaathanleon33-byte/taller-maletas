"use client";

import { useState, useTransition } from "react";
import { actualizarTelefonoOrden } from "@/app/ordenes/[id]/actions";

export function TelefonoClienteRow({
  ordenId,
  telefono,
}: {
  ordenId: string;
  telefono: string;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(telefono);
  const [pending, startTransition] = useTransition();

  function cancelar() {
    setValor(telefono);
    setEditando(false);
  }

  function guardar() {
    const limpio = valor.trim();
    if (!limpio) return;
    startTransition(async () => {
      await actualizarTelefonoOrden(ordenId, limpio);
      setEditando(false);
    });
  }

  if (editando) {
    return (
      <div className="flex items-center justify-between gap-4 py-2 text-sm">
        <span className="text-slate-500">Teléfono</span>
        <div className="flex items-center gap-1.5">
          <input
            type="tel"
            autoFocus
            disabled={pending}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                guardar();
              } else if (e.key === "Escape") {
                cancelar();
              }
            }}
            className="w-32 rounded border border-slate-300 px-1.5 py-0.5 text-right text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={guardar}
            disabled={pending}
            className="font-medium text-emerald-600 active:text-emerald-800 disabled:opacity-60"
          >
            {pending ? "…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={cancelar}
            disabled={pending}
            className="text-slate-400 active:text-slate-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">Teléfono</span>
      <span className="flex items-center gap-1.5 text-right font-medium text-slate-900">
        {telefono}
        <button
          type="button"
          onClick={() => setEditando(true)}
          aria-label="Editar teléfono"
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
      </span>
    </div>
  );
}
