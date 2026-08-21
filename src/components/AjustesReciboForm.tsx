"use client";

import { useActionState, useEffect, useState } from "react";
import {
  actualizarNegocio,
  type ActualizarNegocioState,
} from "@/app/ajustes/recibo/actions";
import { LogoTaller } from "@/components/LogoTaller";
import type { NegocioConfig } from "@/types/database";

const initialState: ActualizarNegocioState = null;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export function AjustesReciboForm({ negocio }: { negocio: NegocioConfig }) {
  const [state, formAction, pending] = useActionState(
    actualizarNegocio,
    initialState,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [quitarLogo, setQuitarLogo] = useState(false);
  const [previewFondo, setPreviewFondo] = useState<string | null>(null);
  const [quitarFondo, setQuitarFondo] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    return () => {
      if (previewFondo) URL.revokeObjectURL(previewFondo);
    };
  }, [previewFondo]);

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) setQuitarLogo(false);
  }

  function handleFondo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (previewFondo) URL.revokeObjectURL(previewFondo);
    setPreviewFondo(file ? URL.createObjectURL(file) : null);
    if (file) setQuitarFondo(false);
  }

  const logoActual = quitarLogo ? null : (preview ?? negocio.logo_url);
  const fondoActual = quitarFondo ? null : (previewFondo ?? negocio.fondo_home_url);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <div>
        <label className={labelClass}>Logo del recibo</label>
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200 bg-white">
          {logoActual ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoActual}
              alt="Logo actual"
              className="h-full w-full object-contain"
            />
          ) : (
            <LogoTaller className="h-10 w-10 text-slate-900" />
          )}
        </div>
        <input
          type="file"
          name="logo"
          accept="image/*"
          onChange={handleLogo}
          className="text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        />
        {negocio.logo_url ? (
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="quitar_logo"
              checked={quitarLogo}
              onChange={(e) => setQuitarLogo(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Quitar logo y usar el ícono predeterminado
          </label>
        ) : null}
      </div>

      <div>
        <label className={labelClass}>Fondo de la página principal</label>
        {fondoActual ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fondoActual}
            alt="Fondo actual"
            className="mb-2 h-28 w-full rounded-lg border border-slate-200 object-cover"
          />
        ) : (
          <p className="mb-2 text-sm text-slate-500">Sin fondo configurado.</p>
        )}
        <input
          type="file"
          name="fondo_home"
          accept="image/*"
          onChange={handleFondo}
          className="text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        />
        {negocio.fondo_home_url ? (
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="quitar_fondo"
              checked={quitarFondo}
              onChange={(e) => setQuitarFondo(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Quitar fondo
          </label>
        ) : null}
      </div>

      <div>
        <label className={labelClass} htmlFor="nombre">
          Nombre del negocio
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={negocio.nombre}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="nit">
          NIT
        </label>
        <input
          id="nit"
          name="nit"
          defaultValue={negocio.nit}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="direccion">
          Dirección
        </label>
        <input
          id="direccion"
          name="direccion"
          required
          defaultValue={negocio.direccion}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="telefono">
          Teléfono
        </label>
        <input
          id="telefono"
          name="telefono"
          required
          defaultValue={negocio.telefono}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="web">
          Sitio web
        </label>
        <input
          id="web"
          name="web"
          defaultValue={negocio.web}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="pie_texto">
          Pie de página del recibo
        </label>
        <textarea
          id="pie_texto"
          name="pie_texto"
          required
          rows={4}
          defaultValue={negocio.pie_texto}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500">
          Cada línea se imprime por separado.
        </p>
      </div>

      {state && "error" in state ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      {state && "success" in state ? (
        <p className="text-sm text-emerald-600">Guardado.</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 py-2.5 text-center text-sm font-semibold text-white active:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
