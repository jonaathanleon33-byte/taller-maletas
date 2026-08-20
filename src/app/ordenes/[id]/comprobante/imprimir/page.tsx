import Link from "next/link";
import { notFound } from "next/navigation";
import { BotonImprimir } from "@/components/BotonImprimir";
import { ReciboImprimible } from "@/components/ReciboImprimible";
import { createClient } from "@/lib/supabase/server";
import { TAMANO_LABELS, TIPO_LABELS } from "@/lib/estado";

export const dynamic = "force-dynamic";

export default async function ImprimirComprobantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: orden } = await supabase
    .from("ordenes")
    .select("*")
    .eq("id", id)
    .single();

  if (!orden) {
    notFound();
  }

  const { data: comprobante } = await supabase
    .from("comprobantes")
    .select("*")
    .eq("orden_id", id)
    .maybeSingle();

  if (!comprobante) {
    notFound();
  }

  const { data: items } = await supabase
    .from("comprobante_items")
    .select("*")
    .eq("comprobante_id", comprobante.id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-1 flex-col items-center gap-4 bg-slate-100 px-4 py-6 print:bg-white print:py-0">
      <div className="no-print flex w-full max-w-[320px] items-center justify-between">
        <Link href={`/ordenes/${orden.id}/comprobante`} className="text-sm text-slate-600">
          ← Volver
        </Link>
        <BotonImprimir />
      </div>

      <div className="w-full max-w-[320px] rounded-lg bg-white p-4 shadow-sm print:shadow-none">
        <ReciboImprimible
          numeroRecibo={orden.numero_recibo}
          comprobante={comprobante}
          items={items ?? []}
          clienteNombre={orden.cliente_nombre}
          clienteTelefono={orden.cliente_telefono}
          maletaInfo={`${orden.marca} ${orden.color} · ${TAMANO_LABELS[orden.tamano]} · ${TIPO_LABELS[orden.tipo]}`}
        />
      </div>
    </div>
  );
}
