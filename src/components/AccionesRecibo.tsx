"use client";

import { useState } from "react";

export function AccionesRecibo({
  targetId,
  telefono,
  mensaje,
}: {
  targetId: string;
  telefono: string;
  mensaje: string;
}) {
  const [enviando, setEnviando] = useState(false);

  function linkWhatsappTexto() {
    const soloDigitos = telefono.replace(/[^\d]/g, "");
    return `https://wa.me/${soloDigitos}?text=${encodeURIComponent(mensaje)}`;
  }

  async function enviarWhatsapp() {
    const el = document.getElementById(targetId);

    setEnviando(true);
    try {
      if (el) {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(el, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
        });
        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );

        if (blob) {
          const file = new File([blob], "recibo.png", { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], text: mensaje });
            return;
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
    } finally {
      setEnviando(false);
    }

    // Sin soporte para compartir archivos (o falló): navegamos a WhatsApp
    // en la misma pestaña con el mensaje de texto. No usamos window.open
    // porque el navegador lo bloquea después del trabajo async de arriba.
    window.location.href = linkWhatsappTexto();
  }

  return (
    <div className="no-print flex w-full max-w-[320px] gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white active:bg-slate-700"
      >
        Imprimir
      </button>
      <button
        type="button"
        onClick={enviarWhatsapp}
        disabled={enviando}
        className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white active:bg-emerald-700 disabled:opacity-60"
      >
        {enviando ? "Preparando…" : "WhatsApp"}
      </button>
    </div>
  );
}
