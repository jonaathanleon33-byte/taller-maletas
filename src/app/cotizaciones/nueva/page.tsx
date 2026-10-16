import { AppHeader } from "@/components/AppHeader";
import { CotizacionForm } from "@/components/CotizacionForm";

export default function NuevaCotizacionPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Nueva cotización" backHref="/cotizaciones" />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-4 pb-10">
        <p className="text-sm text-slate-500">
          Las cotizaciones tienen su propia numeración (COT-0001…) y no
          afectan el consecutivo de recibos ni de facturas.
        </p>
        <CotizacionForm />
      </main>
    </div>
  );
}
