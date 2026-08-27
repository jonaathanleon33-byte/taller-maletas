// Las impresoras térmicas son de 1 bit (solo negro o blanco): el
// texto renderizado por el navegador tiene bordes grises
// (antialiasing) que la impresora convierte en un patrón punteado
// borroso. Para evitarlo, capturamos el elemento como imagen y
// convertimos cada píxel a negro puro o blanco puro (sin grises)
// antes de imprimir esa imagen en vez del texto en vivo.
export async function generarImagenNitida(
  el: HTMLElement,
  scale = 4,
): Promise<string | null> {
  const html2canvas = (await import("html2canvas-pro")).default;
  const canvas = await html2canvas(el, {
    backgroundColor: "#ffffff",
    scale,
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const datos = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixeles = datos.data;
  for (let i = 0; i < pixeles.length; i += 4) {
    const luminancia =
      0.299 * pixeles[i] + 0.587 * pixeles[i + 1] + 0.114 * pixeles[i + 2];
    const valor = luminancia < 190 ? 0 : 255;
    pixeles[i] = valor;
    pixeles[i + 1] = valor;
    pixeles[i + 2] = valor;
    pixeles[i + 3] = 255;
  }
  ctx.putImageData(datos, 0, 0);

  return canvas.toDataURL("image/png");
}

// Captura `captureId`, la convierte en imagen nítida, la mete en el
// <img> `imgId` y espera a que cargue. Si algo falla, muestra
// `cardId` (el texto en vivo) como respaldo para no imprimir en
// blanco, avisando al usuario. Devuelve true si la imagen quedó lista.
export async function prepararImagenParaImprimir({
  captureId,
  imgId,
  cardId,
}: {
  captureId: string;
  imgId: string;
  cardId: string;
}): Promise<boolean> {
  let listo = false;

  try {
    const el = document.getElementById(captureId);
    const img = document.getElementById(imgId) as HTMLImageElement | null;

    if (el && img) {
      const dataUrl = await Promise.race([
        generarImagenNitida(el),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000)),
      ]);
      if (dataUrl) {
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = dataUrl;
        });
        listo = true;
      }
    }
  } catch (err) {
    console.error("No se pudo generar la imagen nítida para imprimir:", err);
  }

  if (!listo) {
    alert(
      "No se pudo generar la versión nítida para imprimir. Se va a imprimir con el texto normal (puede verse borroso). Probá de nuevo.",
    );
    document.getElementById(cardId)?.classList.remove("print:hidden");
  }

  return listo;
}
