"use client";

import { useActionState, useState } from "react";
import { crearDomicilio, type CrearDomicilioState } from "@/app/domicilio/actions";
import {
  MUNICIPIOS_SIN_COBERTURA,
  TIPOS_DOMICILIO,
  formatHora,
  horasDisponibles,
} from "@/lib/domicilios";
import { fechaColombiaMasDias } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { TipoDomicilio } from "@/types/database";

const initialState: CrearDomicilioState = null;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export function DomicilioForm({ interno = false }: { interno?: boolean }) {
  const [state, formAction, pending] = useActionState(
    crearDomicilio.bind(null, interno),
    initialState,
  );
  const [tipo, setTipo] = useState<TipoDomicilio | "">("");
  const [fecha, setFecha] = useState("");
  const horas = horasDisponibles(fecha);
  const domingo = fecha !== "" && horas.length === 0;
  const hoy = fechaColombiaMasDias(0);

  if (state && "ok" in state) {
    return (
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-5 text-center">
        <p className="text-lg font-semibold text-emerald-900">
          ¡Solicitud recibida!
        </p>
        <p className="mt-2 text-sm text-emerald-900">
          Te confirmaremos tu domicilio por WhatsApp y te avisaremos cuando el
          domiciliario esté en camino.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Campo trampa para bots: fuera de pantalla y sin foco. */}
      {!interno ? (
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Sitio web
            <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      ) : null}

      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          ¿Qué necesitas?
        </h2>
        <div className="flex flex-col gap-2">
          {(Object.keys(TIPOS_DOMICILIO) as TipoDomicilio[]).map((clave) => {
            const t = TIPOS_DOMICILIO[clave];
            const activo = tipo === clave;
            return (
              <label
                key={clave}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                  activo ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value={clave}
                  required
                  checked={activo}
                  onChange={() => setTipo(clave)}
                  className="mt-1"
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">
                    {t.label}
                  </span>
                  <span className="block text-xs text-slate-500">{t.detalle}</span>
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {formatMoney(t.costo)}
                </span>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">
          El valor es por trayecto: {formatMoney(20000)} por cada recogida o
          entrega.
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Tus datos
        </h2>
        <div>
          <label className={labelClass} htmlFor="cliente_nombre">
            Nombre *
          </label>
          <input id="cliente_nombre" name="cliente_nombre" required maxLength={100} autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="cliente_telefono">
            Teléfono (WhatsApp) *
          </label>
          <input
            id="cliente_telefono"
            name="cliente_telefono"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            placeholder="Ej: 3001234567"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="numero_recibo">
            Número de recibo (si ya dejaste tu maleta)
          </label>
          <input id="numero_recibo" name="numero_recibo" inputMode="numeric" maxLength={20} placeholder="Opcional" className={inputClass} />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Dirección en Bogotá
        </h2>
        <div>
          <label className={labelClass} htmlFor="direccion">
            Dirección *
          </label>
          <input id="direccion" name="direccion" required maxLength={200} autoComplete="street-address" placeholder="Ej: Cra 58 # 127-42, apto 301" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="barrio">
            Barrio o referencia
          </label>
          <input id="barrio" name="barrio" maxLength={100} placeholder="Ej: Barrio Pontevedra, frente al parque" className={inputClass} />
        </div>
        {!interno ? (
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="en_bogota" required className="mt-1" />
            <span>
              Confirmo que la dirección está en Bogotá. No cubrimos{" "}
              {MUNICIPIOS_SIN_COBERTURA.join(", ")}.
            </span>
          </label>
        ) : null}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          ¿Cuándo?
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="fecha">
              Fecha *
            </label>
            <input
              id="fecha"
              name="fecha"
              type="date"
              required
              min={hoy}
              max={fechaColombiaMasDias(60)}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="hora">
              Hora *
            </label>
            <select id="hora" name="hora" required disabled={horas.length === 0} defaultValue="" className={inputClass}>
              <option value="" disabled>
                {fecha ? "Elegir…" : "Primero la fecha"}
              </option>
              {horas.map((h) => (
                <option key={h} value={h}>
                  {formatHora(h)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {domingo ? (
          <p className="text-sm text-red-600">No hacemos domicilios los domingos. Elige otro día.</p>
        ) : (
          <p className="text-xs text-slate-500">
            Horario: lunes a viernes de 9 a. m. a 6 p. m. y sábados de 9 a. m. a 4 p. m.
          </p>
        )}
        <div>
          <label className={labelClass} htmlFor="notas">
            Observaciones
          </label>
          <textarea id="notas" name="notas" rows={3} maxLength={500} placeholder="Ej: dejar con la portería, llamar al llegar" className={inputClass} />
        </div>
      </section>

      {state && "error" in state ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 py-3 text-center text-base font-semibold text-white active:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Enviando…" : interno ? "Guardar domicilio" : "Solicitar domicilio"}
      </button>
    </form>
  );
}
