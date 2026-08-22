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

async function capturarRecibo(el: HTMLElement): Promise<Blob | null> {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(el, {
    backgroundColor: "#ffffff",
    scale: 4,
    useCORS: true,
    onclone: (clonedDoc) => {
      // Aplicamos las mismas reglas @media print (ancho/letra del
      // ticket térmico) a la captura, así la imagen que se descarga
      // coincide con lo que sale impreso, no con la vista ancha de
      // pantalla.
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
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function descargarBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "recibo.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
    setEnviando(true);

    // wa.me solo acepta texto, nunca un archivo adjunto — no hay forma
    // de que un sitio web adjunte una foto directamente a un chat
    // específico. En vez de mandar un link (que se ve feo y a veces ni
    // genera vista previa), descargamos la foto real del recibo para
    // que la adjuntes vos mismo, y abrimos igual el chat exacto del
    // número guardado.
    const el = document.getElementById(targetId);

    if (el) {
      const blob = await Promise.race([
        capturarRecibo(el),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
      ]);

      if (blob) {
        descargarBlob(blob);
      }
    }

    setEnviando(false);
    window.location.href = linkWhatsapp(telefono, mensaje);
  }

  return (
    <div className="no-print flex w-full max-w-[320px] flex-col gap-2">
      <div className="flex gap-2">
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
      <p className="text-center text-xs text-slate-500">
        Se descarga la foto del recibo y se abre el chat — adjúntala ahí.
      </p>
    </div>
  );
}
