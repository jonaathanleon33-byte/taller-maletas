import type { Cotizacion, CotizacionItem, EstadoCotizacion } from "@/types/database";
import { fechaColombia } from "@/lib/estado";
import { formatFecha } from "@/lib/format";
import { calcularSubtotalItem, calcularTotales, formatMoney } from "@/lib/money";

// Numeración propia, aparte del consecutivo de recibos y de ventas.
export function numeroCotizacion(numero: number) {
  return `COT-${String(numero).padStart(4, "0")}`;
}

export const ESTADOS_COTIZACION: Record<
  EstadoCotizacion | "vencida",
  { label: string; badge: string }
> = {
  pendiente: { label: "Pendiente", badge: "bg-amber-100 text-amber-800" },
  aprobada: { label: "Aprobada", badge: "bg-emerald-100 text-emerald-800" },
  rechazada: { label: "Rechazada", badge: "bg-red-100 text-red-800" },
  vencida: { label: "Vencida", badge: "bg-slate-200 text-slate-700" },
};

// Una cotización pendiente cuya vigencia ya pasó se muestra "vencida".
export function estadoVisible(
  c: Pick<Cotizacion, "estado" | "vigencia_hasta">,
  ahora = new Date(),
): EstadoCotizacion | "vencida" {
  if (
    c.estado === "pendiente" &&
    c.vigencia_hasta &&
    c.vigencia_hasta < fechaColombia(ahora)
  ) {
    return "vencida";
  }
  return c.estado;
}

export function totalCotizacion(
  c: Pick<Cotizacion, "descuento_global" | "incluye_iva">,
  items: CotizacionItem[],
) {
  return calcularTotales(items, c.descuento_global, 0, c.incluye_iva);
}

export function mensajeCotizacion(c: Cotizacion, items: CotizacionItem[]) {
  const nombre = c.cliente_nombre.split(" ")[0] || "";
  const { total } = totalCotizacion(c, items);
  const lineas = items
    .map(
      (i) =>
        `• ${i.descripcion}${i.cantidad > 1 ? ` x${i.cantidad}` : ""}: ${formatMoney(calcularSubtotalItem(i))}`,
    )
    .join("\n");
  return [
    `Hola ${nombre}, te enviamos la cotización ${numeroCotizacion(c.numero)} para la reparación de tu maleta (${c.descripcion}):`,
    lineas,
    `Total: ${formatMoney(total)}${c.incluye_iva ? " (IVA incluido)" : ""}.`,
    c.vigencia_hasta ? `Válida hasta el ${formatFecha(c.vigencia_hasta)}.` : "",
    "Si estás de acuerdo, responde este mensaje y agendamos la recepción de tu maleta.",
  ]
    .filter(Boolean)
    .join("\n");
}
