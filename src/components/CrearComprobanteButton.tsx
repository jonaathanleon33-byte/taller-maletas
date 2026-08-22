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
      className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 py-3.5 text-center text-base font-bold text-white shadow-md shadow-blue-600/30 active:bg-blue-700 disabled:opacity-60"
    >
      {pending ? (
        "Creando…"
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Crear factura
        </>
      )}
    </button>
  );
}
