import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const DESCRIPCION_BODEGAJE = "Bodegaje";

// El bodegaje se cobra UNA vez por recibo (no por maleta): se busca si
// ya hay un ítem de bodegaje en la factura de cualquier maleta del
// recibo, y cuál es la factura de la maleta indicada.
export async function bodegajeDelRecibo(supabase: Supabase, ordenId: string) {
  const { data: actual } = await supabase
    .from("ordenes")
    .select("numero_recibo")
    .eq("id", ordenId)
    .maybeSingle();
  if (!actual) return null;

  const { data: ordenes } = await supabase
    .from("ordenes")
    .select("id")
    .eq("numero_recibo", actual.numero_recibo);
  const ordenIds = (ordenes ?? []).map((o) => o.id);

  const { data: comprobantes } = await supabase
    .from("comprobantes")
    .select("id, orden_id, pagado")
    .in("orden_id", ordenIds);
  const lista = comprobantes ?? [];
  const propio = lista.find((c) => c.orden_id === ordenId) ?? null;

  const { data: items } = lista.length
    ? await supabase
        .from("comprobante_items")
        .select("id, comprobante_id, precio_unitario")
        .in("comprobante_id", lista.map((c) => c.id))
        .ilike("descripcion", `${DESCRIPCION_BODEGAJE}%`)
    : { data: [] };
  const item = (items ?? [])[0] ?? null;

  return {
    numeroRecibo: actual.numero_recibo,
    propio,
    item,
    enEstaMaleta: Boolean(item && propio && item.comprobante_id === propio.id),
  };
}
