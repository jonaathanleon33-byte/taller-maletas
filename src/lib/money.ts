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

export function calcularTotales(
  items: { precio_unitario: number; cantidad: number; descuento_pct: number }[],
  descuentoGlobal: number,
  impuestos: number,
) {
  const subtotal = items.reduce((acc, item) => acc + calcularSubtotalItem(item), 0);
  const total = subtotal - descuentoGlobal + impuestos;
  return { subtotal, total };
}
