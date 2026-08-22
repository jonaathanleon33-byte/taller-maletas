import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { LogoTaller } from "@/components/LogoTaller";
import { OrdenCard } from "@/components/OrdenCard";
import { OrdenCardGrupo } from "@/components/OrdenCardGrupo";
import { SearchBar } from "@/components/SearchBar";
import { createClient } from "@/lib/supabase/server";
import { obtenerNegocioConfig } from "@/lib/negocio";
import type { Orden } from "@/types/database";

function agruparPorRecibo(ordenes: Orden[]) {
  const grupos = new Map<string, Orden[]>();
  for (const orden of ordenes) {
    const grupo = grupos.get(orden.numero_recibo);
    if (grupo) {
      grupo.push(orden);
    } else {
      grupos.set(orden.numero_recibo, [orden]);
    }
  }
  return Array.from(grupos.values());
}

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
  const negocio = await obtenerNegocioConfig();

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
    <div className="flex flex-1 flex-col bg-slate-50">
      <AppHeader
        title="Taller de Maletas"
        titleIcon={
          negocio.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={negocio.logo_url}
              alt=""
              className="h-8 w-8 shrink-0 rounded object-contain"
            />
          ) : (
            <LogoTaller className="h-7 w-7 shrink-0 text-blue-700" />
          )
        }
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/ajustes/recibo"
              className="flex h-9 items-center justify-center rounded-full border border-slate-300 px-3 text-sm font-medium text-slate-700 active:bg-slate-100"
            >
              Recibo
            </Link>
            <Link
              href="/servicios"
              className="flex h-9 items-center justify-center rounded-full border border-slate-300 px-3 text-sm font-medium text-slate-700 active:bg-slate-100"
            >
              Precios
            </Link>
          </div>
        }
      />

      {negocio.fondo_home_url ? (
        <div className="w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={negocio.fondo_home_url}
            alt=""
            className="h-36 w-full object-cover sm:h-44"
          />
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <Link
            href="/ordenes/nueva"
            className="flex h-11 items-center justify-center gap-1 rounded-lg bg-blue-700 text-sm font-medium text-white active:bg-blue-800"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Orden nueva
          </Link>
          <Link
            href="/ventas/nueva"
            className="flex h-11 items-center justify-center gap-1 rounded-lg border border-blue-700 bg-white text-sm font-medium text-blue-700 active:bg-blue-50"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Venta directa
          </Link>
        </div>

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
                : "Crea la primera con el botón “Nueva”."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {agruparPorRecibo(ordenes).map((grupo) => (
              <li key={grupo[0].id}>
                {grupo.length > 1 ? (
                  <OrdenCardGrupo ordenes={grupo} />
                ) : (
                  <OrdenCard orden={grupo[0]} />
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
