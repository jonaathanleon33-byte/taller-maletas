"use client";

import { useTransition } from "react";
import { toggleServicioActivo } from "@/app/servicios/actions";

export function ToggleServicioButton({
  servicioId,
  activo,
}: {
  servicioId: string;
  activo: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleServicioActivo(servicioId, !activo))}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium disabled:opacity-60 ${
        activo
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {activo ? "Activo" : "Inactivo"}
    </button>
  );
}
