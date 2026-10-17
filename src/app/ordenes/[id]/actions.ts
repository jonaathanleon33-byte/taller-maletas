"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  actualizarDescripcionEnSheets,
  actualizarEstadoEnSheets,
  actualizarFechaPrometidaEnSheets,
  actualizarNombreEnSheets,
  marcarOrdenEliminadaEnSheets,
} from "@/lib/google-sheets";
import {
  MENSAJE_TELEFONO_INVALIDO,
  esEntregada,
  fechaColombia,
  telefonoValido,
} from "@/lib/estado";
import { capitalizarNombre, capitalizarPrimera } from "@/lib/texto";
import type { Estado } from "@/types/database";
import type { AccionResultado } from "@/lib/accion";

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

  // Si deja de estar "lista", el aviso de "ya puede recogerla" que se
  // le mandó antes deja de valer. Va aparte y sin revisar el error para
  // que un fallo acá nunca impida el cambio de estado en sí.
  if (estado !== "lista") {
    await supabase
      .from("ordenes")
      .update({ notificada_lista_en: null, segunda_notificacion_en: null })
      .eq("id", ordenId);
  }

  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath("/");
  return null;
}

// Se llama al tocar "Notificar por WhatsApp" con la maleta en "Lista":
// deja registrado cuándo se le avisó al cliente.
export async function registrarNotificacionLista(
  ordenId: string,
): Promise<AccionResultado> {
  return registrarNotificacionListaGrupo([ordenId]);
}

// Igual que registrarNotificacionLista, pero para todas las maletas
// listas de un mismo cliente que se avisaron en un solo mensaje.
export async function registrarNotificacionListaGrupo(
  ordenIds: string[],
): Promise<AccionResultado> {
  if (ordenIds.length === 0) return null;
  const supabase = await createClient();
  const ahora = new Date().toISOString();

  // Primero las que ya habían sido notificadas: este es su SEGUNDO
  // aviso (el que trae el plazo de 6 días hábiles). Debe ir antes del
  // update general, que les pondría la fecha nueva a todas.
  const { error: errorSegunda } = await supabase
    .from("ordenes")
    .update({ notificada_lista_en: ahora, segunda_notificacion_en: ahora })
    .in("id", ordenIds)
    .eq("estado", "lista")
    .not("notificada_lista_en", "is", null)
    .is("segunda_notificacion_en", null);

  if (errorSegunda) {
    return {
      error: "No se pudo registrar la notificación: " + errorSegunda.message,
    };
  }

  const { error } = await supabase
    .from("ordenes")
    .update({ notificada_lista_en: ahora })
    .in("id", ordenIds)
    .eq("estado", "lista");

  if (error) {
    return { error: "No se pudo registrar la notificación: " + error.message };
  }

  for (const id of ordenIds) revalidatePath(`/ordenes/${id}`);
  revalidatePath("/notificar");
  revalidatePath("/");
  return null;
}

// El cliente es el mismo para todas las maletas del mismo recibo, así
// que el cambio de nombre se aplica a todas (y a sus filas del Sheet).
export async function actualizarNombreCliente(
  ordenId: string,
  nombre: string,
): Promise<AccionResultado> {
  const limpio = capitalizarNombre(nombre.trim().replace(/\s+/g, " "));
  if (!limpio) return { error: "Escribe un nombre." };
  if (limpio.length > 100) return { error: "El nombre es demasiado largo." };

  const supabase = await createClient();
  const { data: actual } = await supabase
    .from("ordenes")
    .select("numero_recibo")
    .eq("id", ordenId)
    .single();
  if (!actual) return { error: "No se encontró la orden." };

  const { data: actualizadas, error } = await supabase
    .from("ordenes")
    .update({ cliente_nombre: limpio })
    .eq("numero_recibo", actual.numero_recibo)
    .select("id");

  if (error) return { error: error.message };

  const ids = (actualizadas ?? []).map((o) => o.id);
  await actualizarNombreEnSheets(ids, limpio);

  for (const id of ids) revalidatePath(`/ordenes/${id}`);
  revalidatePath("/");
  return null;
}

// Cambia la fecha prometida de entrega de esta maleta, o de todas las
// maletas del mismo recibo si el cliente las recoge juntas.
export async function actualizarFechaPrometida(
  ordenId: string,
  fecha: string,
  aplicarATodas: boolean,
): Promise<AccionResultado> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha))) {
    return { error: "Elige una fecha válida." };
  }

  const supabase = await createClient();
  const { data: orden } = await supabase
    .from("ordenes")
    .select("numero_recibo, fecha_recibido")
    .eq("id", ordenId)
    .single();
  if (!orden) return { error: "No se encontró la orden." };

  if (fecha < fechaColombia(new Date(orden.fecha_recibido))) {
    return {
      error: "La fecha prometida no puede ser anterior a la fecha de recepción.",
    };
  }
  if (fecha > fechaColombia(new Date(Date.now() + 2 * 365 * 864e5))) {
    return { error: "La fecha está demasiado lejos." };
  }

  const consulta = supabase.from("ordenes").update({ fecha_prometida: fecha });
  const { data: actualizadas, error } = await (aplicarATodas
    ? consulta.eq("numero_recibo", orden.numero_recibo)
    : consulta.eq("id", ordenId)
  ).select("id");

  if (error) return { error: error.message };

  const ids = (actualizadas ?? []).map((o) => o.id);
  await actualizarFechaPrometidaEnSheets(ids, fecha);

  for (const id of ids) revalidatePath(`/ordenes/${id}`);
  revalidatePath("/");
  return null;
}

export async function actualizarTelefonoOrden(
  ordenId: string,
  telefono: string,
): Promise<AccionResultado> {
  const limpio = telefono.trim();
  if (!limpio) return { error: "Escribe un teléfono." };
  if (!telefonoValido(limpio)) return { error: MENSAJE_TELEFONO_INVALIDO };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ordenes")
    .update({ cliente_telefono: limpio })
    .eq("id", ordenId);

  if (error) return { error: error.message };

  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath("/");
  return null;
}

export async function actualizarTecnicoOrden(
  ordenId: string,
  tecnico: string,
): Promise<AccionResultado> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ordenes")
    .update({ tecnico_asignado: tecnico.trim() || null })
    .eq("id", ordenId);

  if (error) return { error: error.message };

  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath("/");
  return null;
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

  // Si el recibo tiene más maletas, solo se elimina ésta (con su propia
  // factura); las demás y su factura quedan intactas y se vuelve a una
  // de ellas en vez de al inicio.
  const { data: actual } = await supabase
    .from("ordenes")
    .select("numero_recibo")
    .eq("id", ordenId)
    .maybeSingle();
  const { data: otras } = actual
    ? await supabase
        .from("ordenes")
        .select("id")
        .eq("numero_recibo", actual.numero_recibo)
        .neq("id", ordenId)
        .order("created_at", { ascending: true })
    : { data: null };

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

  await marcarOrdenEliminadaEnSheets(ordenId);

  revalidatePath("/");
  const siguiente = otras?.[0]?.id;
  if (siguiente) {
    revalidatePath(`/ordenes/${siguiente}`);
    redirect(`/ordenes/${siguiente}`);
  }
  redirect("/");
}
