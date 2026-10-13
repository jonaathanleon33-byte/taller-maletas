import type { Metadata } from "next";
import { DomicilioForm } from "@/components/DomicilioForm";
import { LogoTaller } from "@/components/LogoTaller";

export const metadata: Metadata = {
  title: "Solicitar domicilio — Reparación de Maletas",
  robots: { index: false },
};

// Página pública: el link se le envía al cliente por WhatsApp. Solo
// permite pedir un domicilio; no muestra nada del sistema.
export default function DomicilioPublicoPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <LogoTaller className="h-7 w-7 shrink-0 text-blue-700" />
        <h1 className="text-base font-semibold text-slate-900">
          Reparación de Maletas · Domicilio
        </h1>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-4 pb-10">
        <p className="text-sm text-slate-600">
          Programa la recogida o entrega de tu maleta o morral. Servicio solo
          para Bogotá.
        </p>
        <DomicilioForm />
      </main>
    </div>
  );
}
