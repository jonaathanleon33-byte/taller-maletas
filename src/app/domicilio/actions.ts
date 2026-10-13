"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TIPOS_DOMICILIO, validarDomicilio } from "@/lib/domicilios";
import { capitalizarNombre, capitalizarPrimera } from "@/lib/texto";
import type { TipoDomicilio } from "@/types/database";

export type CrearDomicilioState = { error: string } | { ok: true } | null;

function campo(formData: FormData, nombre: string) {
  return String(formData.get(nombre) ?? "").trim();
}

// `interno` = lo registra el taller (pantalla protegida); si no, viene
// del formulario público que se le envía al cliente por WhatsApp.
export async function crearDomicilio(
  interno: boolean,
  _prevState: CrearDomicilioState,
  formData: FormData,
): Promise<CrearDomicilioState> {
  // Campo trampa para bots: una persona nunca lo ve ni lo llena.
  if (!interno && campo(formData, "sitio_web")) return { ok: true };

  const datos = {
    cliente_nombre: capitalizarNombre(campo(formData, "cliente_nombre")),
    cliente_telefono: campo(formData, "cliente_telefono"),
    direccion: campo(formData, "direccion"),
    barrio: campo(formData, "barrio"),
    tipo: campo(formData, "tipo"),
    fecha: campo(formData, "fecha"),
    hora: campo(formData, "hora"),
    numero_recibo: campo(formData, "numero_recibo").replace(/^#/, ""),
    notas: campo(formData, "notas"),
  };

  if (!interno && formData.get("en_bogota") !== "on") {
    return { error: "Confirma que la dirección está en Bogotá." };
  }

  const error = validarDomicilio(datos);
  if (error) return { error };

  const supabase = await createClient();

  if (!interno) {
    // Freno sencillo contra abuso: pocas solicitudes por teléfono al
    // día y un tope general por hora.
    const digitos = datos.cliente_telefono.replace(/\D/g, "");
    const hace24h = new Date(Date.now() - 24 * 3600e3).toISOString();
    const haceUnaHora = new Date(Date.now() - 3600e3).toISOString();
    const [{ count: porTelefono }, { count: porHora }] = await Promise.all([
      supabase
        .from("domicilios")
        .select("id", { count: "exact", head: true })
        .eq("cliente_telefono", datos.cliente_telefono)
        .gte("created_at", hace24h),
      supabase
        .from("domicilios")
        .select("id", { count: "exact", head: true })
        .eq("origen", "formulario")
        .gte("created_at", haceUnaHora),
    ]);
    if ((porTelefono ?? 0) >= 3 || (porHora ?? 0) >= 60 || !digitos) {
      return {
        error:
          "Ya recibimos varias solicitudes de este número. Escríbenos por WhatsApp y te ayudamos.",
      };
    }
  }

  const { error: insertError } = await supabase.from("domicilios").insert({
    cliente_nombre: datos.cliente_nombre,
    cliente_telefono: datos.cliente_telefono,
    direccion: capitalizarPrimera(datos.direccion),
    barrio: datos.barrio ? capitalizarPrimera(datos.barrio) : null,
    tipo: datos.tipo as TipoDomicilio,
    costo: TIPOS_DOMICILIO[datos.tipo as TipoDomicilio].costo,
    fecha: datos.fecha,
    hora: datos.hora,
    numero_recibo: datos.numero_recibo || null,
    notas: datos.notas ? capitalizarPrimera(datos.notas) : null,
    estado: interno ? "confirmado" : "nuevo",
    origen: interno ? "manual" : "formulario",
  });

  if (insertError) {
    return {
      error: interno
        ? insertError.message
        : "No pudimos registrar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.",
    };
  }

  revalidatePath("/domicilios");
  revalidatePath("/");

  if (interno) redirect("/domicilios");
  return { ok: true };
}
