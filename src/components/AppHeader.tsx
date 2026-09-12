import Link from "next/link";
import type { ReactNode } from "react";
import { BackButton } from "@/components/BackButton";

export function AppHeader({
  title,
  titleIcon,
  backHref,
  backToHistory,
  action,
}: {
  title: string;
  titleIcon?: ReactNode;
  backHref?: string;
  // Cuando la pantalla se puede abrir con distintos filtros/búsqueda
  // activos (como el listado principal), un backHref fijo perdía ese
  // contexto. Con esto, "Volver" usa el historial real del navegador
  // en vez de siempre mandar a backHref; backHref queda como destino
  // de respaldo si no hay a dónde volver (p. ej. se abrió el link
  // directo, sin navegar antes dentro de la app).
  backToHistory?: boolean;
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      {backToHistory && backHref ? (
        <BackButton fallbackHref={backHref} />
      ) : backHref ? (
        <Link
          href={backHref}
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
        </Link>
      ) : null}
      {titleIcon}
      <h1 className="flex-1 truncate text-base font-semibold text-slate-900 sm:text-lg">
        {title}
      </h1>
      {action}
    </header>
  );
}
