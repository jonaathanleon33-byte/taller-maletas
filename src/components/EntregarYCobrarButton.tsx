"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  entregarYCobrar,
  entregarYCobrarRecibo,
} from "@/app/ordenes/[id]/actions";

// Dos usos: una sola maleta (comprobanteId) o todas las pendientes del
// recibo (cantidadMaletas) cuando el cliente viene por todas juntas.
// `soloEsta` solo cambia el texto, para distinguirlo del botón de
// "todas" cuando se muestran los dos.
export function EntregarYCobrarButton({
  ordenId,
  comprobanteId,
  cantidadMaletas,
  soloEsta,
}: {
  ordenId: string;
  comprobanteId?: string;
  cantidadMaletas?: number;
  soloEsta?: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const todas = cantidadMaletas !== undefined;

  function confirmar() {
    startTransition(async () => {
      const resultado = todas
        ? await entregarYCobrarRecibo(ordenId)
        : await entregarYCobrar(ordenId, comprobanteId ?? "");
      if (resultado?.error) {
        setError(resultado.error);
        setConfirming(false);
        return;
      }
      router.push(`/ordenes/${ordenId}/comprobante/imprimir?accion=whatsapp`);
    });
  }

  const etiqueta = todas
    ? `Entregar las ${cantidadMaletas} maletas y marcar todas como pagadas`
    : soloEsta
      ? "Entregar solo esta maleta y marcar como pagada"
      : "Entregar maleta y marcar como pagada";

  if (!confirming) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-center text-base font-semibold shadow-md ${
            soloEsta
              ? "border border-emerald-600 bg-white text-emerald-700 shadow-none active:bg-emerald-50"
              : "bg-emerald-600 text-white shadow-emerald-600/30 active:bg-emerald-700"
          }`}
        >
          {etiqueta}
        </button>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
      <p className="mb-3 text-sm text-emerald-900">
        {todas
          ? `¿Confirmás que el cliente ya pagó y se lleva las ${cantidadMaletas} maletas? Se marcan todas las facturas como pagadas y todas las maletas como entregadas, y se abre WhatsApp con un solo recibo.`
          : "¿Confirmás que el cliente ya pagó y se lleva la maleta? Se marca la factura como pagada, la orden como entregada, y se abre WhatsApp con el recibo."}
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
