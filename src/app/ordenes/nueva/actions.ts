"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { exportarOrdenASheets } from "@/lib/google-sheets";
import { heredarFacturacionElectronica } from "@/lib/recibo-iva";
import { aplicarCotizacionAOrden } from "@/lib/cotizacion-conversion";
import { capitalizarNombre, capitalizarPrimera } from "@/lib/texto";
import { fechaHoraColombiaAIso } from "@/lib/format";
import {
  MENSAJE_TELEFONO_INVALIDO,
  fechaColombia,
  telefonoValido,
} from "@/lib/estado";
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
  const tecnico_asignado = campoRequerido(formData, "tecnico_asignado") || null;
  const recibido_por = campoRequerido(formData, "recibido_por") || null;
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
    !dano_descripcion
  ) {
    return { error: "Completa todos los campos obligatorios." };
  }

  if (!telefonoValido(cliente_telefono)) {
    return { error: MENSAJE_TELEFONO_INVALIDO };
  }

  // La fecha del formulario ya viene en hora de Colombia; comparamos el
  // día prometido contra el día de recepción.
  const diaRecibido = fecha_recibidoRaw
    ? fecha_recibidoRaw.slice(0, 10)
    : fechaColombia(new Date());
  if (fecha_prometida && fecha_prometida < diaRecibido) {
    return {
      error: "La fecha prometida no puede ser anterior a la fecha en que se recibe la maleta.",
    };
  }

  const fotos = formData
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  const supabase = await createClient();

  // Si viene de una cotización, sus fotos cuentan para las 1 a 3 que
  // exige la orden (se copian a ella al crearla).
  const cotizacionId = campoRequerido(formData, "cotizacion_id") || null;
  let fotosDeCotizacion = 0;
  if (cotizacionId) {
    const { data: cot } = await supabase
      .from("cotizaciones")
      .select("orden_id")
      .eq("id", cotizacionId)
      .maybeSingle();
    if (!cot) return { error: "No se encontró la cotización." };
    if (cot.orden_id) return { error: "Esta cotización ya se convirtió en una orden." };
    const { count } = await supabase
      .from("cotizacion_fotos")
      .select("id", { count: "exact", head: true })
      .eq("cotizacion_id", cotizacionId);
    fotosDeCotizacion = count ?? 0;
  }

  const totalFotos = fotos.length + fotosDeCotizacion;
  if (totalFotos < 1 || totalFotos > 3) {
    return { error: "Sube entre 1 y 3 fotos de la maleta." };
  }

  const fecha_recibido = fecha_recibidoRaw
    ? fechaHoraColombiaAIso(fecha_recibidoRaw)
    : new Date().toISOString();

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
      tecnico_asignado,
      recibido_por,
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
  await heredarFacturacionElectronica(supabase, orden.id);
  if (cotizacionId) await aplicarCotizacionAOrden(supabase, cotizacionId, orden.id);

  let fotosFallidas = 0;

  for (const [index, file] of fotos.entries()) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${orden.id}/${Date.now()}-${index}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("fotos-ordenes")
      .upload(path, file, { contentType: file.type || "image/jpeg" });

    if (uploadError) {
      fotosFallidas++;
      continue;
    }

    const { data: publicUrlData } = supabase.storage
      .from("fotos-ordenes")
      .getPublicUrl(path);

    const { error: fotoError } = await supabase
      .from("fotos")
      .insert({ orden_id: orden.id, url: publicUrlData.publicUrl });

    if (fotoError) fotosFallidas++;
  }

  // La orden ya quedó creada; si alguna foto no subió, se le avisa al
  // llegar a la orden en vez de dejarla sin fotos en silencio.
  redirect(
    fotosFallidas > 0
      ? `/ordenes/${orden.id}?aviso=fotos&n=${fotosFallidas}`
      : `/ordenes/${orden.id}`,
  );
}
