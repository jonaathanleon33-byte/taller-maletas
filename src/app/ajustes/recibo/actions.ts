"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActualizarNegocioState = { error: string } | { success: true } | null;

function campoRequerido(formData: FormData, campo: string) {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor;
}

function pathDeLogoUrl(url: string) {
  return url.split("/logo-negocio/")[1] ?? null;
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
  const logo = formData.get("logo");

  if (!nombre || !direccion || !telefono || !pie_texto) {
    return { error: "Completá al menos nombre, dirección, teléfono y pie de página." };
  }

  const supabase = await createClient();

  const { data: actual } = await supabase
    .from("negocio_config")
    .select("logo_url")
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

  const { error } = await supabase
    .from("negocio_config")
    .update(update)
    .eq("id", 1);

  if (error) {
    return { error: error.message };
  }

  if (update.logo_url !== undefined && actual?.logo_url) {
    const pathAnterior = pathDeLogoUrl(actual.logo_url);
    if (pathAnterior) {
      await supabase.storage.from("logo-negocio").remove([pathAnterior]);
    }
  }

  revalidatePath("/ajustes/recibo");
  return { success: true };
}
