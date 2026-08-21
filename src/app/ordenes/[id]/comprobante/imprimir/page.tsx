import Link from "next/link";
import { notFound } from "next/navigation";
import { AccionesRecibo } from "@/components/AccionesRecibo";
import { ReciboImprimible } from "@/components/ReciboImprimible";
import { createClient } from "@/lib/supabase/server";
import { obtenerNegocioConfig } from "@/lib/negocio";
import { TAMANO_LABELS, TIPO_LABELS } from "@/lib/estado";
import { formatFecha } from "@/lib/format";
import { calcularTotales, formatMoney } from "@/lib/money";
import type { Comprobante, ComprobanteItem } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ImprimirComprobantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: orden } = await supabase
    .from("ordenes")
    .select("*")
    .eq("id", id)
    .single();

  if (!orden) {
    notFound();
  }

  const { data: comprobante } = await supabase
    .from("comprobantes")
    .select("*")
    .eq("orden_id", id)
    .maybeSingle();

  if (!comprobante) {
    notFound();
  }

  const { data: hermanas } = await supabase
    .from("ordenes")
    .select("*")
    .eq("numero_recibo", orden.numero_recibo)
    .order("created_at", { ascending: true });

  const ordenesDelRecibo = hermanas ?? [orden];

  const maletas = await Promise.all(
    ordenesDelRecibo.map(async (o) => {
      const { data: comp } = await supabase
        .from("comprobantes")
        .select("*")
        .eq("orden_id", o.id)
        .maybeSingle();

      let items: ComprobanteItem[] = [];
      if (comp) {
        const { data } = await supabase
          .from("comprobante_items")
          .select("*")
          .eq("comprobante_id", comp.id)
          .order("created_at", { ascending: true });
        items = data ?? [];
      }

      return {
        info: `${o.marca} ${o.color} · ${TAMANO_LABELS[o.tamano]} · ${TIPO_LABELS[o.tipo]}`,
        comprobante: comp as Comprobante | null,
        items,
      };
    }),
  );

  const negocio = await obtenerNegocioConfig();

  const total = maletas.reduce((acc, m) => {
    if (!m.comprobante) return acc;
    return (
      acc +
      calcularTotales(m.items, m.comprobante.descuento_global, m.comprobante.impuestos)
        .total
    );
  }, 0);
  const nombre = orden.cliente_nombre.split(" ")[0];
  const mensaje = `Hola ${nombre}, aquí tienes tu recibo #${orden.numero_recibo}. Total: ${formatMoney(total)}.`;

  return (
    <div className="flex flex-1 flex-col items-center gap-4 bg-slate-100 px-4 py-6 print:bg-white print:py-0">
      <div className="no-print flex w-full max-w-[320px] items-center justify-between">
        <Link href={`/ordenes/${orden.id}/comprobante`} className="text-sm text-slate-600">
          ← Volver
        </Link>
      </div>

      <div className="w-full max-w-[320px] rounded-lg bg-white p-4 shadow-sm print:max-w-none print:w-[58mm] print:rounded-none print:p-1 print:shadow-none">
        <ReciboImprimible
          id="recibo-capture"
          negocio={negocio}
          numeroRecibo={orden.numero_recibo}
          fecha={comprobante.created_at}
          clienteNombre={orden.cliente_nombre}
          clienteTelefono={orden.cliente_telefono}
          maletas={maletas}
          fechaEntrega={orden.fecha_prometida ? formatFecha(orden.fecha_prometida) : undefined}
        />
      </div>

      <AccionesRecibo
        telefono={orden.cliente_telefono}
        mensaje={mensaje}
      />
    </div>
  );
}
