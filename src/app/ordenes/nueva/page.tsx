import { AppHeader } from "@/components/AppHeader";
import { NuevaOrdenForm } from "@/components/NuevaOrdenForm";
import { TECNICOS } from "@/lib/estado";
import { obtenerClientesConocidos } from "@/lib/clientes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NuevaOrdenPage({
  searchParams,
}: {
  searchParams: Promise<{
    recibo?: string;
    cliente?: string;
    telefono?: string;
    cotizacion?: string;
  }>;
}) {
  const clientes = await obtenerClientesConocidos();
  const { recibo, cliente, telefono, cotizacion: cotizacionId } = await searchParams;

  // Venir de una cotización: se rellenan los datos del cliente y de la
  // maleta, y sus fotos y ítems pasan a la orden al guardarla.
  let desdeCotizacion = null;
  if (cotizacionId) {
    const supabase = await createClient();
    const { data: cot } = await supabase
      .from("cotizaciones")
      .select("*")
      .eq("id", cotizacionId)
      .maybeSingle();
    if (cot && !cot.orden_id) {
      const { data: fotos } = await supabase
        .from("cotizacion_fotos")
        .select("url")
        .eq("cotizacion_id", cot.id)
        .order("created_at", { ascending: true });
      desdeCotizacion = {
        id: cot.id,
        numero: cot.numero,
        cliente_nombre: cot.cliente_nombre,
        cliente_telefono: cot.cliente_telefono,
        marca: cot.marca ?? "",
        color: cot.color ?? "",
        tamano: cot.tamano ?? "",
        tipo: cot.tipo ?? "",
        descripcion: cot.descripcion,
        fotos: (fotos ?? []).map((f) => f.url),
      };
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Nueva orden" backHref="/" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <NuevaOrdenForm
          tecnicos={TECNICOS}
          clientes={clientes}
          prefill={{
            numero_recibo: recibo,
            cliente_nombre: desdeCotizacion?.cliente_nombre ?? cliente,
            cliente_telefono: desdeCotizacion?.cliente_telefono ?? telefono,
          }}
          cotizacion={desdeCotizacion ?? undefined}
        />
      </main>
    </div>
  );
}
