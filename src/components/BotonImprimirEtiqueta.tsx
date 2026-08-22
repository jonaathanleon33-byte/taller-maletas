"use client";

export function BotonImprimirEtiqueta() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print w-full max-w-[320px] rounded-lg bg-slate-900 py-2.5 text-center text-sm font-semibold text-white active:bg-slate-700"
    >
      Imprimir etiqueta
    </button>
  );
}
