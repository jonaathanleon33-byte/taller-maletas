"use client";

import { linkWhatsapp } from "@/lib/estado";

export function AccionesRecibo({
  telefono,
  mensaje,
}: {
  telefono: string;
  mensaje: string;
}) {
  return (
    <div className="no-print flex w-full max-w-[320px] gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white active:bg-slate-700"
      >
        Imprimir
      </button>
      <a
        href={linkWhatsapp(telefono, mensaje)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white active:bg-emerald-700"
      >
        WhatsApp
      </a>
    </div>
  );
}
