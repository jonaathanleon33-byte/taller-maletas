"use client";

import { useState, useTransition } from "react";
import { eliminarItem } from "@/lib/comprobante-actions";

export function EliminarItemButton({
  path,
  comprobanteId,
  itemId,
}: {
  path: string;
  comprobanteId: string;
  itemId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await eliminarItem(path, comprobanteId, itemId);
          setError(res?.error ?? null);
        })
      }
      title={error ?? undefined}
      aria-label={error ? `Error: ${error}` : "Eliminar ítem"}
      className={`shrink-0 active:text-red-600 disabled:opacity-60 ${error ? "text-red-600" : "text-slate-400"}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
