"use client";

import { useActionState, useRef, useState } from "react";
import {
  agregarItem,
  type AgregarItemState,
} from "@/lib/comprobante-actions";
import { ServicioBuscador } from "@/components/ServicioBuscador";
import type { Servicio } from "@/types/database";

const initialState: AgregarItemState = null;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export function AgregarItemForm({
  path,
  comprobanteId,
  servicios,
}: {
  path: string;
  comprobanteId: string;
  servicios: Servicio[];
}) {
  const action = agregarItem.bind(null, path, comprobanteId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [servicioId, setServicioId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");

  function handleSelect(servicio: Servicio) {
    setServicioId(servicio.id);
    setDescripcion(servicio.nombre);
    setPrecio(String(servicio.precio));
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
        setServicioId("");
        setDescripcion("");
        setPrecio("");
      }}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
        Agregar ítem
      </h2>

      <input type="hidden" name="servicio_id" value={servicioId} />

      {servicios.length > 0 ? (
        <div>
          <label className={labelClass}>Buscar en el catálogo</label>
          <ServicioBuscador servicios={servicios} onSelect={handleSelect} />
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
          onChange={(e) => {
            setDescripcion(e.target.value);
            setServicioId("");
          }}
          className={inputClass}
          placeholder="O escribí una descripción manual"
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
