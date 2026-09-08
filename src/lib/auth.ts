import { createHash } from "crypto";

export const AUTH_COOKIE = "taller_auth";

// El valor de la cookie es un hash de la clave, no la clave en texto
// plano — así no queda expuesta en el navegador ni se puede reusar
// para adivinar la contraseña real.
export function tokenEsperado() {
  const clave = process.env.SITE_PASSWORD ?? "";
  return createHash("sha256").update(clave).digest("hex");
}

export function claveValida(intento: string) {
  return Boolean(process.env.SITE_PASSWORD) && intento === process.env.SITE_PASSWORD;
}
