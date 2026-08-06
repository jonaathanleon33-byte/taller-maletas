import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { OrdenCard } from "@/components/OrdenCard";
import { SearchBar } from "@/components/SearchBar";
import { createClient } from "@/lib/supabase/server";
import type { Orden } from "@/types/database";

export const dynamic = "force-dynamic";

async function buscarOrdenes(q: string | undefined) {
  const supabase = await createClient();
  let query = supabase
    .from("ordenes")
    .select("*")
    .order("fecha_recibido", { ascending: false });

  if (q) {
    const term = q.trim();
    query = query.or(
      `numero_recibo.ilike.%${term}%,cliente_nombre.ilike.%${term}%,cliente_telefono.ilike.%${term}%`,
    );
  }

  return query;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const missingEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let ordenes: Orden[] = [];
  let error: string | null = null;

  if (missingEnv) {
    error =
      "Falta configurar las variables de entorno de Supabase (.env.local).";
  } else {
    const { data, error: queryError } = await buscarOrdenes(q);
    if (queryError) {
      error = queryError.message;
    } else {
      ordenes = data ?? [];
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title="Taller de Maletas"
        action={
          <Link
            href="/ordenes/nueva"
            className="flex h-9 items-center gap-1 rounded-full bg-slate-900 px-3 text-sm font-medium text-white active:bg-slate-700"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Nueva
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <div className="mb-4">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>

        {error ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
          </div>
        ) : ordenes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 py-16 text-center text-slate-500">
            <p className="font-medium">
              {q ? "No se encontraron órdenes" : "Todavía no hay órdenes"}
            </p>
            <p className="text-sm">
              {q
                ? "Probá con otro número de recibo, nombre o teléfono."
                : "Creá la primera con el botón “Nueva”."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {ordenes.map((orden) => (
              <li key={orden.id}>
                <OrdenCard orden={orden} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
