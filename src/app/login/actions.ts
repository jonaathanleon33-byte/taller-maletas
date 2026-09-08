"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, claveValida, tokenEsperado } from "@/lib/auth";

export type IniciarSesionState = { error: string } | null;

export async function iniciarSesion(
  next: string,
  _prevState: IniciarSesionState,
  formData: FormData,
): Promise<IniciarSesionState> {
  const clave = String(formData.get("clave") ?? "");

  if (!claveValida(clave)) {
    return { error: "Clave incorrecta." };
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, tokenEsperado(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });

  redirect(next || "/");
}
