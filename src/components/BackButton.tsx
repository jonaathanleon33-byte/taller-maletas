"use client";

import { useRouter } from "next/navigation";

// A diferencia de un Link con href fijo, este vuelve a la pantalla
// real de la que se vino (con la búsqueda o el filtro que tenía
// puesto), en vez de mandar siempre al inicio limpio.
export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        // document.referrer no sirve acá: en una SPA no se actualiza
        // con cada navegación por Link, solo con la carga inicial de
        // la pestaña. history.length > 1 alcanza para el caso real
        // (se abrió la app y se navegó adentro); si entraron con un
        // link directo (pestaña nueva, sin nada antes), cae al
        // fallback en vez de salir de la app.
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 active:bg-slate-100"
      aria-label="Volver"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
