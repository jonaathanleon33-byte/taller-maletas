"use client";

import { useState, useTransition } from "react";
import { toggleServicioActivo } from "@/app/servicios/actions";

export function ToggleServicioButton({
  servicioId,
  activo,
}: {
  servicioId: string;
  activo: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleServicioActivo(servicioId, !activo);
          setError(res?.error ?? null);
        })
      }
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium disabled:opacity-60 ${
        activo
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {error ? "Error, reintenta" : activo ? "Activo" : "Inactivo"}
    </button>
  );
}
