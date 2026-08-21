"use client";

import { useState } from "react";
import { linkWhatsapp } from "@/lib/estado";

function reglasDeImpresion(rules: CSSRuleList): string {
  let css = "";
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSMediaRule && rule.media.mediaText.includes("print")) {
      css += Array.from(rule.cssRules)
        .map((r) => r.cssText)
        .join("\n");
    } else if ("cssRules" in rule && (rule as CSSGroupingRule).cssRules) {
      // Tailwind anida las reglas print: dentro de @layer, así que hay
      // que bajar recursivamente por cualquier at-rule contenedora.
      css += reglasDeImpresion((rule as CSSGroupingRule).cssRules);
    }
  }
  return css;
}

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

  async function enviarWhatsapp() {
    const el = document.getElementById(targetId);

    setEnviando(true);
    try {
      if (el) {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(el, {
          backgroundColor: "#ffffff",
          scale: 4,
          useCORS: true,
          onclone: (clonedDoc) => {
            // Aplicamos las mismas reglas @media print (ancho/letra del
            // ticket térmico) a la captura, así la imagen de WhatsApp
            // coincide con lo que sale impreso en vez de con la vista
            // ancha de pantalla.
            const css = Array.from(document.styleSheets)
              .map((sheet) => {
                try {
                  return reglasDeImpresion(sheet.cssRules);
                } catch {
                  return "";
                }
              })
              .join("\n");

            const style = clonedDoc.createElement("style");
            style.textContent = css;
            clonedDoc.head.appendChild(style);
          },
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
    window.location.href = linkWhatsapp(telefono, mensaje);
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
