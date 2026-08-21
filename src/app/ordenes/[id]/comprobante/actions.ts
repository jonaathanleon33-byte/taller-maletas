"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearComprobante(ordenId: string) {
  const supabase = await createClient();
  await supabase.from("comprobantes").insert({ orden_id: ordenId });
  revalidatePath(`/ordenes/${ordenId}/comprobante`);
  redirect(`/ordenes/${ordenId}/comprobante`);
}
