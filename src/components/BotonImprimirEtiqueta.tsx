"use client";

import { useState } from "react";

// Las impresoras térmicas son de 1 bit (solo negro o blanco): el
// texto renderizado por el navegador tiene bordes grises
// (antialiasing) que la impresora convierte en un patrón punteado
// borroso. Para evitarlo, capturamos la etiqueta como imagen y
// convertimos cada píxel a negro puro o blanco puro (sin grises)
// antes de imprimir esa imagen en vez del texto en vivo.
async function generarImagenNitida(el: HTMLElement): Promise<string | null> {
  const html2canvas = (await import("html2canvas-pro")).default;
  const canvas = await html2canvas(el, {
    backgroundColor: "#ffffff",
    scale: 4,
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const datos = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixeles = datos.data;
  for (let i = 0; i < pixeles.length; i += 4) {
    const luminancia =
      0.299 * pixeles[i] + 0.587 * pixeles[i + 1] + 0.114 * pixeles[i + 2];
    const valor = luminancia < 190 ? 0 : 255;
    pixeles[i] = valor;
    pixeles[i + 1] = valor;
    pixeles[i + 2] = valor;
    pixeles[i + 3] = 255;
  }
  ctx.putImageData(datos, 0, 0);

  return canvas.toDataURL("image/png");
}

export function BotonImprimirEtiqueta() {
  const [preparando, setPreparando] = useState(false);

  async function imprimir() {
    setPreparando(true);
    let listo = false;

    try {
      const el = document.getElementById("etiqueta-capture");
      const img = document.getElementById(
        "etiqueta-print-img",
      ) as HTMLImageElement | null;

      if (el && img) {
        const dataUrl = await Promise.race([
          generarImagenNitida(el),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000)),
        ]);
        if (dataUrl) {
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.src = dataUrl;
          });
          listo = true;
        }
      }
    } catch (err) {
      console.error("No se pudo generar la imagen nítida de la etiqueta:", err);
    } finally {
      setPreparando(false);
    }

    // Si algo falló, no queremos imprimir en blanco: dejamos que se
    // vea (e imprima) el texto en vivo como respaldo, aunque salga
    // con el borroso original — pero avisamos, para que no parezca
    // que el arreglo de nitidez no sirvió cuando en realidad ni se
    // aplicó esta vez.
    if (!listo) {
      alert(
        "No se pudo generar la versión nítida de la etiqueta. Se va a imprimir con el texto normal (puede verse borroso). Probá de nuevo.",
      );
      document.getElementById("etiqueta-card")?.classList.remove("print:hidden");
    }

    window.print();
  }

  return (
    <button
      type="button"
      onClick={imprimir}
      disabled={preparando}
      className="no-print w-full max-w-[320px] rounded-lg bg-slate-900 py-2.5 text-center text-sm font-semibold text-white active:bg-slate-700 disabled:opacity-60"
    >
      {preparando ? "Preparando…" : "Imprimir etiqueta"}
    </button>
  );
}
