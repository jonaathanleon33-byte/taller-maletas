"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActualizarNegocioState = { error: string } | { success: true } | null;

function campoRequerido(formData: FormData, campo: string) {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor;
}

function pathDeUrl(url: string, bucket: string) {
  return url.split(`/${bucket}/`)[1] ?? null;
}

export async function actualizarNegocio(
  _prevState: ActualizarNegocioState,
  formData: FormData,
): Promise<ActualizarNegocioState> {
  const nombre = campoRequerido(formData, "nombre");
  const nit = campoRequerido(formData, "nit");
  const direccion = campoRequerido(formData, "direccion");
  const telefono = campoRequerido(formData, "telefono");
  const web = campoRequerido(formData, "web");
  const pie_texto = campoRequerido(formData, "pie_texto");
  const quitarLogo = formData.get("quitar_logo") === "on";
  const quitarFondo = formData.get("quitar_fondo") === "on";
  const logo = formData.get("logo");
  const fondo = formData.get("fondo_home");

  if (!nombre || !direccion || !telefono || !pie_texto) {
    return { error: "Completa al menos nombre, dirección, teléfono y pie de página." };
  }

  const supabase = await createClient();

  const { data: actual } = await supabase
    .from("negocio_config")
    .select("logo_url, fondo_home_url")
    .eq("id", 1)
    .maybeSingle();

  const update: {
    nombre: string;
    nit: string;
    direccion: string;
    telefono: string;
    web: string;
    pie_texto: string;
    logo_url?: string | null;
    fondo_home_url?: string | null;
  } = { nombre, nit, direccion, telefono, web, pie_texto };

  if (logo instanceof File && logo.size > 0) {
    const ext = logo.name.split(".").pop()?.toLowerCase() || "png";
    const path = `logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("logo-negocio")
      .upload(path, logo, { contentType: logo.type || "image/png" });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("logo-negocio")
      .getPublicUrl(path);

    update.logo_url = publicUrlData.publicUrl;
  } else if (quitarLogo) {
    update.logo_url = null;
  }

  if (fondo instanceof File && fondo.size > 0) {
    const ext = fondo.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `fondo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("fondo-home")
      .upload(path, fondo, { contentType: fondo.type || "image/jpeg" });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("fondo-home")
      .getPublicUrl(path);

    update.fondo_home_url = publicUrlData.publicUrl;
  } else if (quitarFondo) {
    update.fondo_home_url = null;
  }

  const { error } = await supabase
    .from("negocio_config")
    .update(update)
    .eq("id", 1);

  if (error) {
    return { error: error.message };
  }

  if (update.logo_url !== undefined && actual?.logo_url) {
    const pathAnterior = pathDeUrl(actual.logo_url, "logo-negocio");
    if (pathAnterior) {
      await supabase.storage.from("logo-negocio").remove([pathAnterior]);
    }
  }

  if (update.fondo_home_url !== undefined && actual?.fondo_home_url) {
    const pathAnterior = pathDeUrl(actual.fondo_home_url, "fondo-home");
    if (pathAnterior) {
      await supabase.storage.from("fondo-home").remove([pathAnterior]);
    }
  }

  revalidatePath("/ajustes/recibo");
  revalidatePath("/");
  return { success: true };
}
