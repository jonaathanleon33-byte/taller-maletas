import { AppHeader } from "@/components/AppHeader";
import { NuevoServicioForm } from "@/components/NuevoServicioForm";
import { ToggleServicioButton } from "@/components/ToggleServicioButton";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";

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
          <ul className="flex flex-col gap-2">
            {servicios.map((servicio) => (
              <li
                key={servicio.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {servicio.nombre}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatMoney(servicio.precio)}
                  </p>
                </div>
                <ToggleServicioButton
                  servicioId={servicio.id}
                  activo={servicio.activo}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 py-16 text-center text-slate-500">
            <p className="font-medium">Todavía no cargaste servicios</p>
            <p className="text-sm">Agregá el primero con el formulario de arriba.</p>
          </div>
        )}
      </main>
    </div>
  );
}
