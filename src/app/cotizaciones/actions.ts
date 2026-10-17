"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MENSAJE_TELEFONO_INVALIDO,
  TAMANO_LABELS,
  TIPO_LABELS,
  telefonoValido,
} from "@/lib/estado";
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
    marca: capitalizarPrimera(campo(formData, "marca")),
    color: capitalizarPrimera(campo(formData, "color")),
    tamano: campo(formData, "tamano"),
    tipo: campo(formData, "tipo"),
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
  if (datos.tamano && !(datos.tamano in TAMANO_LABELS)) return { error: "El tamaño no es válido." };
  if (datos.tipo && !(datos.tipo in TIPO_LABELS)) return { error: "El tipo no es válido." };
  if (datos.marca.length > 60 || datos.color.length > 60) {
    return { error: "La marca o el color son demasiado largos." };
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
      marca: r.datos.marca || null,
      color: r.datos.color || null,
      tamano: r.datos.tamano || null,
      tipo: r.datos.tipo || null,
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
      marca: r.datos.marca || null,
      color: r.datos.color || null,
      tamano: r.datos.tamano || null,
      tipo: r.datos.tipo || null,
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

const MAX_FOTOS_COTIZACION = 3;

// Fotos que el cliente manda por WhatsApp (se guardan desde la
// galería del teléfono o el computador). Se suben al mismo bucket que
// las fotos de las órdenes.
export async function agregarFotosCotizacion(
  cotizacionId: string,
  formData: FormData,
): Promise<AccionResultado> {
  const archivos = formData
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (archivos.length === 0) return { error: "Elige al menos una foto." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("cotizacion_fotos")
    .select("id", { count: "exact", head: true })
    .eq("cotizacion_id", cotizacionId);

  const espacio = MAX_FOTOS_COTIZACION - (count ?? 0);
  if (espacio <= 0) {
    return { error: `Ya hay ${MAX_FOTOS_COTIZACION} fotos. Quita una para agregar otra.` };
  }

  let fallidas = 0;
  for (const [i, archivo] of archivos.slice(0, espacio).entries()) {
    const ext = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
    const ruta = `cotizaciones/${cotizacionId}/${Date.now()}-${i}.${ext}`;
    const { error: errorSubida } = await supabase.storage
      .from("fotos-ordenes")
      .upload(ruta, archivo, { contentType: archivo.type || "image/jpeg" });
    if (errorSubida) {
      fallidas++;
      continue;
    }
    const { data: publica } = supabase.storage.from("fotos-ordenes").getPublicUrl(ruta);
    const { error: errorFila } = await supabase
      .from("cotizacion_fotos")
      .insert({ cotizacion_id: cotizacionId, url: publica.publicUrl });
    if (errorFila) fallidas++;
  }

  revalidatePath(`/cotizaciones/${cotizacionId}`);
  if (fallidas > 0) {
    return { error: `No se pudieron subir ${fallidas} ${fallidas === 1 ? "foto" : "fotos"}. Inténtalo de nuevo.` };
  }
  return null;
}

export async function eliminarFotoCotizacion(
  cotizacionId: string,
  fotoId: string,
): Promise<AccionResultado> {
  const supabase = await createClient();
  const { data: foto } = await supabase
    .from("cotizacion_fotos")
    .select("url")
    .eq("id", fotoId)
    .maybeSingle();

  const { error } = await supabase.from("cotizacion_fotos").delete().eq("id", fotoId);
  if (error) return { error: error.message };

  // Si la foto ya se copió a una orden, el archivo de la orden es otro;
  // aquí solo se limpia el de la cotización (sin fallar si no se puede).
  const ruta = foto?.url.split("/fotos-ordenes/")[1];
  if (ruta) await supabase.storage.from("fotos-ordenes").remove([ruta]);

  revalidatePath(`/cotizaciones/${cotizacionId}`);
  return null;
}
