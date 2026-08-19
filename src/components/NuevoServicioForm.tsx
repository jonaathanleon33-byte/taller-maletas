"use client";

import { useActionState, useRef } from "react";
import {
  crearServicio,
  type CrearServicioState,
} from "@/app/servicios/actions";

const initialState: CrearServicioState = null;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none";

export function NuevoServicioForm() {
  const [state, formAction, pending] = useActionState(
    crearServicio,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
        Nuevo servicio
      </h2>
      <div className="flex gap-2">
        <input
          name="nombre"
          required
          placeholder="Ej: Masillado de 10cm2"
          className={`${inputClass} flex-1`}
        />
        <input
          name="precio"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          required
          placeholder="Precio"
          className={`${inputClass} w-28`}
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 py-2.5 text-center text-sm font-semibold text-white active:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Agregando…" : "Agregar servicio"}
      </button>
    </form>
  );
}
