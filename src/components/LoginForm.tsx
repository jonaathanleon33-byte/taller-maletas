"use client";

import { useActionState } from "react";
import { iniciarSesion, type IniciarSesionState } from "@/app/login/actions";

const initialState: IniciarSesionState = null;

export function LoginForm({ next }: { next: string }) {
  const action = iniciarSesion.bind(null, next);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        type="password"
        name="clave"
        required
        autoFocus
        placeholder="Clave del taller"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none"
      />

      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-700 py-2.5 text-center text-sm font-semibold text-white active:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
