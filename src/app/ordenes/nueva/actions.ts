"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { exportarOrdenASheets } from "@/lib/google-sheets";
import { capitalizarNombre, capitalizarPrimera } from "@/lib/texto";
import type { Estado, Tamano, TipoMaleta } from "@/types/database";

export type CrearOrdenState = { error: string } | null;

function campoRequerido(formData: FormData, nombre: string) {
  return String(formData.get(nombre) ?? "").trim();
}

export async function crearOrden(
  _prevState: CrearOrdenState,
  formData: FormData,
): Promise<CrearOrdenState> {
  const numero_recibo = campoRequerido(formData, "numero_recibo") || null;
  const cliente_nombre = capitalizarNombre(campoRequerido(formData, "cliente_nombre"));
  const cliente_telefono = campoRequerido(formData, "cliente_telefono");
  const marca = capitalizarPrimera(campoRequerido(formData, "marca"));
  const color = capitalizarPrimera(campoRequerido(formData, "color"));
  const tamano = campoRequerido(formData, "tamano") as Tamano;
  const tipo = campoRequerido(formData, "tipo") as TipoMaleta;
  const dano_descripcion = capitalizarPrimera(campoRequerido(formData, "dano_descripcion"));
  const ubicacion = capitalizarPrimera(campoRequerido(formData, "ubicacion"));
  const tecnico_asignado = campoRequerido(formData, "tecnico_asignado") || null;
  const estado = (campoRequerido(formData, "estado") || "recibida") as Estado;
  const fecha_recibidoRaw = campoRequerido(formData, "fecha_recibido");
  const fecha_prometida = campoRequerido(formData, "fecha_prometida") || null;

  if (
    !cliente_nombre ||
    !cliente_telefono ||
    !marca ||
    !color ||
    !tamano ||
    !tipo ||
    !dano_descripcion ||
    !ubicacion
  ) {
    return { error: "Completa todos los campos obligatorios." };
  }

  const fotos = formData
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (fotos.length < 1 || fotos.length > 3) {
    return { error: "Sube entre 1 y 3 fotos de la maleta." };
  }

  const fecha_recibido = fecha_recibidoRaw
    ? new Date(fecha_recibidoRaw).toISOString()
    : new Date().toISOString();

  const supabase = await createClient();

  const { data: orden, error: insertError } = await supabase
    .from("ordenes")
    .insert({
      ...(numero_recibo ? { numero_recibo } : {}),
      cliente_nombre,
      cliente_telefono,
      marca,
      color,
      tamano,
      tipo,
      dano_descripcion,
      ubicacion,
      tecnico_asignado,
      estado,
      fecha_recibido,
      fecha_prometida,
    })
    .select("*")
    .single();

  if (insertError || !orden) {
    return { error: insertError?.message ?? "No se pudo crear la orden." };
  }

  await exportarOrdenASheets(orden);
  await supabase.from("comprobantes").insert({ orden_id: orden.id });

  for (const [index, file] of fotos.entries()) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${orden.id}/${Date.now()}-${index}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("fotos-ordenes")
      .upload(path, file, { contentType: file.type || "image/jpeg" });

    if (uploadError) continue;

    const { data: publicUrlData } = supabase.storage
      .from("fotos-ordenes")
      .getPublicUrl(path);

    await supabase
      .from("fotos")
      .insert({ orden_id: orden.id, url: publicUrlData.publicUrl });
  }

  redirect(`/ordenes/${orden.id}`);
}
