"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { actualizarPrecioEnSheets } from "@/lib/google-sheets";
import { calcularTotales } from "@/lib/money";
import type { MetodoPago } from "@/types/database";

// Después de cualquier cambio en los ítems o en descuentos/impuestos
// del comprobante, si está asociado a una orden (no una venta
// directa), reflejamos el precio actualizado en la fila de esa orden
// en Google Sheets.
async function sincronizarPrecioSheets(comprobanteId: string) {
  const supabase = await createClient();
  const { data: comprobante } = await supabase
    .from("comprobantes")
    .select("orden_id, descuento_global, impuestos")
    .eq("id", comprobanteId)
    .maybeSingle();

  if (!comprobante?.orden_id) return;

  const [{ data: orden }, { data: items }] = await Promise.all([
    supabase
      .from("ordenes")
      .select("numero_recibo")
      .eq("id", comprobante.orden_id)
      .maybeSingle(),
    supabase
      .from("comprobante_items")
      .select("precio_unitario, cantidad, descuento_pct")
      .eq("comprobante_id", comprobanteId),
  ]);

  if (!orden) return;

  const { total } = calcularTotales(
    items ?? [],
    comprobante.descuento_global,
    comprobante.impuestos,
  );

  await actualizarPrecioEnSheets(orden.numero_recibo, total);
}

export type AgregarItemState = { error: string } | null;

export async function agregarItem(
  path: string,
  comprobanteId: string,
  _prevState: AgregarItemState,
  formData: FormData,
): Promise<AgregarItemState> {
  const servicioId = String(formData.get("servicio_id") ?? "") || null;
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const precioUnitario = Number(formData.get("precio_unitario"));
  const cantidad = Number(formData.get("cantidad") || 1);
  const descuentoPct = Number(formData.get("descuento_pct") || 0);

  if (!descripcion) {
    return { error: "Ingresa una descripción para el ítem." };
  }
  if (Number.isNaN(precioUnitario) || precioUnitario < 0) {
    return { error: "El precio no es válido." };
  }
  if (Number.isNaN(cantidad) || cantidad < 1) {
    return { error: "La cantidad no es válida." };
  }
  if (Number.isNaN(descuentoPct) || descuentoPct < 0 || descuentoPct > 100) {
    return { error: "El descuento debe ser entre 0 y 100." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("comprobante_items").insert({
    comprobante_id: comprobanteId,
    servicio_id: servicioId,
    descripcion,
    precio_unitario: precioUnitario,
    cantidad,
    descuento_pct: descuentoPct,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(path);
  await sincronizarPrecioSheets(comprobanteId);
  return null;
}

export async function eliminarItem(
  path: string,
  comprobanteId: string,
  itemId: string,
) {
  const supabase = await createClient();
  await supabase.from("comprobante_items").delete().eq("id", itemId);
  revalidatePath(path);
  await sincronizarPrecioSheets(comprobanteId);
}

export async function actualizarPrecioItem(
  path: string,
  comprobanteId: string,
  itemId: string,
  precioUnitario: number,
) {
  if (Number.isNaN(precioUnitario) || precioUnitario < 0) return;
  const supabase = await createClient();
  await supabase
    .from("comprobante_items")
    .update({ precio_unitario: precioUnitario })
    .eq("id", itemId);
  revalidatePath(path);
  await sincronizarPrecioSheets(comprobanteId);
}

export type ActualizarComprobanteState = { error: string } | null;

export async function actualizarComprobante(
  path: string,
  comprobanteId: string,
  _prevState: ActualizarComprobanteState,
  formData: FormData,
): Promise<ActualizarComprobanteState> {
  const metodoPago = String(formData.get("metodo_pago") ?? "efectivo") as MetodoPago;
  const atendidoPor = String(formData.get("atendido_por") ?? "").trim() || null;
  const descuentoGlobal = Number(formData.get("descuento_global") || 0);
  const impuestos = Number(formData.get("impuestos") || 0);
  const pagado = formData.get("pagado") === "on";

  if (Number.isNaN(descuentoGlobal) || descuentoGlobal < 0) {
    return { error: "El descuento no es válido." };
  }
  if (Number.isNaN(impuestos) || impuestos < 0) {
    return { error: "Los impuestos no son válidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("comprobantes")
    .update({
      metodo_pago: metodoPago,
      atendido_por: atendidoPor,
      descuento_global: descuentoGlobal,
      impuestos,
      pagado,
    })
    .eq("id", comprobanteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(path);
  await sincronizarPrecioSheets(comprobanteId);
  return null;
}
