"use client";

import { useActionState } from "react";
import {
  cambiarEstado,
  type CambiarEstadoState,
} from "@/app/ordenes/[id]/actions";
import { ESTADOS, ESTADO_LABELS } from "@/lib/estado";
import type { Estado } from "@/types/database";

const initialState: CambiarEstadoState = null;

export function CambiarEstadoForm({
  ordenId,
  estadoActual,
}: {
  ordenId: string;
  estadoActual: Estado;
}) {
  const action = cambiarEstado.bind(null, ordenId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <select
          name="estado"
          defaultValue={estadoActual}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none"
        >
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {ESTADO_LABELS[estado]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white active:bg-slate-700 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Actualizar"}
        </button>
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}
