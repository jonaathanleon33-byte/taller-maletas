"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatMoney } from "@/lib/money";
import type { Servicio } from "@/types/database";

export function ServicioBuscador({
  servicios,
  onSelect,
}: {
  servicios: Servicio[];
  onSelect: (servicio: Servicio) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return servicios
      .filter((s) => s.nombre.toLowerCase().includes(q))
      .slice(0, 20);
  }, [servicios, query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar servicio o producto…"
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none"
      />

      {open && matches.length > 0 ? (
        <ul className="absolute z-10 mt-1 max-h-80 w-full divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {matches.map((servicio) => (
            <li key={servicio.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(servicio);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-base leading-snug text-slate-900 active:bg-slate-100"
              >
                <span>{servicio.nombre}</span>
                <span className="shrink-0 text-sm text-slate-500">
                  {formatMoney(servicio.precio)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open && query.trim() && matches.length === 0 ? (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 shadow-lg">
          Sin resultados. Podés cargarlo manual abajo.
        </div>
      ) : null}
    </div>
  );
}
