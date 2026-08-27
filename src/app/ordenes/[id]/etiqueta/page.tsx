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

      <div
        id="etiqueta-card"
        className="w-full max-w-[320px] rounded-lg bg-white p-4 shadow-sm print:hidden"
      >
        <EtiquetaImprimible
          id="etiqueta-capture"
          negocioNombre={negocio.nombre}
          orden={orden}
        />
      </div>

      {/* Se llena con una versión en blanco y negro puro (sin grises)
          justo antes de imprimir — ver BotonImprimirEtiqueta — para
          que la impresora térmica no muestre el texto borroso. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        id="etiqueta-print-img"
        alt="Etiqueta"
        className="hidden print:block print:w-[58mm]"
        style={{ imageRendering: "pixelated" }}
      />

      <BotonImprimirEtiqueta />
    </div>
  );
}
