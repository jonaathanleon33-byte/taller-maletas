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
  const [preparando, setPreparando] = useState(false);
  const [listo, setListo] = useState<{ blob: Blob; preview: string } | null>(
    null,
  );

  async function prepararRecibo() {
    setPreparando(true);
    const el = document.getElementById(targetId);
    let blob: Blob | null = null;

    if (el) {
      try {
        blob = await Promise.race([
          capturarRecibo(el),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 20000)),
        ]);
      } catch (err) {
        console.error("No se pudo generar la imagen del recibo:", err);
        blob = null;
      }
    }

    setPreparando(false);

    if (!blob) {
      alert(
        "No se pudo generar la foto del recibo. Probá de nuevo.",
      );
      return;
    }

    setListo({ blob, preview: URL.createObjectURL(blob) });
  }

  // Esto se llama directo desde el segundo clic del usuario (no después
  // de un await), porque tanto la descarga como el share nativo de
  // iOS/Android sólo funcionan si ocurren en el mismo toque — si pasan
  // después de esperar la captura de la imagen, Safari los bloquea en
  // silencio y no pasa nada.
  function enviarAhora() {
    if (!listo) return;
    const { blob } = listo;
    const archivo = new File([blob], "recibo.png", { type: "image/png" });

    if (
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [archivo] })
    ) {
      navigator.share({ files: [archivo], text: mensaje }).catch((err) => {
        if ((err as Error)?.name !== "AbortError") {
          console.error("No se pudo compartir el recibo:", err);
        }
      });
    } else {
      // Sin soporte para compartir archivos (la mayoría de navegadores
      // de escritorio): descargamos la foto y abrimos el chat exacto
      // para que la adjuntes a mano.
      descargarBlob(blob);
      window.location.href = linkWhatsapp(telefono, mensaje);
    }

    URL.revokeObjectURL(listo.preview);
    setListo(null);
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
        {listo ? (
          <button
            type="button"
            onClick={enviarAhora}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white active:bg-emerald-700"
          >
            Enviar por WhatsApp
          </button>
        ) : (
          <button
            type="button"
            onClick={prepararRecibo}
            disabled={preparando}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white active:bg-emerald-700 disabled:opacity-60"
          >
            {preparando ? "Preparando…" : "WhatsApp"}
          </button>
        )}
      </div>
      {listo ? (
        <div className="flex items-center justify-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listo.preview}
            alt="Foto del recibo lista para enviar"
            className="h-12 w-12 rounded border border-slate-200 object-cover"
          />
          <p className="text-center text-xs text-slate-500">
            Foto lista — tocá &quot;Enviar por WhatsApp&quot;.
          </p>
        </div>
      ) : (
        <p className="text-center text-xs text-slate-500">
          Se prepara la foto del recibo y después se envía por WhatsApp.
        </p>
      )}
    </div>
  );
}
