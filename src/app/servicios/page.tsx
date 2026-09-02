import { AppHeader } from "@/components/AppHeader";
import { NuevoServicioForm } from "@/components/NuevoServicioForm";
import { ListaServicios } from "@/components/ListaServicios";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  const supabase = await createClient();
  const { data: servicios } = await supabase
    .from("servicios")
    .select("*")
    .order("nombre", { ascending: true });

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Lista de precios" backHref="/" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4 pb-10">
        <NuevoServicioForm />

        {servicios && servicios.length > 0 ? (
          <ListaServicios servicios={servicios} />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 py-16 text-center text-slate-500">
            <p className="font-medium">Todavía no cargaste servicios</p>
            <p className="text-sm">Agrega el primero con el formulario de arriba.</p>
          </div>
        )}
      </main>
    </div>
  );
}
