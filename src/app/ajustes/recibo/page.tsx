import { AppHeader } from "@/components/AppHeader";
import { AjustesReciboForm } from "@/components/AjustesReciboForm";
import { obtenerNegocioConfig } from "@/lib/negocio";

export const dynamic = "force-dynamic";

export default async function AjustesReciboPage() {
  const negocio = await obtenerNegocioConfig();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Datos del recibo" backHref="/" />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4 pb-10">
        <p className="text-sm text-slate-500">
          Esta información aparece en el encabezado y pie de página de todos
          los recibos imprimibles.
        </p>
        <AjustesReciboForm negocio={negocio} />
      </main>
    </div>
  );
}
