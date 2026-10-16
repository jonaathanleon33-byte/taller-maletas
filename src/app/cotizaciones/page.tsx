import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { createClient } from "@/lib/supabase/server";
import {
  ESTADOS_COTIZACION,
  estadoVisible,
  numeroCotizacion,
  totalCotizacion,
} from "@/lib/cotizaciones";
import { formatFecha, formatFechaHora } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { Cotizacion, CotizacionItem } from "@/types/database";

export const dynamic = "force-dynamic";

const LIMITE = 100;

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("cotizaciones")
    .select("*")
    .order("numero", { ascending: false })
    .limit(LIMITE);

  const termino = q?.trim();
  if (termino) {
    const numero = termino.replace(/^cot-?/i, "");
    if (/^\d{1,6}$/.test(numero)) {
      query = query.eq("numero", Number(numero));
    } else {
      const seguro = termino.replace(/[,()%]/g, " ");
      query = query.or(`cliente_nombre.ilike.%${seguro}%,cliente_telefono.ilike.%${seguro}%`);
    }
  }

  const { data, error } = await query;
  const cotizaciones = (data ?? []) as Cotizacion[];

  const itemsPor = new Map<string, CotizacionItem[]>();
  if (cotizaciones.length > 0) {
    const { data: items } = await supabase
      .from("cotizacion_items")
      .select("*")
      .in("cotizacion_id", cotizaciones.map((c) => c.id));
    for (const item of items ?? []) {
      const lista = itemsPor.get(item.cotizacion_id) ?? [];
      lista.push(item);
      itemsPor.set(item.cotizacion_id, lista);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title="Cotizaciones"
        backHref="/"
        action={
          <Link
            href="/cotizaciones/nueva"
            className="flex h-9 items-center justify-center rounded-full bg-slate-900 px-3 text-sm font-semibold text-white active:bg-slate-700"
          >
            + Nueva
          </Link>
        }
      />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 px-4 py-4 pb-10">
        <form action="/cotizaciones" className="flex gap-2">
          <input
            name="q"
            defaultValue={termino ?? ""}
            placeholder="Buscar por número, cliente o teléfono"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white active:bg-slate-700">
            Buscar
          </button>
        </form>

        {error ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            No se pudieron cargar las cotizaciones: {error.message}
          </div>
        ) : cotizaciones.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-slate-500">
            <p className="font-medium">
              {termino ? "Sin resultados" : "Todavía no hay cotizaciones"}
            </p>
          </div>
        ) : (
          cotizaciones.map((c) => {
            const estado = ESTADOS_COTIZACION[estadoVisible(c)];
            const { total } = totalCotizacion(c, itemsPor.get(c.id) ?? []);
            return (
              <Link
                key={c.id}
                href={`/cotizaciones/${c.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{c.cliente_nombre}</p>
                    <p className="text-sm text-slate-500">{c.cliente_telefono}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-bold text-slate-800">{numeroCotizacion(c.numero)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.badge}`}>{estado.label}</span>
                  </div>
                </div>
                <p className="mt-2 truncate text-sm text-slate-600">{c.descripcion}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {formatFechaHora(c.created_at)}
                    {c.vigencia_hasta ? ` · válida hasta ${formatFecha(c.vigencia_hasta)}` : ""}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{formatMoney(total)}</span>
                </div>
              </Link>
            );
          })
        )}
      </main>
    </div>
  );
}
