"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  crearOrden,
  type CrearOrdenState,
} from "@/app/ordenes/nueva/actions";
import { ESTADOS, TAMANO_LABELS, TIPO_LABELS } from "@/lib/estado";
import { EstadoSelect } from "@/components/EstadoSelect";
import { comprimirImagen } from "@/lib/comprimir-imagen";
import type { Cliente } from "@/lib/clientes";

const initialState: CrearOrdenState = null;
const MAX_FOTOS = 3;

function ahoraLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export function NuevaOrdenForm({
  tecnicos,
  clientes,
  prefill,
}: {
  tecnicos: string[];
  clientes: Cliente[];
  prefill?: {
    numero_recibo?: string;
    cliente_nombre?: string;
    cliente_telefono?: string;
  };
}) {
  const [state, formAction, pending] = useActionState(
    crearOrden,
    initialState,
  );
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [fechaRecibido] = useState(ahoraLocal);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clienteNombre, setClienteNombre] = useState(
    prefill?.cliente_nombre ?? "",
  );
  const [clienteTelefono, setClienteTelefono] = useState(
    prefill?.cliente_telefono ?? "",
  );

  function handleNombreChange(value: string) {
    setClienteNombre(value);
    const match = clientes.find((c) => c.nombre === value);
    if (match) setClienteTelefono(match.telefono);
  }

  function handleTelefonoChange(value: string) {
    setClienteTelefono(value);
    const match = clientes.find((c) => c.telefono === value);
    if (match) setClienteNombre(match.nombre);
  }

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  // El input que se ve/oculta cambia de nodo del DOM según cuántas
  // fotos hay (ver JSX abajo), así que sincronizamos su .files acá en
  // vez de al momento de cambiar el estado — así siempre apunta al
  // input que esté montado en ese momento.
  useEffect(() => {
    const dt = new DataTransfer();
    fotos.forEach((f) => dt.items.add(f));
    if (fileInputRef.current) fileInputRef.current.files = dt.files;
  }, [fotos]);

  // Cada vez que se abre el selector de fotos (cámara o galería), el
  // navegador reemplaza por completo lo elegido antes — por eso había
  // que ir sumando las fotos nosotros mismos en vez de solo usar
  // input.files directamente.
  async function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevos = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (nuevos.length === 0) return;

    const espacio = MAX_FOTOS - fotos.length;
    const aAgregar = nuevos.slice(0, Math.max(espacio, 0));
    if (aAgregar.length === 0) return;

    setComprimiendo(true);
    try {
      const comprimidas = await Promise.all(
        aAgregar.map((f) => comprimirImagen(f)),
      );
      setFotos((prev) => [...prev, ...comprimidas].slice(0, MAX_FOTOS));
      setPreviews((prev) => [
        ...prev,
        ...comprimidas.map((f) => URL.createObjectURL(f)),
      ]);
    } finally {
      setComprimiendo(false);
    }
  }

  function quitarFoto(i: number) {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[i]);
      return prev.filter((_, idx) => idx !== i);
    });
    setFotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 pb-10">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Recibo y cliente
        </h2>
        {prefill?.numero_recibo ? (
          <div>
            <label className={labelClass} htmlFor="numero_recibo">
              Número de recibo
            </label>
            <input
              id="numero_recibo"
              name="numero_recibo"
              readOnly
              value={prefill.numero_recibo}
              className={`${inputClass} bg-slate-50 text-slate-500`}
            />
            <p className="mt-1 text-xs text-slate-500">
              Agregando otra maleta al mismo recibo.
            </p>
          </div>
        ) : (
          <p className="-mt-2 text-xs text-slate-500">
            El número de recibo se asigna automáticamente al guardar.
          </p>
        )}

        <div>
          <label className={labelClass} htmlFor="cliente_nombre">
            Nombre del cliente *
          </label>
          <input
            id="cliente_nombre"
            name="cliente_nombre"
            list="clientes-nombre-list"
            required
            autoComplete="do-not-autofill"
            value={clienteNombre}
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
            required
            autoComplete="do-not-autofill"
            value={clienteTelefono}
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
            Descripción del arreglo *
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
          Fotos ({fotos.length}/{MAX_FOTOS}) *
        </h2>
        {fotos.length < MAX_FOTOS ? (
          <input
            ref={fileInputRef}
            type="file"
            name="fotos"
            accept="image/*"
            capture="environment"
            multiple
            required={fotos.length === 0}
            onChange={handleFotos}
            className="text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        ) : (
          <>
            <input ref={fileInputRef} type="file" name="fotos" className="hidden" />
            <p className="text-sm text-slate-500">
              Ya agregaste {MAX_FOTOS} fotos. Quita una para agregar otra.
            </p>
          </>
        )}
        {comprimiendo ? (
          <p className="text-sm text-slate-500">Preparando fotos…</p>
        ) : null}
        {previews.length > 0 ? (
          <div className="flex gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative h-20 w-20 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Foto ${i + 1}`}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => quitarFoto(i)}
                  aria-label="Quitar foto"
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white shadow"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
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
          <select
            id="tecnico_asignado"
            name="tecnico_asignado"
            defaultValue=""
            className={inputClass}
          >
            <option value="">Sin asignar</option>
            {tecnicos.map((tecnico) => (
              <option key={tecnico} value={tecnico}>
                {tecnico}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="estado">
            Estado inicial
          </label>
          <EstadoSelect
            name="estado"
            defaultValue="recibida"
            options={ESTADOS.filter((e) => e !== "entregada")}
          />
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
        disabled={pending || comprimiendo}
        className="rounded-lg bg-slate-900 py-3 text-center text-base font-semibold text-white active:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Guardando…" : comprimiendo ? "Preparando fotos…" : "Crear orden"}
      </button>
    </form>
  );
}
