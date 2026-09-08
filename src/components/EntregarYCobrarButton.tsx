"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { entregarYCobrar } from "@/app/ordenes/[id]/actions";

export function EntregarYCobrarButton({
  ordenId,
  comprobanteId,
}: {
  ordenId: string;
  comprobanteId: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const resultado = await entregarYCobrar(ordenId, comprobanteId);
      if (resultado?.error) {
        setError(resultado.error);
        setConfirming(false);
        return;
      }
      router.push(`/ordenes/${ordenId}/comprobante/imprimir?accion=whatsapp`);
    });
  }

  if (!confirming) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-center text-base font-semibold text-white shadow-md shadow-emerald-600/30 active:bg-emerald-700"
        >
          Entregar maleta y marcar como pagada
        </button>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
      <p className="mb-3 text-sm text-emerald-900">
        ¿Confirmás que el cliente ya pagó y se lleva la maleta? Se marca la
        factura como pagada, la orden como entregada, y se abre WhatsApp con
        el recibo.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 active:bg-slate-50 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirmar}
          disabled={pending}
          className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white active:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Procesando…" : "Sí, confirmar"}
        </button>
      </div>
    </div>
  );
}
