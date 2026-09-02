"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { linkWhatsapp } from "@/lib/estado";
import { createClient } from "@/lib/supabase/client";
import { prepararImagenParaImprimir } from "@/lib/imprimir-nitido";

async function capturarRecibo(el: HTMLElement): Promise<Blob | null> {
  // html2canvas 1.x no sabe interpretar los colores oklch()/lab() que
  // usa Tailwind v4 y hace fallar toda la captura en silencio; usamos
  // este fork mantenido que sí los soporta.
  const html2canvas = (await import("html2canvas-pro")).default;
  const canvas = await html2canvas(el, {
    backgroundColor: "#ffffff",
    scale: 3,
    useCORS: true,
  });
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function subirRecibo(blob: Blob): Promise<string | null> {
  const supabase = createClient();
  const archivo = `recibo-${Date.now()}.png`;
  const { error } = await supabase.storage
    .from("recibos-compartidos")
    .upload(archivo, blob, { contentType: "image/png" });

  if (error) {
    console.error("No se pudo subir la foto del recibo:", error);
    return null;
  }

  return `${window.location.origin}/r/${archivo}`;
}

export function AccionesRecibo({
  targetId,
  telefono,
  mensaje,
  etiquetaHref,
  autoAccion,
}: {
  targetId: string;
  telefono: string;
  mensaje: string;
  etiquetaHref?: string;
  autoAccion?: "imprimir" | "whatsapp";
}) {
  const [enviando, setEnviando] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  const autoDisparado = useRef(false);

  async function imprimir() {
    setImprimiendo(true);
    await prepararImagenParaImprimir({
      captureId: "recibo-capture",
      imgId: "recibo-print-img",
      cardId: "recibo-card",
    });
    setImprimiendo(false);
    window.print();
  }

  // La navegación con window.location.href no necesita un toque
  // "fresco" como sí lo necesitan la descarga de archivos o
  // navigator.share en iOS/Safari, así que acá podemos esperar la
  // captura y la subida de la imagen sin problema antes de abrir
  // WhatsApp.
  async function enviarWhatsapp() {
    setEnviando(true);

    const el = document.getElementById(targetId);
    let link: string | null = null;

    if (el) {
      try {
        const blob = await Promise.race([
          capturarRecibo(el),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 20000)),
        ]);
        if (blob) {
          link = await subirRecibo(blob);
        }
      } catch (err) {
        console.error("No se pudo preparar la foto del recibo:", err);
      }
    }

    setEnviando(false);

    const mensajeFinal = link ? `${mensaje}\n\n${link}` : mensaje;
    if (!link) {
      alert(
        "No se pudo generar la foto del recibo. Se abrirá WhatsApp solo con el mensaje.",
      );
    }
    window.location.href = linkWhatsapp(telefono, mensajeFinal);
  }

  // Permite llegar a esta pantalla ya con la acción en marcha (desde
  // el botón correspondiente en la pantalla del comprobante), en vez
  // de obligar a un clic de más acá.
  useEffect(() => {
    if (autoDisparado.current || !autoAccion) return;
    autoDisparado.current = true;
    // El setState que disparan imprimir()/enviarWhatsapp() no puede
    // pasar sincrónicamente dentro del efecto — se difiere un tick.
    queueMicrotask(() => {
      if (autoAccion === "imprimir") {
        imprimir();
      } else if (autoAccion === "whatsapp") {
        enviarWhatsapp();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAccion]);

  return (
    <div className="no-print flex w-full max-w-[320px] flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={imprimir}
          disabled={imprimiendo}
          className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white active:bg-slate-700 disabled:opacity-60"
        >
          {imprimiendo ? "Preparando…" : "Imprimir"}
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
        Se abre el chat del cliente con el mensaje y el link a la foto
        del recibo.
      </p>
      {etiquetaHref ? (
        <Link
          href={etiquetaHref}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-center text-sm font-semibold text-slate-700 active:bg-slate-50"
        >
          Imprimir en sticker
        </Link>
      ) : null}
    </div>
  );
}
