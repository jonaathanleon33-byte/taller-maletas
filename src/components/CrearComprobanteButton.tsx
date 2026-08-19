"use client";

import { useTransition } from "react";
import { crearComprobante } from "@/app/ordenes/[id]/comprobante/actions";

export function CrearComprobanteButton({ ordenId }: { ordenId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => crearComprobante(ordenId))}
      className="rounded-lg bg-slate-900 py-3 text-center text-base font-semibold text-white active:bg-slate-700 disabled:opacity-60"
    >
      {pending ? "Creando…" : "Crear comprobante"}
    </button>
  );
}
