"use client";

import { useTransition } from "react";
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

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => eliminarItem(path, comprobanteId, itemId))
      }
      aria-label="Eliminar ítem"
      className="shrink-0 text-slate-400 active:text-red-600 disabled:opacity-60"
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
