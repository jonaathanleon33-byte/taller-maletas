"use client";

import { useState, useTransition } from "react";
import { actualizarFechaPrometida } from "@/app/ordenes/[id]/actions";
import { fechaColombiaMasDias, formatFecha } from "@/lib/format";

const ATAJOS = [
  { label: "Hoy", dias: 0 },
  { label: "Mañana", dias: 1 },
  { label: "En 3 días", dias: 3 },
  { label: "En 1 semana", dias: 7 },
];

export function FechaPrometidaRow({
  ordenId,
  fecha,
  maletasDelRecibo,
}: {
  ordenId: string;
  fecha: string | null;
  maletasDelRecibo: number;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(fecha ?? "");
  const [aplicarATodas, setAplicarATodas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function cancelar() {
    setValor(fecha ?? "");
    setAplicarATodas(false);
    setError(null);
    setEditando(false);
  }

  function guardar() {
    if (!valor) {
      setError("Elige una fecha.");
      return;
    }
    startTransition(async () => {
      const res = await actualizarFechaPrometida(ordenId, valor, aplicarATodas);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setError(null);
      setAplicarATodas(false);
      setEditando(false);
    });
  }

  if (editando) {
    return (
      <div className="py-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Fecha prometida</span>
          <input
            type="date"
            autoFocus
            disabled={pending}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="rounded border border-slate-300 px-1.5 py-0.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div className="mt-2 flex flex-wrap justify-end gap-1.5">
          {ATAJOS.map((a) => (
            <button
              key={a.label}
              type="button"
              disabled={pending}
              onClick={() => setValor(fechaColombiaMasDias(a.dias))}
              className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 active:bg-slate-100"
            >
              {a.label}
            </button>
          ))}
        </div>
        {maletasDelRecibo > 1 ? (
          <label className="mt-2 flex items-center justify-end gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={aplicarATodas}
              onChange={(e) => setAplicarATodas(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Aplicar a las {maletasDelRecibo} maletas de este recibo
          </label>
        ) : null}
        <div className="mt-2 flex items-center justify-end gap-3">
          {error ? <span className="mr-auto text-xs text-red-600">{error}</span> : null}
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
      <span className="text-slate-500">Fecha prometida</span>
      <span className="flex items-center gap-1.5 text-right font-medium text-slate-900">
        {formatFecha(fecha)}
        <button
          type="button"
          onClick={() => setEditando(true)}
          aria-label="Cambiar fecha prometida"
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
