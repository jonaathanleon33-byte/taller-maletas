import type { createClient } from "@/lib/supabase/server";
import { actualizarPrecioEnSheets } from "@/lib/google-sheets";
import { calcularTotales } from "@/lib/money";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Pasa a una orden recién creada lo que ya estaba en la cotización: los
// ítems y el descuento (a la factura de la orden), el IVA si lo tenía
// y las fotos del cliente. Luego deja la cotización aprobada y enlazada.
export async function aplicarCotizacionAOrden(
  supabase: Supabase,
  cotizacionId: string,
  ordenId: string,
) {
  const [{ data: cotizacion }, { data: items }, { data: fotos }, { data: comprobante }] =
    await Promise.all([
      supabase.from("cotizaciones").select("*").eq("id", cotizacionId).maybeSingle(),
      supabase.from("cotizacion_items").select("*").eq("cotizacion_id", cotizacionId).order("created_at", { ascending: true }),
      supabase.from("cotizacion_fotos").select("*").eq("cotizacion_id", cotizacionId).order("created_at", { ascending: true }),
      supabase.from("comprobantes").select("id, facturacion_electronica").eq("orden_id", ordenId).maybeSingle(),
    ]);
  if (!cotizacion) return { fotosCopiadas: 0 };

  if (comprobante) {
    const lista = items ?? [];
    if (lista.length > 0) {
      await supabase.from("comprobante_items").insert(
        lista.map((i) => ({
          comprobante_id: comprobante.id,
          servicio_id: i.servicio_id,
          descripcion: i.descripcion,
          precio_unitario: i.precio_unitario,
          cantidad: i.cantidad,
          descuento_pct: i.descuento_pct,
        })),
      );
    }
    const facturacionElectronica = comprobante.facturacion_electronica || cotizacion.incluye_iva;
    await supabase
      .from("comprobantes")
      .update({
        descuento_global: cotizacion.descuento_global,
        facturacion_electronica: facturacionElectronica,
      })
      .eq("id", comprobante.id);

    const { total } = calcularTotales(lista, cotizacion.descuento_global, 0, facturacionElectronica);
    await actualizarPrecioEnSheets(ordenId, total);
  }

  // Las fotos se copian a la carpeta de la orden para que borrar una no
  // afecte a la otra; si la copia falla se reutiliza la misma dirección.
  let fotosCopiadas = 0;
  for (const [i, foto] of (fotos ?? []).entries()) {
    const origen = foto.url.split("/fotos-ordenes/")[1];
    let url = foto.url;
    if (origen) {
      const ext = origen.split(".").pop() || "jpg";
      const destino = `${ordenId}/cotizacion-${Date.now()}-${i}.${ext}`;
      const { error } = await supabase.storage.from("fotos-ordenes").copy(origen, destino);
      if (!error) {
        url = supabase.storage.from("fotos-ordenes").getPublicUrl(destino).data.publicUrl;
      }
    }
    const { error } = await supabase.from("fotos").insert({ orden_id: ordenId, url });
    if (!error) fotosCopiadas++;
  }

  await supabase
    .from("cotizaciones")
    .update({ orden_id: ordenId, estado: "aprobada" })
    .eq("id", cotizacionId);

  return { fotosCopiadas };
}
