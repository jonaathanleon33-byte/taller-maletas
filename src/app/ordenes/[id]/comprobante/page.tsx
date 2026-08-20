import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CrearComprobanteButton } from "@/components/CrearComprobanteButton";
import { ComprobanteEditor } from "@/components/ComprobanteEditor";
import { createClient } from "@/lib/supabase/server";
import { obtenerTecnicos } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export default async function ComprobantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: orden } = await supabase
    .from("ordenes")
    .select("*")
    .eq("id", id)
    .single();

  if (!orden) {
    notFound();
  }

  const [{ data: comprobante }, { data: servicios }, tecnicos] =
    await Promise.all([
      supabase.from("comprobantes").select("*").eq("orden_id", id).maybeSingle(),
      supabase
        .from("servicios")
        .select("*")
        .eq("activo", true)
        .order("nombre", { ascending: true }),
      obtenerTecnicos(),
    ]);

  const { data: items } = comprobante
    ? await supabase
        .from("comprobante_items")
        .select("*")
        .eq("comprobante_id", comprobante.id)
        .order("created_at", { ascending: true })
    : { data: null };

  const path = `/ordenes/${orden.id}/comprobante`;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title={`Comprobante · #${orden.numero_recibo}`}
        backHref={`/ordenes/${orden.id}`}
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4 pb-10">
        {!comprobante ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-slate-300 py-16 text-center">
            <p className="text-slate-500">
              Esta orden todavía no tiene un comprobante.
            </p>
            <CrearComprobanteButton ordenId={orden.id} />
          </div>
        ) : (
          <>
            <ComprobanteEditor
              path={path}
              comprobante={comprobante}
              items={items ?? []}
              servicios={servicios ?? []}
              tecnicos={tecnicos}
            />
            <Link
              href={`/ordenes/${orden.id}/comprobante/imprimir`}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-center text-base font-semibold text-slate-700 active:bg-slate-50"
            >
              Imprimir comprobante
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
