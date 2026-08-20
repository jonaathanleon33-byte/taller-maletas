import { createClient } from "@/lib/supabase/server";

export type Cliente = { nombre: string; telefono: string };

export async function obtenerClientesConocidos(): Promise<Cliente[]> {
  const supabase = await createClient();

  const [{ data: ordenes }, { data: comprobantes }] = await Promise.all([
    supabase.from("ordenes").select("cliente_nombre, cliente_telefono"),
    supabase
      .from("comprobantes")
      .select("cliente_nombre, cliente_telefono")
      .not("cliente_nombre", "is", null),
  ]);

  const vistos = new Map<string, Cliente>();
  for (const row of [...(ordenes ?? []), ...(comprobantes ?? [])]) {
    if (!row.cliente_nombre || !row.cliente_telefono) continue;
    if (!vistos.has(row.cliente_telefono)) {
      vistos.set(row.cliente_telefono, {
        nombre: row.cliente_nombre,
        telefono: row.cliente_telefono,
      });
    }
  }

  return Array.from(vistos.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre),
  );
}
