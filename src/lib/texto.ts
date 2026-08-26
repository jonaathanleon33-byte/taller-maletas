// Pone en mayúscula solo la primera letra del texto, sin tocar el
// resto (a diferencia de un CSS text-transform, esto cambia el dato
// que se guarda, así se ve igual en recibos, Sheets, etc.).
export function capitalizarPrimera(texto: string): string {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
