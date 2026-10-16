"use client";

export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white active:bg-blue-700"
    >
      Imprimir
    </button>
  );
}
