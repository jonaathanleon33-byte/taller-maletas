import { AppHeader } from "@/components/AppHeader";
import { NuevaVentaForm } from "@/components/NuevaVentaForm";
import { obtenerClientesConocidos } from "@/lib/clientes";

export const dynamic = "force-dynamic";

export default async function NuevaVentaPage() {
  const clientes = await obtenerClientesConocidos();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Nueva venta" backHref="/" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <NuevaVentaForm clientes={clientes} />
      </main>
    </div>
  );
}
