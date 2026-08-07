import { AppHeader } from "@/components/AppHeader";
import { NuevaOrdenForm } from "@/components/NuevaOrdenForm";
import { obtenerTecnicos } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export default async function NuevaOrdenPage() {
  const tecnicos = await obtenerTecnicos();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Nueva orden" backHref="/" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <NuevaOrdenForm tecnicos={tecnicos} />
      </main>
    </div>
  );
}
