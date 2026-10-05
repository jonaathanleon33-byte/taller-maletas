"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  actualizarDescripcionEnSheets,
  actualizarEstadoEnSheets,
} from "@/lib/google-sheets";
import { esEntregada } from "@/lib/estado";
import { capitalizarPrimera } from "@/lib/texto";
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
  const { error } = await supabase
    .from("ordenes")
    .update({ estado })
    .eq("id", ordenId);

  if (error) {
    return { error: error.message };
  }

  await actualizarEstadoEnSheets(ordenId, estado);

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

export type ActualizarDescripcionState = { error: string } | null;

export async function actualizarDescripcionOrden(
  ordenId: string,
  descripcion: string,
): Promise<ActualizarDescripcionState> {
  const limpia = capitalizarPrimera(descripcion.trim());
  if (!limpia) {
    return { error: "La descripción no puede quedar vacía." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ordenes")
    .update({ dano_descripcion: limpia })
    .eq("id", ordenId);

  if (error) {
    return { error: error.message };
  }

  await actualizarDescripcionEnSheets(ordenId, limpia);

  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath("/");
  return null;
}

export type EntregarYCobrarState = { error: string } | null;

// Igual que entregarYCobrar pero para todas las maletas del mismo
// recibo que todavía no se entregan — cuando el cliente viene por
// todas juntas y se le manda UN solo recibo con todo cancelado y
// entregado.
export async function entregarYCobrarRecibo(
  ordenId: string,
): Promise<EntregarYCobrarState> {
  const supabase = await createClient();

  const { data: actual } = await supabase
    .from("ordenes")
    .select("numero_recibo")
    .eq("id", ordenId)
    .single();

  if (!actual) {
    return { error: "No se encontró la orden." };
  }

  const { data: hermanas } = await supabase
    .from("ordenes")
    .select("id, estado")
    .eq("numero_recibo", actual.numero_recibo)
    .order("created_at", { ascending: true });

  const todas = hermanas ?? [];
  const pendientes = todas.filter((o) => !esEntregada(o.estado));

  if (pendientes.length === 0) {
    return { error: "Todas las maletas de este recibo ya fueron entregadas." };
  }

  const { data: comprobantes } = await supabase
    .from("comprobantes")
    .select("id, orden_id, atendido_por")
    .in(
      "orden_id",
      pendientes.map((o) => o.id),
    );

  for (const pendiente of pendientes) {
    const comprobante = comprobantes?.find((c) => c.orden_id === pendiente.id);
    if (!comprobante?.atendido_por) {
      const numeroMaleta = todas.findIndex((o) => o.id === pendiente.id) + 1;
      return {
        error: `Primero elige quién atendió en la factura de la Maleta ${numeroMaleta}.`,
      };
    }
  }

  const { error: errorComprobantes } = await supabase
    .from("comprobantes")
    .update({ pagado: true })
    .in(
      "id",
      (comprobantes ?? []).map((c) => c.id),
    );

  if (errorComprobantes) {
    return { error: errorComprobantes.message };
  }

  const { error: errorOrdenes } = await supabase
    .from("ordenes")
    .update({ estado: "entregada" })
    .in(
      "id",
      pendientes.map((o) => o.id),
    );

  if (errorOrdenes) {
    return { error: errorOrdenes.message };
  }

  for (const pendiente of pendientes) {
    await actualizarEstadoEnSheets(pendiente.id, "entregada");
    revalidatePath(`/ordenes/${pendiente.id}`);
    revalidatePath(`/ordenes/${pendiente.id}/comprobante`);
  }
  revalidatePath("/");
  return null;
}

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

  const { error: errorOrden } = await supabase
    .from("ordenes")
    .update({ estado: "entregada" })
    .eq("id", ordenId);

  if (errorOrden) {
    return { error: errorOrden.message };
  }

  await actualizarEstadoEnSheets(ordenId, "entregada");

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
