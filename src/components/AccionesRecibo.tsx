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

function esMobil() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

type ResultadoCompartir = "shared" | "cancelado" | "fallback";

async function compartirImagen(
  el: HTMLElement,
  mensaje: string,
): Promise<ResultadoCompartir> {
  try {
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
    if (!blob) return "fallback";

    const file = new File([blob], "recibo.png", { type: "image/png" });
    if (!navigator.canShare?.({ files: [file] })) return "fallback";

    await navigator.share({ files: [file], text: mensaje });
    return "shared";
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return "cancelado";
    return "fallback";
  }
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
    // En computador, WhatsApp no aparece en el panel de compartir del
    // sistema (macOS/Windows), así que ahí ni lo intentamos: vamos
    // directo al link de texto. En celular sí suele aparecer, así que
    // ahí probamos mandar la imagen del recibo.
    if (!esMobil()) {
      window.location.href = linkWhatsapp(telefono, mensaje);
      return;
    }

    const el = document.getElementById(targetId);
    setEnviando(true);

    // Si compartir la imagen se cuelga por lo que sea, no queremos que
    // el botón se quede en "Preparando…" para siempre: a los 8s pasamos
    // al link de WhatsApp con texto, que siempre funciona.
    const resultado: ResultadoCompartir = el
      ? await Promise.race([
          compartirImagen(el, mensaje),
          new Promise<ResultadoCompartir>((resolve) =>
            setTimeout(() => resolve("fallback"), 8000),
          ),
        ])
      : "fallback";

    setEnviando(false);

    if (resultado === "fallback") {
      window.location.href = linkWhatsapp(telefono, mensaje);
    }
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
