import { createClient } from "@/lib/supabase/server";
import { actualizarPrecioEnSheets } from "@/lib/google-sheets";
import { calcularTotales } from "@/lib/money";

// Después de cualquier cambio en los ítems o en descuentos/impuestos
// del comprobante, si está asociado a una orden (no una venta
// directa), reflejamos el precio actualizado en la fila de esa orden
// en Google Sheets.
export async function sincronizarPrecioSheets(comprobanteId: string) {
  const supabase = await createClient();
  const { data: comprobante } = await supabase
    .from("comprobantes")
    .select("orden_id, descuento_global, impuestos, facturacion_electronica")
    .eq("id", comprobanteId)
    .maybeSingle();

  if (!comprobante?.orden_id) return;

  const { data: items } = await supabase
    .from("comprobante_items")
    .select("precio_unitario, cantidad, descuento_pct")
    .eq("comprobante_id", comprobanteId);

  const { total } = calcularTotales(
    items ?? [],
    comprobante.descuento_global,
    comprobante.impuestos,
    comprobante.facturacion_electronica,
  );

  await actualizarPrecioEnSheets(comprobante.orden_id, total);
}
