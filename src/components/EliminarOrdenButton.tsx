"use client";

import { useActionState, useState } from "react";
import {
  eliminarOrden,
  type EliminarOrdenState,
} from "@/app/ordenes/[id]/actions";

const initialState: EliminarOrdenState = null;

export function EliminarOrdenButton({ ordenId }: { ordenId: string }) {
  const [confirming, setConfirming] = useState(false);
  const action = eliminarOrden.bind(null, ordenId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full rounded-lg border border-red-300 py-3 text-center text-sm font-semibold text-red-600 active:bg-red-50"
      >
        Eliminar orden
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4">
      <p className="mb-3 text-sm text-red-800">
        ¿Eliminar esta orden? Se borran también sus fotos y su historial.
        Esta acción no se puede deshacer.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 active:bg-slate-50 disabled:opacity-60"
        >
          Cancelar
        </button>
        <form action={formAction} className="flex-1">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white active:bg-red-700 disabled:opacity-60"
          >
            {pending ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </form>
      </div>
      {state?.error ? (
        <p className="mt-2 text-sm text-red-700">{state.error}</p>
      ) : null}
    </div>
  );
}
