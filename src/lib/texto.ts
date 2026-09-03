// Pone en mayúscula solo la primera letra del texto, sin tocar el
// resto (a diferencia de un CSS text-transform, esto cambia el dato
// que se guarda, así se ve igual en recibos, Sheets, etc.).
export function capitalizarPrimera(texto: string): string {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Igual que capitalizarPrimera, pero para cada palabra (separada por
// espacios) — para nombres de clientes con varias palabras.
export function capitalizarNombre(texto: string): string {
  if (!texto) return texto;
  return texto
    .split(" ")
    .map((palabra) => (palabra ? palabra.charAt(0).toUpperCase() + palabra.slice(1) : palabra))
    .join(" ");
}
