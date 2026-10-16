"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MENSAJE_TELEFONO_INVALIDO, telefonoValido } from "@/lib/estado";
import { capitalizarNombre, capitalizarPrimera } from "@/lib/texto";
import type { AccionResultado } from "@/lib/accion";
import type { AgregarItemState } from "@/lib/comprobante-actions";
import type { EstadoCotizacion } from "@/types/database";

export type CotizacionFormState = { error: string } | null;

function campo(formData: FormData, nombre: string) {
  return String(formData.get(nombre) ?? "").trim();
}

function validarDatos(formData: FormData) {
  const datos = {
    cliente_nombre: capitalizarNombre(campo(formData, "cliente_nombre")),
    cliente_telefono: campo(formData, "cliente_telefono"),
    descripcion: capitalizarPrimera(campo(formData, "descripcion")),
    notas: capitalizarPrimera(campo(formData, "notas")),
    vigencia_hasta: campo(formData, "vigencia_hasta"),
  };
  if (!datos.cliente_nombre || !datos.cliente_telefono || !datos.descripcion) {
    return { error: "Completa el nombre, el teléfono y la descripción de la maleta." };
  }
  if (!telefonoValido(datos.cliente_telefono)) {
    return { error: MENSAJE_TELEFONO_INVALIDO };
  }
  if (datos.cliente_nombre.length > 100 || datos.descripcion.length > 300 || datos.notas.length > 500) {
    return { error: "Alguno de los textos es demasiado largo." };
  }
  if (datos.vigencia_hasta && !/^\d{4}-\d{2}-\d{2}$/.test(datos.vigencia_hasta)) {
    return { error: "La fecha de vigencia no es válida." };
  }
  return { datos };
}

export async function crearCotizacion(
  _prevState: CotizacionFormState,
  formData: FormData,
): Promise<CotizacionFormState> {
  const r = validarDatos(formData);
  if ("error" in r) return { error: r.error as string };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cotizaciones")
    .insert({
      cliente_nombre: r.datos.cliente_nombre,
      cliente_telefono: r.datos.cliente_telefono,
      descripcion: r.datos.descripcion,
      notas: r.datos.notas || null,
      vigencia_hasta: r.datos.vigencia_hasta || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo crear la cotización." };
  }

  revalidatePath("/cotizaciones");
  redirect(`/cotizaciones/${data.id}`);
}

export async function actualizarCotizacion(
  id: string,
  _prevState: CotizacionFormState,
  formData: FormData,
): Promise<CotizacionFormState> {
  const r = validarDatos(formData);
  if ("error" in r) return { error: r.error as string };

  const descuento = Number(formData.get("descuento_global") || 0);
  if (Number.isNaN(descuento) || descuento < 0) {
    return { error: "El descuento no es válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cotizaciones")
    .update({
      cliente_nombre: r.datos.cliente_nombre,
      cliente_telefono: r.datos.cliente_telefono,
      descripcion: r.datos.descripcion,
      notas: r.datos.notas || null,
      vigencia_hasta: r.datos.vigencia_hasta || null,
      descuento_global: descuento,
      incluye_iva: formData.get("incluye_iva") === "on",
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/cotizaciones/${id}`);
  revalidatePath("/cotizaciones");
  return null;
}

export async function cambiarEstadoCotizacion(
  id: string,
  estado: EstadoCotizacion,
): Promise<AccionResultado> {
  const supabase = await createClient();
  const { error } = await supabase.from("cotizaciones").update({ estado }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/cotizaciones/${id}`);
  revalidatePath("/cotizaciones");
  return null;
}

export async function agregarItemCotizacion(
  cotizacionId: string,
  _prevState: AgregarItemState,
  formData: FormData,
): Promise<AgregarItemState> {
  const servicioId = campo(formData, "servicio_id") || null;
  const descripcion = capitalizarPrimera(campo(formData, "descripcion"));
  const precio = Number(formData.get("precio_unitario"));
  const cantidad = Number(formData.get("cantidad") || 1);
  const descuento = Number(formData.get("descuento_pct") || 0);

  if (!descripcion) return { error: "Ingresa una descripción para el ítem." };
  if (Number.isNaN(precio) || precio < 0) return { error: "El precio no es válido." };
  if (Number.isNaN(cantidad) || cantidad < 1) return { error: "La cantidad no es válida." };
  if (Number.isNaN(descuento) || descuento < 0 || descuento > 100) {
    return { error: "El descuento debe ser entre 0 y 100." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cotizacion_items").insert({
    cotizacion_id: cotizacionId,
    servicio_id: servicioId,
    descripcion,
    precio_unitario: precio,
    cantidad,
    descuento_pct: descuento,
  });
  if (error) return { error: error.message };

  revalidatePath(`/cotizaciones/${cotizacionId}`);
  return null;
}

export async function actualizarPrecioItemCotizacion(
  cotizacionId: string,
  itemId: string,
  precio: number,
): Promise<AccionResultado> {
  if (Number.isNaN(precio) || precio < 0) return { error: "El precio no es válido." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("cotizacion_items")
    .update({ precio_unitario: precio })
    .eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath(`/cotizaciones/${cotizacionId}`);
  return null;
}

export async function eliminarItemCotizacion(
  cotizacionId: string,
  itemId: string,
): Promise<AccionResultado> {
  const supabase = await createClient();
  const { error } = await supabase.from("cotizacion_items").delete().eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath(`/cotizaciones/${cotizacionId}`);
  return null;
}

export async function eliminarCotizacion(id: string): Promise<AccionResultado> {
  const supabase = await createClient();
  const { error } = await supabase.from("cotizaciones").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cotizaciones");
  redirect("/cotizaciones");
}
