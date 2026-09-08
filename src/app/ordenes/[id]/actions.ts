"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarEstadoEnSheets } from "@/lib/google-sheets";
import type { Estado } from "@/types/database";

export type CambiarEstadoState = { error: string } | null;

export async function cambiarEstado(
  ordenId: string,
  _prevState: CambiarEstadoState,
  formData: FormData,
): Promise<CambiarEstadoState> {
  const estado = String(formData.get("estado") ?? "") as Estado;

  if (!estado) {
    return { error: "Elige un estado." };
  }

  const supabase = await createClient();
  const { data: orden, error } = await supabase
    .from("ordenes")
    .update({ estado })
    .eq("id", ordenId)
    .select("numero_recibo")
    .single();

  if (error) {
    return { error: error.message };
  }

  if (orden) {
    await actualizarEstadoEnSheets(orden.numero_recibo, estado);
  }

  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath("/");
  return null;
}

export async function actualizarTelefonoOrden(
  ordenId: string,
  telefono: string,
) {
  const limpio = telefono.trim();
  if (!limpio) return;

  const supabase = await createClient();
  await supabase
    .from("ordenes")
    .update({ cliente_telefono: limpio })
    .eq("id", ordenId);

  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath("/");
}

export async function actualizarTecnicoOrden(
  ordenId: string,
  tecnico: string,
) {
  const supabase = await createClient();
  await supabase
    .from("ordenes")
    .update({ tecnico_asignado: tecnico.trim() || null })
    .eq("id", ordenId);

  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath("/");
}

export type EntregarYCobrarState = { error: string } | null;

// Une en un solo paso lo que antes eran tres: marcar el comprobante
// como pagado, pasar la orden a "entregada" y (desde el botón) abrir
// WhatsApp con la factura — para el momento en que el cliente viene,
// paga y se lleva la maleta.
export async function entregarYCobrar(
  ordenId: string,
  comprobanteId: string,
): Promise<EntregarYCobrarState> {
  const supabase = await createClient();

  const { data: comprobante } = await supabase
    .from("comprobantes")
    .select("atendido_por")
    .eq("id", comprobanteId)
    .single();

  if (!comprobante?.atendido_por) {
    return {
      error: "Primero elige quién atendió en la factura de esta orden.",
    };
  }

  const { error: errorComprobante } = await supabase
    .from("comprobantes")
    .update({ pagado: true })
    .eq("id", comprobanteId);

  if (errorComprobante) {
    return { error: errorComprobante.message };
  }

  const { data: orden, error: errorOrden } = await supabase
    .from("ordenes")
    .update({ estado: "entregada" })
    .eq("id", ordenId)
    .select("numero_recibo")
    .single();

  if (errorOrden) {
    return { error: errorOrden.message };
  }

  if (orden) {
    await actualizarEstadoEnSheets(orden.numero_recibo, "entregada");
  }

  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath(`/ordenes/${ordenId}/comprobante`);
  revalidatePath("/");
  return null;
}

export type EliminarOrdenState = { error: string } | null;

/* eslint-disable @typescript-eslint/no-unused-vars -- required by useActionState's (prevState, formData) signature */
export async function eliminarOrden(
  ordenId: string,
  _prevState: EliminarOrdenState,
  _formData: FormData,
): Promise<EliminarOrdenState> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const supabase = await createClient();

  const { data: fotos } = await supabase
    .from("fotos")
    .select("url")
    .eq("orden_id", ordenId);

  const paths = (fotos ?? [])
    .map((foto) => foto.url.split("/fotos-ordenes/")[1])
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    await supabase.storage.from("fotos-ordenes").remove(paths);
  }

  const { error } = await supabase.from("ordenes").delete().eq("id", ordenId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}
