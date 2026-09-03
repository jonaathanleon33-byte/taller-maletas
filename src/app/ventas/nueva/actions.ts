"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { capitalizarNombre } from "@/lib/texto";

export type CrearVentaState = { error: string } | null;

export async function crearVenta(
  _prevState: CrearVentaState,
  formData: FormData,
): Promise<CrearVentaState> {
  const cliente_nombre = capitalizarNombre(
    String(formData.get("cliente_nombre") ?? "").trim(),
  );
  const cliente_telefono = String(formData.get("cliente_telefono") ?? "").trim();

  if (!cliente_nombre) {
    return { error: "Ingresa el nombre del cliente." };
  }
  if (!cliente_telefono) {
    return { error: "Ingresa el teléfono del cliente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comprobantes")
    .insert({ cliente_nombre, cliente_telefono })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo crear la venta." };
  }

  redirect(`/ventas/${data.id}`);
}
