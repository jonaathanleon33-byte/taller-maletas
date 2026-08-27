import Link from "next/link";
import { notFound } from "next/navigation";
import { AccionesRecibo } from "@/components/AccionesRecibo";
import { ReciboImprimible } from "@/components/ReciboImprimible";
import { createClient } from "@/lib/supabase/server";
import { obtenerNegocioConfig } from "@/lib/negocio";
import { calcularTotales, formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ImprimirVentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: comprobante } = await supabase
    .from("comprobantes")
    .select("*")
    .eq("id", id)
    .is("orden_id", null)
    .maybeSingle();

  if (!comprobante) {
    notFound();
  }

  const { data: items } = await supabase
    .from("comprobante_items")
    .select("*")
    .eq("comprobante_id", id)
    .order("created_at", { ascending: true });

  const negocio = await obtenerNegocioConfig();

  const { total } = calcularTotales(
    items ?? [],
    comprobante.descuento_global,
    comprobante.impuestos,
  );
  const numeroRecibo = `V-${String(comprobante.numero_venta).padStart(6, "0")}`;
  const nombre = (comprobante.cliente_nombre ?? "").split(" ")[0];
  const mensaje = `Hola ${nombre}, aquí tienes tu recibo ${numeroRecibo}. Total: ${formatMoney(total)}.`;

  return (
    <div className="flex flex-1 flex-col items-center gap-4 bg-slate-100 px-4 py-6 print:bg-white print:py-0">
      {/* Esta factura se imprime en la impresora de 80mm — distinta de
          la del sticker, que se queda en 58mm (ver @page global en
          globals.css). Se sobreescribe solo para esta página. */}
      <style>{"@page { size: 80mm auto; margin: 0; }"}</style>

      <div className="no-print flex w-full max-w-[320px] items-center justify-between">
        <Link href={`/ventas/${id}`} className="text-sm text-slate-600">
          ← Volver
        </Link>
      </div>

      <div
        id="recibo-card"
        className="w-full max-w-[320px] rounded-lg bg-white p-4 shadow-sm print:max-w-none print:w-[80mm] print:rounded-none print:p-1 print:shadow-none print:hidden"
      >
        <ReciboImprimible
          id="recibo-capture"
          negocio={negocio}
          numeroRecibo={numeroRecibo}
          fecha={comprobante.created_at}
          clienteNombre={comprobante.cliente_nombre ?? ""}
          clienteTelefono={comprobante.cliente_telefono ?? ""}
          maletas={[{ comprobante, items: items ?? [] }]}
        />
      </div>

      {/* Se llena con una versión en blanco y negro puro (sin grises)
          justo antes de imprimir — ver AccionesRecibo. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        id="recibo-print-img"
        alt="Recibo"
        className="hidden print:block print:w-[72mm]"
        style={{ imageRendering: "pixelated" }}
      />

      <AccionesRecibo
        targetId="recibo-capture"
        telefono={comprobante.cliente_telefono ?? ""}
        mensaje={mensaje}
      />
    </div>
  );
}
