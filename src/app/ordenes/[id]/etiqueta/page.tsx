import Link from "next/link";
import { notFound } from "next/navigation";
import { EtiquetaImprimible } from "@/components/EtiquetaImprimible";
import { BotonImprimirEtiqueta } from "@/components/BotonImprimirEtiqueta";
import { createClient } from "@/lib/supabase/server";
import { obtenerNegocioConfig } from "@/lib/negocio";

export const dynamic = "force-dynamic";

export default async function EtiquetaPage({
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

  const negocio = await obtenerNegocioConfig();

  return (
    <div className="flex flex-1 flex-col items-center gap-4 bg-slate-100 px-4 py-6 print:bg-white print:py-0">
      <div className="no-print flex w-full max-w-[320px] items-center justify-between">
        <Link href={`/ordenes/${orden.id}`} className="text-sm text-slate-600">
          ← Volver
        </Link>
      </div>

      <div className="w-full max-w-[320px] rounded-lg bg-white p-4 shadow-sm print:max-w-none print:w-[58mm] print:rounded-none print:p-1 print:shadow-none">
        <EtiquetaImprimible negocioNombre={negocio.nombre} orden={orden} />
      </div>

      <BotonImprimirEtiqueta />
    </div>
  );
}
