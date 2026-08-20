"use client";

export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white active:bg-slate-700"
    >
      Imprimir
    </button>
  );
}
