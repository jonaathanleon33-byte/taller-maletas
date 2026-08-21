"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CrearServicioState = { error: string } | null;

export async function crearServicio(
  _prevState: CrearServicioState,
  formData: FormData,
): Promise<CrearServicioState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const precioRaw = String(formData.get("precio") ?? "").trim();
  const precio = Number(precioRaw);

  if (!nombre) {
    return { error: "Ingresa un nombre para el servicio." };
  }
  if (!precioRaw || Number.isNaN(precio) || precio < 0) {
    return { error: "Ingresa un precio válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("servicios").insert({
    nombre,
    precio,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/servicios");
  return null;
}

export async function toggleServicioActivo(servicioId: string, activo: boolean) {
  const supabase = await createClient();
  await supabase.from("servicios").update({ activo }).eq("id", servicioId);
  revalidatePath("/servicios");
}
