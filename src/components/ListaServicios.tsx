"use client";

import { useMemo, useState } from "react";
import { ToggleServicioButton } from "@/components/ToggleServicioButton";
import { formatMoney } from "@/lib/money";
import type { Servicio } from "@/types/database";

export function ListaServicios({ servicios }: { servicios: Servicio[] }) {
  const [query, setQuery] = useState("");

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return servicios;
    return servicios.filter((s) => s.nombre.toLowerCase().includes(q));
  }, [servicios, query]);

  return (
    <>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="M21 21l-4.35-4.35"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar servicio…"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
        />
      </div>

      {filtrados.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {filtrados.map((servicio) => (
            <li
              key={servicio.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  {servicio.nombre}
                </p>
                <p className="text-sm text-slate-500">
                  {formatMoney(servicio.precio)}
                </p>
              </div>
              <ToggleServicioButton
                servicioId={servicio.id}
                activo={servicio.activo}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">
          No hay servicios que coincidan con &quot;{query}&quot;.
        </p>
      )}
    </>
  );
}
