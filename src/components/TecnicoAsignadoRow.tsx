"use client";

import { useState, useTransition } from "react";
import { actualizarTecnicoOrden } from "@/app/ordenes/[id]/actions";

export function TecnicoAsignadoRow({
  ordenId,
  tecnico,
  tecnicos,
}: {
  ordenId: string;
  tecnico: string | null;
  tecnicos: string[];
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(tecnico ?? "");
  const [pending, startTransition] = useTransition();

  function cancelar() {
    setValor(tecnico ?? "");
    setEditando(false);
  }

  function guardar(next: string) {
    setValor(next);
    startTransition(async () => {
      await actualizarTecnicoOrden(ordenId, next);
      setEditando(false);
    });
  }

  if (editando) {
    return (
      <div className="flex items-center justify-between gap-4 py-2 text-sm">
        <span className="text-slate-500">Técnico asignado</span>
        <div className="flex items-center gap-1.5">
          <select
            autoFocus
            disabled={pending}
            value={valor}
            onChange={(e) => guardar(e.target.value)}
            onBlur={cancelar}
            className="rounded border border-slate-300 px-1.5 py-0.5 text-right text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          >
            <option value="">Sin asignar</option>
            {tecnicos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">Técnico asignado</span>
      <span className="flex items-center gap-1.5 text-right font-medium text-slate-900">
        {tecnico || "—"}
        <button
          type="button"
          onClick={() => setEditando(true)}
          aria-label="Editar técnico asignado"
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
