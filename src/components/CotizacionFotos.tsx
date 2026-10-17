"use client";

import { useRef, useState, useTransition } from "react";
import {
  agregarFotosCotizacion,
  eliminarFotoCotizacion,
} from "@/app/cotizaciones/actions";
import { comprimirImagen } from "@/lib/comprimir-imagen";
import type { CotizacionFoto } from "@/types/database";

const MAX = 3;

// Fotos que el cliente mandó por WhatsApp: se guardan en la galería y
// se eligen desde aquí (sin forzar la cámara). Si la cotización se
// convierte en orden, estas fotos pasan a la orden.
export function CotizacionFotos({
  cotizacionId,
  fotos,
  bloqueada,
}: {
  cotizacionId: string;
  fotos: CotizacionFoto[];
  bloqueada: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [comprimiendo, setComprimiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function elegidas(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevas = Array.from(e.target.files ?? []).slice(0, MAX - fotos.length);
    e.target.value = "";
    if (nuevas.length === 0) return;

    setComprimiendo(true);
    try {
      const comprimidas = await Promise.all(nuevas.map((f) => comprimirImagen(f)));
      const datos = new FormData();
      comprimidas.forEach((f) => datos.append("fotos", f));
      startTransition(async () => {
        const res = await agregarFotosCotizacion(cotizacionId, datos);
        setError(res?.error ?? null);
      });
    } finally {
      setComprimiendo(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Fotos del cliente ({fotos.length}/{MAX})
      </h2>

      {fotos.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {fotos.map((foto) => (
            <div key={foto.id} className="relative h-20 w-20 shrink-0">
              <a href={foto.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto.url} alt="Foto de la maleta" className="h-20 w-20 rounded-lg object-cover" />
              </a>
              {!bloqueada ? (
                <button
                  type="button"
                  disabled={pending}
                  aria-label="Quitar foto"
                  onClick={() =>
                    startTransition(async () => {
                      const res = await eliminarFotoCotizacion(cotizacionId, foto.id);
                      setError(res?.error ?? null);
                    })
                  }
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white shadow disabled:opacity-60"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm text-slate-500">
          Guarda en la galería las fotos que mandó el cliente por WhatsApp y
          agrégalas aquí.
        </p>
      )}

      {!bloqueada && fotos.length < MAX ? (
        <>
          <input ref={inputRef} type="file" accept="image/*" multiple onChange={elegidas} className="hidden" />
          <button
            type="button"
            disabled={pending || comprimiendo}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 active:bg-slate-100 disabled:opacity-60"
          >
            {comprimiendo || pending ? "Subiendo…" : "Agregar desde la galería"}
          </button>
        </>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
