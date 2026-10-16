import Link from "next/link";

const pill =
  "flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 active:bg-slate-100";

// Accesos de la pantalla principal. En pantallas anchas van en el
// encabezado; en el celular van en una fila aparte (con desplazamiento
// si no caben) para no apretar el título.
export function MenuSuperior({
  claveActiva,
  className,
}: {
  claveActiva: boolean;
  className: string;
}) {
  return (
    <nav className={className} aria-label="Accesos">
      <Link href="/cotizaciones" className={pill}>
        Cotización
      </Link>
      <Link href="/ajustes/recibo" className={pill}>
        Recibo
      </Link>
      <Link href="/servicios" className={pill}>
        Precios
      </Link>
      <Link href="/revision" className={pill}>
        Revisión
      </Link>
      {claveActiva ? (
        <Link
          href="/logout"
          aria-label="Cerrar sesión"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 active:bg-slate-100"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      ) : null}
    </nav>
  );
}
