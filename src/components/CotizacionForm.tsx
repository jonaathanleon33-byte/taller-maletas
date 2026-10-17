"use client";

import { useActionState, useState } from "react";
import {
  actualizarCotizacion,
  crearCotizacion,
  type CotizacionFormState,
} from "@/app/cotizaciones/actions";
import { MarcaSelect } from "@/components/MarcaSelect";
import { TAMANO_LABELS, TIPO_LABELS } from "@/lib/estado";
import { fechaColombiaMasDias } from "@/lib/format";
import type { Cotizacion } from "@/types/database";

const initialState: CotizacionFormState = null;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

// Sin `cotizacion` crea una nueva; con ella edita sus datos (cliente,
// descripción, vigencia, descuento e IVA).
export function CotizacionForm({ cotizacion }: { cotizacion?: Cotizacion }) {
  const editando = Boolean(cotizacion);
  const action = cotizacion
    ? actualizarCotizacion.bind(null, cotizacion.id)
    : crearCotizacion;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [vigencia, setVigencia] = useState(
    cotizacion ? (cotizacion.vigencia_hasta ?? "") : fechaColombiaMasDias(15),
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {editando ? "Datos de la cotización" : "Cliente y maleta"}
      </h2>

      <div>
        <label className={labelClass} htmlFor="cliente_nombre">Nombre del cliente *</label>
        <input id="cliente_nombre" name="cliente_nombre" required maxLength={100} defaultValue={cotizacion?.cliente_nombre} className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="cliente_telefono">Teléfono (WhatsApp) *</label>
        <input id="cliente_telefono" name="cliente_telefono" type="tel" inputMode="tel" required defaultValue={cotizacion?.cliente_telefono} placeholder="Ej: 3001234567" className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="marca">Marca</label>
          <MarcaSelect id="marca" name="marca" required={false} defaultValue={cotizacion?.marca ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="color">Color</label>
          <input id="color" name="color" defaultValue={cotizacion?.color ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="tamano">Tamaño</label>
          <select id="tamano" name="tamano" defaultValue={cotizacion?.tamano ?? ""} className={inputClass}>
            <option value="">Sin definir</option>
            {Object.entries(TAMANO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" defaultValue={cotizacion?.tipo ?? ""} className={inputClass}>
            <option value="">Sin definir</option>
            {Object.entries(TIPO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="descripcion">Reparación a cotizar *</label>
        <textarea id="descripcion" name="descripcion" required rows={2} maxLength={300} defaultValue={cotizacion?.descripcion} placeholder="Ej: Ruedas y cierre" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="vigencia_hasta">Válida hasta</label>
        <input id="vigencia_hasta" name="vigencia_hasta" type="date" value={vigencia} onChange={(e) => setVigencia(e.target.value)} className={inputClass} />
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { label: "8 días", dias: 8 },
            { label: "15 días", dias: 15 },
            { label: "30 días", dias: 30 },
          ].map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => setVigencia(fechaColombiaMasDias(a.dias))}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 active:bg-slate-100"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="notas">Notas</label>
        <textarea id="notas" name="notas" rows={2} maxLength={500} defaultValue={cotizacion?.notas ?? ""} placeholder="Opcional: condiciones, tiempo estimado…" className={inputClass} />
      </div>

      {editando ? (
        <>
          <div>
            <label className={labelClass} htmlFor="descuento_global">Descuento global</label>
            <input id="descuento_global" name="descuento_global" type="number" inputMode="numeric" min="0" defaultValue={cotizacion?.descuento_global ?? 0} className={inputClass} />
          </div>
          <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <input type="checkbox" name="incluye_iva" defaultChecked={cotizacion?.incluye_iva} className="mt-0.5 h-4 w-4 rounded border-slate-300" />
            <span>
              <span className="font-medium text-slate-900">Incluir IVA (19 %)</span>
              <span className="block text-xs text-slate-500">Si el cliente va a pedir facturación electrónica, el total de la cotización suma el 19 %.</span>
            </span>
          </label>
        </>
      ) : null}

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 py-3 text-center text-base font-semibold text-white active:bg-slate-700 disabled:opacity-60">
        {pending ? "Guardando…" : editando ? "Guardar cambios" : "Crear cotización"}
      </button>
    </form>
  );
}
