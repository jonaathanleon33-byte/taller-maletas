"use client";

import { useState } from "react";
import { prepararImagenParaImprimir } from "@/lib/imprimir-nitido";

export function BotonImprimirEtiqueta() {
  const [preparando, setPreparando] = useState(false);

  async function imprimir() {
    setPreparando(true);
    await prepararImagenParaImprimir({
      captureId: "etiqueta-capture",
      imgId: "etiqueta-print-img",
      cardId: "etiqueta-card",
    });
    setPreparando(false);
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
