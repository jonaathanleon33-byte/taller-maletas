import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, tokenEsperado } from "@/lib/auth";

export function proxy(request: NextRequest) {
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
     * - /r/* : el recibo público que reciben los clientes por WhatsApp,
     *   nunca debe pedir la clave del taller.
     * - archivos estáticos e imágenes de Next.
     */
    "/((?!login|r/|_next/static|_next/image|favicon.ico).*)",
  ],
};
