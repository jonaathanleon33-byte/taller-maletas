"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AccionResultado } from "@/lib/accion";
import type { EstadoDomicilio } from "@/types/database";

export async function cambiarEstadoDomicilio(
  id: string,
  estado: EstadoDomicilio,
): Promise<AccionResultado> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("domicilios")
    .update({ estado })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/domicilios");
  revalidatePath("/");
  return null;
}
