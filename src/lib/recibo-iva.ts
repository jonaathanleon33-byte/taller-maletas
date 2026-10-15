import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Las maletas de un mismo recibo son de un mismo cliente: si pidió
// facturación electrónica, aplica a todas. Esto devuelve las demás
// órdenes del recibo y sus comprobantes.
export async function comprobantesHermanos(supabase: Supabase, ordenId: string) {
  const { data: actual } = await supabase
    .from("ordenes")
    .select("numero_recibo")
    .eq("id", ordenId)
    .single();
  if (!actual) return { ordenIds: [] as string[], comprobantes: [] };

  const { data: ordenes } = await supabase
    .from("ordenes")
    .select("id")
    .eq("numero_recibo", actual.numero_recibo)
    .neq("id", ordenId);
  const ordenIds = (ordenes ?? []).map((o) => o.id);
  if (ordenIds.length === 0) return { ordenIds, comprobantes: [] };

  const { data: comprobantes } = await supabase
    .from("comprobantes")
    .select("id, orden_id, facturacion_electronica")
    .in("orden_id", ordenIds);
  return { ordenIds, comprobantes: comprobantes ?? [] };
}

// Una maleta nueva (o un comprobante recién creado) hereda la
// facturación electrónica del resto de su recibo.
export async function heredarFacturacionElectronica(
  supabase: Supabase,
  ordenId: string,
) {
  const { comprobantes } = await comprobantesHermanos(supabase, ordenId);
  if (comprobantes.some((c) => c.facturacion_electronica)) {
    await supabase
      .from("comprobantes")
      .update({ facturacion_electronica: true })
      .eq("orden_id", ordenId);
  }
}
