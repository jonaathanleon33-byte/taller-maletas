const formatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatMoney(value: number) {
  return formatter.format(value);
}

export function calcularSubtotalItem(item: {
  precio_unitario: number;
  cantidad: number;
  descuento_pct: number;
}) {
  const bruto = item.precio_unitario * item.cantidad;
  return bruto - bruto * (item.descuento_pct / 100);
}

export const TASA_IVA = 0.19;

// Con facturación electrónica se suma el IVA (19 %) sobre el subtotal
// menos el descuento global; sin ella el total queda como siempre.
export function calcularTotales(
  items: { precio_unitario: number; cantidad: number; descuento_pct: number }[],
  descuentoGlobal: number,
  impuestos: number,
  facturacionElectronica = false,
) {
  const subtotal = items.reduce((acc, item) => acc + calcularSubtotalItem(item), 0);
  const base = subtotal - descuentoGlobal;
  const iva = facturacionElectronica ? Math.round(Math.max(base, 0) * TASA_IVA) : 0;
  const total = base + impuestos + iva;
  return { subtotal, iva, total };
}
