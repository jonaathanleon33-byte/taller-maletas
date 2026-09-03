const ITEM_CLASSES = {
  amarillo: "bg-amber-100 text-amber-800",
  verde: "bg-emerald-100 text-emerald-800",
  azul: "bg-blue-100 text-blue-800",
  rojo: "bg-red-100 text-red-800",
} as const;

export function ContadorEstados({
  recibidas,
  listas,
  entregadas,
  atrasadas,
}: {
  recibidas: number;
  listas: number;
  entregadas: number;
  atrasadas: number;
}) {
  const items: { label: string; count: number; color: keyof typeof ITEM_CLASSES }[] = [
    { label: "Recibidas", count: recibidas, color: "amarillo" },
    { label: "Listas", count: listas, color: "verde" },
    { label: "Entregadas", count: entregadas, color: "azul" },
    { label: "Atrasadas", count: atrasadas, color: "rojo" },
  ];

  return (
    <div className="mb-4 grid grid-cols-4 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-lg p-2 text-center ${ITEM_CLASSES[item.color]}`}
        >
          <p className="text-lg font-bold leading-tight">{item.count}</p>
          <p className="text-[11px] font-medium leading-tight">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
