"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sincronizarPrecioSheets } from "@/lib/precio-sheets";
import { capitalizarNombre, capitalizarPrimera } from "@/lib/texto";
import type { MetodoPago } from "@/types/database";
import type { AccionResultado } from "@/lib/accion";
import { comprobantesHermanos } from "@/lib/recibo-iva";

export type AgregarItemState = { error: string } | null;

export async function agregarItem(
  path: string,
  comprobanteId: string,
  _prevState: AgregarItemState,
  formData: FormData,
): Promise<AgregarItemState> {
  const servicioId = String(formData.get("servicio_id") ?? "") || null;
  const descripcion = capitalizarPrimera(
    String(formData.get("descripcion") ?? "").trim(),
  );
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
): Promise<AccionResultado> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("comprobante_items")
    .delete()
    .eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath(path);
  await sincronizarPrecioSheets(comprobanteId);
  return null;
}

export async function actualizarPrecioItem(
  path: string,
  comprobanteId: string,
  itemId: string,
  precioUnitario: number,
): Promise<AccionResultado> {
  if (Number.isNaN(precioUnitario) || precioUnitario < 0) {
    return { error: "El precio no es válido." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("comprobante_items")
    .update({ precio_unitario: precioUnitario })
    .eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath(path);
  await sincronizarPrecioSheets(comprobanteId);
  return null;
}

export type ActualizarComprobanteState = { error: string } | null;

export async function actualizarComprobante(
  path: string,
  comprobanteId: string,
  ordenId: string | null,
  _prevState: ActualizarComprobanteState,
  formData: FormData,
): Promise<ActualizarComprobanteState> {
  const metodoPago = String(formData.get("metodo_pago") ?? "efectivo") as MetodoPago;
  const atendidoPor = String(formData.get("atendido_por") ?? "").trim();
  const descuentoGlobal = Number(formData.get("descuento_global") || 0);
  const impuestos = Number(formData.get("impuestos") || 0);
  const abono = Number(formData.get("abono") || 0);
  const pagado = formData.get("pagado") === "on";
  const facturacionElectronica = formData.get("facturacion_electronica") === "on";

  if (!atendidoPor) {
    return { error: "Selecciona quién atendió al cliente." };
  }
  if (Number.isNaN(descuentoGlobal) || descuentoGlobal < 0) {
    return { error: "El descuento no es válido." };
  }
  if (Number.isNaN(impuestos) || impuestos < 0) {
    return { error: "Los impuestos no son válidos." };
  }
  if (Number.isNaN(abono) || abono < 0) {
    return { error: "El abono no es válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("comprobantes")
    .update({
      metodo_pago: metodoPago,
      atendido_por: atendidoPor,
      descuento_global: descuentoGlobal,
      impuestos,
      abono,
      pagado,
      facturacion_electronica: facturacionElectronica,
    })
    .eq("id", comprobanteId);

  if (error) {
    return { error: error.message };
  }

  // La persona que atiende el comprobante es la misma que queda
  // registrada como quien recibió la maleta en la orden.
  if (ordenId) {
    await supabase
      .from("ordenes")
      .update({ recibido_por: atendidoPor })
      .eq("id", ordenId);
    revalidatePath(`/ordenes/${ordenId}`);
  }

  // La facturación electrónica es del cliente, no de una maleta: se
  // aplica igual a todas las maletas del recibo, para no tener que
  // marcarla una por una. Los totales de cada una se recalculan.
  if (ordenId) {
    const { comprobantes } = await comprobantesHermanos(supabase, ordenId);
    const distintos = comprobantes.filter(
      (c) => c.facturacion_electronica !== facturacionElectronica,
    );
    if (distintos.length > 0) {
      const { error: errorHermanas } = await supabase
        .from("comprobantes")
        .update({ facturacion_electronica: facturacionElectronica })
        .in(
          "id",
          distintos.map((c) => c.id),
        );
      if (errorHermanas) {
        return {
          error:
            "Se guardó esta maleta, pero no se pudo aplicar a las demás del recibo: " +
            errorHermanas.message,
        };
      }
      for (const c of distintos) {
        if (c.orden_id) revalidatePath(`/ordenes/${c.orden_id}/comprobante`);
        await sincronizarPrecioSheets(c.id);
      }
    }
  }

  revalidatePath(path);
  await sincronizarPrecioSheets(comprobanteId);
  return null;
}

// Nombre del cliente de una venta directa (las órdenes de maletas
// cambian el nombre desde la orden, ver actualizarNombreCliente).
export async function actualizarNombreVenta(
  comprobanteId: string,
  nombre: string,
): Promise<AccionResultado> {
  const limpio = capitalizarNombre(nombre.trim().replace(/\s+/g, " "));
  if (!limpio) return { error: "Escribe un nombre." };
  if (limpio.length > 100) return { error: "El nombre es demasiado largo." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("comprobantes")
    .update({ cliente_nombre: limpio })
    .eq("id", comprobanteId);

  if (error) return { error: error.message };

  revalidatePath(`/ventas/${comprobanteId}`);
  revalidatePath("/");
  return null;
}
