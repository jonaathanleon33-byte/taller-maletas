"use client";

import { useActionState, useEffect, useState } from "react";
import {
  crearOrden,
  type CrearOrdenState,
} from "@/app/ordenes/nueva/actions";
import { ESTADOS, ESTADO_LABELS, TAMANO_LABELS, TIPO_LABELS } from "@/lib/estado";

const initialState: CrearOrdenState = null;

function ahoraLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export function NuevaOrdenForm() {
  const [state, formAction, pending] = useActionState(
    crearOrden,
    initialState,
  );
  const [previews, setPreviews] = useState<string[]>([]);
  const [fechaRecibido] = useState(ahoraLocal);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3);
    setPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return files.map((f) => URL.createObjectURL(f));
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 pb-10">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Recibo y cliente
        </h2>

        <div>
          <label className={labelClass} htmlFor="numero_recibo">
            Número de recibo *
          </label>
          <input
            id="numero_recibo"
            name="numero_recibo"
            required
            className={inputClass}
            placeholder="Ej: 00123"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="cliente_nombre">
            Nombre del cliente *
          </label>
          <input
            id="cliente_nombre"
            name="cliente_nombre"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="cliente_telefono">
            Teléfono (WhatsApp) *
          </label>
          <input
            id="cliente_telefono"
            name="cliente_telefono"
            type="tel"
            required
            className={inputClass}
            placeholder="Ej: 5491122334455"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Maleta
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="marca">
              Marca *
            </label>
            <input id="marca" name="marca" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="color">
              Color *
            </label>
            <input id="color" name="color" required className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="tamano">
              Tamaño *
            </label>
            <select
              id="tamano"
              name="tamano"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>
                Elegir…
              </option>
              {Object.entries(TAMANO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="tipo">
              Tipo *
            </label>
            <select
              id="tipo"
              name="tipo"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>
                Elegir…
              </option>
              {Object.entries(TIPO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="dano_descripcion">
            Descripción del daño *
          </label>
          <textarea
            id="dano_descripcion"
            name="dano_descripcion"
            required
            rows={3}
            className={inputClass}
            placeholder="Ej: Rueda delantera derecha rota, cierre trabado"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Fotos (1 a 3) *
        </h2>
        <input
          type="file"
          name="fotos"
          accept="image/*"
          capture="environment"
          multiple
          required
          onChange={handleFotos}
          className="text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        />
        {previews.length > 0 ? (
          <div className="flex gap-2">
            {previews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`Foto ${i + 1}`}
                className="h-20 w-20 rounded-lg object-cover"
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Taller
        </h2>

        <div>
          <label className={labelClass} htmlFor="ubicacion">
            Ubicación en el taller *
          </label>
          <input
            id="ubicacion"
            name="ubicacion"
            required
            className={inputClass}
            placeholder="Ej: Estante A3"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="tecnico_asignado">
            Técnico asignado
          </label>
          <input
            id="tecnico_asignado"
            name="tecnico_asignado"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="estado">
            Estado inicial
          </label>
          <select
            id="estado"
            name="estado"
            defaultValue="recibida"
            className={inputClass}
          >
            {ESTADOS.filter((e) => e !== "entregada").map((estado) => (
              <option key={estado} value={estado}>
                {ESTADO_LABELS[estado]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="fecha_recibido">
              Fecha de recepción
            </label>
            <input
              id="fecha_recibido"
              name="fecha_recibido"
              type="datetime-local"
              defaultValue={fechaRecibido}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="fecha_prometida">
              Fecha prometida
            </label>
            <input
              id="fecha_prometida"
              name="fecha_prometida"
              type="date"
              className={inputClass}
            />
          </div>
        </div>
      </section>

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
        {pending ? "Guardando…" : "Crear orden"}
      </button>
    </form>
  );
}
