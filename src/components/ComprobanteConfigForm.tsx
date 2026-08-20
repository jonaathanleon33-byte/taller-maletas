"use client";

import { useActionState } from "react";
import {
  actualizarComprobante,
  type ActualizarComprobanteState,
} from "@/lib/comprobante-actions";
import type { Comprobante } from "@/types/database";

const initialState: ActualizarComprobanteState = null;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

const METODO_PAGO_LABELS: Record<Comprobante["metodo_pago"], string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
};

export function ComprobanteConfigForm({
  path,
  comprobante,
  tecnicos,
}: {
  path: string;
  comprobante: Comprobante;
  tecnicos: string[];
}) {
  const action = actualizarComprobante.bind(null, path, comprobante.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
        Datos del comprobante
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="metodo_pago">
            Método de pago
          </label>
          <select
            id="metodo_pago"
            name="metodo_pago"
            defaultValue={comprobante.metodo_pago}
            className={inputClass}
          >
            {Object.entries(METODO_PAGO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="atendido_por">
            Atendido por
          </label>
          <input
            id="atendido_por"
            name="atendido_por"
            list="tecnicos-list-comprobante"
            defaultValue={comprobante.atendido_por ?? ""}
            className={inputClass}
          />
          {tecnicos.length > 0 ? (
            <datalist id="tecnicos-list-comprobante">
              {tecnicos.map((tecnico) => (
                <option key={tecnico} value={tecnico} />
              ))}
            </datalist>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="descuento_global">
            Descuento global
          </label>
          <input
            id="descuento_global"
            name="descuento_global"
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={comprobante.descuento_global}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="impuestos">
            Impuestos
          </label>
          <input
            id="impuestos"
            name="impuestos"
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={comprobante.impuestos}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="pagado"
          defaultChecked={comprobante.pagado}
          className="h-4 w-4 rounded border-slate-300"
        />
        Pagado
      </label>

      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-slate-300 py-2.5 text-center text-sm font-semibold text-slate-700 active:bg-slate-50 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar datos"}
      </button>
    </form>
  );
}
