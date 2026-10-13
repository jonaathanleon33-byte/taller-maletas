import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, claveActivada, tokenEsperado } from "@/lib/auth";

export function proxy(request: NextRequest) {
  // Sin SITE_PASSWORD definida no se pide nada (ver lib/auth.ts).
  if (!claveActivada()) return NextResponse.next();

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;

  if (cookie === tokenEsperado()) {
    return NextResponse.next();
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Corre en todo menos:
     * - /login (para no crear un loop de redirects)
     * - /domicilio: formulario público que se le envía al cliente.
     * - /r/* : el recibo público que reciben los clientes por WhatsApp,
     *   nunca debe pedir la clave del taller.
     * - archivos estáticos, íconos y manifest de la app instalable.
     */
    "/((?!login|r/|domicilio$|domicilio/|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-|apple-icon).*)",
  ],
};
