import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Nombre de archivo esperado: recibo-<timestamp>.png (ver AccionesRecibo).
// Validamos el formato para no armar URLs de Storage con cualquier
// texto que llegue en el parámetro de la ruta.
const ARCHIVO_VALIDO = /^recibo-\d+\.png$/;

function urlImagen(archivo: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recibos-compartidos/${archivo}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ archivo: string }>;
}): Promise<Metadata> {
  const { archivo } = await params;
  if (!ARCHIVO_VALIDO.test(archivo)) return {};

  return {
    title: "Tu recibo — Reparación de Maletas",
    openGraph: {
      title: "Tu recibo — Reparación de Maletas",
      images: [urlImagen(archivo)],
    },
  };
}

export default async function RecibioCompartidoPage({
  params,
}: {
  params: Promise<{ archivo: string }>;
}) {
  const { archivo } = await params;
  if (!ARCHIVO_VALIDO.test(archivo)) {
    notFound();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-100 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urlImagen(archivo)}
        alt="Recibo"
        className="w-full max-w-sm rounded-lg bg-white shadow-md"
      />
    </div>
  );
}
