"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
      // ticket térmico) a la captura, así la imagen que viaja por
      // WhatsApp coincide con lo que sale impreso, no con la vista
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
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function subirRecibo(blob: Blob): Promise<string | null> {
  const supabase = createClient();
  const path = `recibo-${Date.now()}.png`;
  const { error } = await supabase.storage
    .from("recibos-compartidos")
    .upload(path, blob, { contentType: "image/png" });
  if (error) return null;

  return path;
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

    // wa.me solo acepta texto, nunca un archivo adjunto — así que
    // subimos la imagen del recibo y metemos el link dentro del
    // mensaje. WhatsApp la muestra como vista previa en el chat, y
    // como seguimos usando wa.me, abre la conversación exacta del
    // número guardado (a diferencia del panel de compartir del
    // sistema, que solo deja elegir un contacto a mano).
    const el = document.getElementById(targetId);
    let mensajeFinal = mensaje;

    if (el) {
      const resultado = await Promise.race([
        (async () => {
          const blob = await capturarRecibo(el);
          if (!blob) return null;
          return subirRecibo(blob);
        })(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
      ]);

      if (resultado) {
        mensajeFinal = `${mensaje}\n${window.location.origin}/r/${resultado}`;
      }
    }

    setEnviando(false);
    window.location.href = linkWhatsapp(telefono, mensajeFinal);
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
