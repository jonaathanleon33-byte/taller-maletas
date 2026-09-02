"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function FiltroFechaEntrega() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fecha = searchParams.get("fecha") ?? "";

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("fecha", next);
    } else {
      params.delete("fecha");
    }
    router.replace(`/?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        >
          <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M3 10h18M8 3v4M16 3v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="date"
          value={fecha}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-base text-slate-900 focus:border-slate-500 focus:outline-none"
          aria-label="Buscar por fecha de entrega prometida"
        />
      </div>
      {fecha ? (
        <button
          type="button"
          onClick={() => handleChange("")}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 active:bg-slate-50"
        >
          Ver todas
        </button>
      ) : null}
    </div>
  );
}
