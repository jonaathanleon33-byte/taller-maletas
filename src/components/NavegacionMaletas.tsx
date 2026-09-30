import Link from "next/link";

export function NavegacionMaletas({
  ordenId,
  hermanas,
}: {
  ordenId: string;
  hermanas: { id: string }[];
}) {
  if (hermanas.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
      <span className="shrink-0 text-xs font-medium text-slate-500">
        Maletas de este recibo:
      </span>
      {hermanas.map((hermana, indice) => {
        const activa = hermana.id === ordenId;
        return (
          <Link
            key={hermana.id}
            href={`/ordenes/${hermana.id}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
              activa
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 active:bg-slate-200"
            }`}
          >
            Maleta {indice + 1}
          </Link>
        );
      })}
    </div>
  );
}
