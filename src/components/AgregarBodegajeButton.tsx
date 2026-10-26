"use client";

import { useState, useTransition } from "react";
import { agregarBodegaje } from "@/app/ordenes/[id]/actions";
import { formatMoney } from "@/lib/money";

// "agregar": todavía no hay bodegaje en el recibo. "actualizar": ya hay
// uno con el valor del primer aviso y ahora corresponde el del segundo.
export function AgregarBodegajeButton({
  ordenId,
  monto,
  modo,
  montoActual,
}: {
  ordenId: string;
  monto: number;
  modo: "agregar" | "actualizar";
  montoActual?: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await agregarBodegaje(ordenId);
            setError(res?.error ?? null);
          })
        }
        className="rounded-lg bg-red-600 py-3 text-center text-sm font-semibold text-white shadow-md shadow-red-600/20 active:bg-red-700 disabled:opacity-60"
      >
        {pending
          ? "Agregando…"
          : modo === "agregar"
            ? `Agregar bodegaje de ${formatMoney(monto)} a la factura`
            : `Actualizar bodegaje a ${formatMoney(monto)} (era ${formatMoney(montoActual ?? 0)})`}
      </button>
      {error ? <p className="text-center text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
