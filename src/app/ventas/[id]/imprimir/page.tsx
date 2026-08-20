import Link from "next/link";
import { notFound } from "next/navigation";
import { BotonImprimir } from "@/components/BotonImprimir";
import { ReciboImprimible } from "@/components/ReciboImprimible";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ImprimirVentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: comprobante } = await supabase
    .from("comprobantes")
    .select("*")
    .eq("id", id)
    .is("orden_id", null)
    .maybeSingle();

  if (!comprobante) {
    notFound();
  }

  const { data: items } = await supabase
    .from("comprobante_items")
    .select("*")
    .eq("comprobante_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-1 flex-col items-center gap-4 bg-slate-100 px-4 py-6 print:bg-white print:py-0">
      <div className="no-print flex w-full max-w-[320px] items-center justify-between">
        <Link href={`/ventas/${id}`} className="text-sm text-slate-600">
          ← Volver
        </Link>
        <BotonImprimir />
      </div>

      <div className="w-full max-w-[320px] rounded-lg bg-white p-4 shadow-sm print:max-w-none print:w-[58mm] print:rounded-none print:p-1 print:shadow-none">
        <ReciboImprimible
          numeroRecibo={`V-${id.slice(0, 8).toUpperCase()}`}
          comprobante={comprobante}
          items={items ?? []}
          clienteNombre={comprobante.cliente_nombre ?? ""}
          clienteTelefono={comprobante.cliente_telefono ?? ""}
        />
      </div>
    </div>
  );
}
