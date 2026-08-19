"use client";

import { useActionState, useRef, useState } from "react";
import {
  agregarItem,
  type AgregarItemState,
} from "@/app/ordenes/[id]/comprobante/actions";
import type { Servicio } from "@/types/database";

const initialState: AgregarItemState = null;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export function AgregarItemForm({
  ordenId,
  comprobanteId,
  servicios,
}: {
  ordenId: string;
  comprobanteId: string;
  servicios: Servicio[];
}) {
  const action = agregarItem.bind(null, ordenId, comprobanteId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");

  function handleServicioChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const servicioId = e.target.value;
    const servicio = servicios.find((s) => s.id === servicioId);
    if (servicio) {
      setDescripcion(servicio.nombre);
      setPrecio(String(servicio.precio));
    }
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
        setDescripcion("");
        setPrecio("");
      }}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
        Agregar ítem
      </h2>

      {servicios.length > 0 ? (
        <div>
          <label className={labelClass} htmlFor="servicio_id">
            Del catálogo
          </label>
          <select
            id="servicio_id"
            name="servicio_id"
            defaultValue=""
            onChange={handleServicioChange}
            className={inputClass}
          >
            <option value="">Manual…</option>
            {servicios.map((servicio) => (
              <option key={servicio.id} value={servicio.id}>
                {servicio.nombre}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="descripcion">
          Descripción *
        </label>
        <input
          id="descripcion"
          name="descripcion"
          required
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass} htmlFor="precio_unitario">
            Precio *
          </label>
          <input
            id="precio_unitario"
            name="precio_unitario"
            type="number"
            inputMode="numeric"
            min="0"
            required
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="cantidad">
            Cant.
          </label>
          <input
            id="cantidad"
            name="cantidad"
            type="number"
            inputMode="numeric"
            min="1"
            defaultValue="1"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="descuento_pct">
            Desc. %
          </label>
          <input
            id="descuento_pct"
            name="descuento_pct"
            type="number"
            inputMode="numeric"
            min="0"
            max="100"
            defaultValue="0"
            className={inputClass}
          />
        </div>
      </div>

      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 py-2.5 text-center text-sm font-semibold text-white active:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Agregando…" : "Agregar ítem"}
      </button>
    </form>
  );
}
