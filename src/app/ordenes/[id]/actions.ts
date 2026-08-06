"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Estado } from "@/types/database";

export type CambiarEstadoState = { error: string } | null;

export async function cambiarEstado(
  ordenId: string,
  _prevState: CambiarEstadoState,
  formData: FormData,
): Promise<CambiarEstadoState> {
  const estado = String(formData.get("estado") ?? "") as Estado;

  if (!estado) {
    return { error: "Elegí un estado." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ordenes")
    .update({ estado })
    .eq("id", ordenId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath("/");
  return null;
}
