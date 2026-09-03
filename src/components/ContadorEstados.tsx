import Link from "next/link";

const ITEM_CLASSES = {
  amarillo: "bg-amber-100 text-amber-800",
  verde: "bg-emerald-100 text-emerald-800",
  azul: "bg-blue-100 text-blue-800",
  rojo: "bg-red-100 text-red-800",
} as const;

type FiltroEstado = "recibida" | "lista" | "entregada" | "atrasada";

export function ContadorEstados({
  recibidas,
  listas,
  entregadas,
  atrasadas,
  filtroActivo,
}: {
  recibidas: number;
  listas: number;
  entregadas: number;
  atrasadas: number;
  filtroActivo?: FiltroEstado;
}) {
  const items: {
    label: string;
    count: number;
    color: keyof typeof ITEM_CLASSES;
    filtro: FiltroEstado;
  }[] = [
    { label: "Recibidas", count: recibidas, color: "amarillo", filtro: "recibida" },
    { label: "Listas", count: listas, color: "verde", filtro: "lista" },
    { label: "Entregadas", count: entregadas, color: "azul", filtro: "entregada" },
    { label: "Atrasadas", count: atrasadas, color: "rojo", filtro: "atrasada" },
  ];

  return (
    <div className="mb-4 grid grid-cols-4 gap-2">
      {items.map((item) => {
        const activo = filtroActivo === item.filtro;
        return (
          <Link
            key={item.label}
            href={activo ? "/" : `/?filtro=${item.filtro}`}
            className={`rounded-lg p-2 text-center active:opacity-80 ${ITEM_CLASSES[item.color]} ${
              activo ? "ring-2 ring-offset-1 ring-slate-500" : ""
            }`}
          >
            <p className="text-lg font-bold leading-tight">{item.count}</p>
            <p className="text-[11px] font-medium leading-tight">{item.label}</p>
          </Link>
        );
      })}
    </div>
  );
}
