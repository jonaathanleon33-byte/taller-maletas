"use client";

import { useActionState, useState } from "react";
import { crearVenta, type CrearVentaState } from "@/app/ventas/nueva/actions";
import type { Cliente } from "@/lib/clientes";

const initialState: CrearVentaState = null;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export function NuevaVentaForm({ clientes }: { clientes: Cliente[] }) {
  const [state, formAction, pending] = useActionState(crearVenta, initialState);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  function handleNombreChange(value: string) {
    setNombre(value);
    const match = clientes.find((c) => c.nombre === value);
    if (match) setTelefono(match.telefono);
  }

  function handleTelefonoChange(value: string) {
    setTelefono(value);
    const match = clientes.find((c) => c.telefono === value);
    if (match) setNombre(match.nombre);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3">
          <label className={labelClass} htmlFor="cliente_nombre">
            Nombre del cliente *
          </label>
          <input
            id="cliente_nombre"
            name="cliente_nombre"
            list="clientes-nombre-list"
            autoComplete="do-not-autofill"
            required
            value={nombre}
            onChange={(e) => handleNombreChange(e.target.value)}
            className={inputClass}
          />
          {clientes.length > 0 ? (
            <datalist id="clientes-nombre-list">
              {clientes.map((c) => (
                <option key={c.telefono} value={c.nombre} />
              ))}
            </datalist>
          ) : null}
        </div>

        <div>
          <label className={labelClass} htmlFor="cliente_telefono">
            Teléfono (WhatsApp) *
          </label>
          <input
            id="cliente_telefono"
            name="cliente_telefono"
            type="tel"
            list="clientes-telefono-list"
            autoComplete="do-not-autofill"
            required
            value={telefono}
            onChange={(e) => handleTelefonoChange(e.target.value)}
            className={inputClass}
            placeholder="Ej: 3001234567"
          />
          {clientes.length > 0 ? (
            <datalist id="clientes-telefono-list">
              {clientes.map((c) => (
                <option key={c.telefono} value={c.telefono} />
              ))}
            </datalist>
          ) : null}
        </div>
      </div>

      {state?.error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 py-3 text-center text-base font-semibold text-white active:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Continuar"}
      </button>
    </form>
  );
}
