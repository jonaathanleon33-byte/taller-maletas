import Link from "next/link";

export function BotonInicio() {
  return (
    <Link
      href="/"
      aria-label="Ir al inicio"
      className="no-print fixed right-4 bottom-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg active:bg-slate-700"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M4 11.5 12 4l8 7.5M6 9.5V20h5v-5h2v5h5V9.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
