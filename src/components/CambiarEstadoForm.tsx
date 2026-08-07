"use client";

import { useActionState } from "react";
import {
  cambiarEstado,
  type CambiarEstadoState,
} from "@/app/ordenes/[id]/actions";
import { ESTADOS } from "@/lib/estado";
import { EstadoSelect } from "@/components/EstadoSelect";
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
        <div className="flex-1">
          <EstadoSelect name="estado" defaultValue={estadoActual} options={ESTADOS} />
        </div>
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
