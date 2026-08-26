"use client";

import { useState, useTransition } from "react";
import { actualizarPrecioItem } from "@/lib/comprobante-actions";
import { EliminarItemButton } from "@/components/EliminarItemButton";
import { calcularSubtotalItem, formatMoney } from "@/lib/money";
import type { ComprobanteItem } from "@/types/database";

export function ItemRow({
  path,
  item,
}: {
  path: string;
  item: ComprobanteItem;
}) {
  const [editando, setEditando] = useState(false);
  const [precio, setPrecio] = useState(String(item.precio_unitario));
  const [pending, startTransition] = useTransition();

  function cancelar() {
    setPrecio(String(item.precio_unitario));
    setEditando(false);
  }

  function guardar() {
    const valor = Number(precio);
    if (Number.isNaN(valor) || valor < 0) return;
    startTransition(async () => {
      await actualizarPrecioItem(path, item.id, valor);
      setEditando(false);
    });
  }

  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {item.descripcion}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span>{item.cantidad} ×</span>
          {editando ? (
            <input
              type="number"
              inputMode="numeric"
              min="0"
              autoFocus
              disabled={pending}
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  guardar();
                } else if (e.key === "Escape") {
                  cancelar();
                }
              }}
              className="w-24 rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
            />
          ) : (
            <span>{formatMoney(item.precio_unitario)}</span>
          )}
          {item.descuento_pct > 0 ? (
            <span>· -{item.descuento_pct}%</span>
          ) : null}
          {editando ? (
            <>
              <button
                type="button"
                onClick={guardar}
                disabled={pending}
                className="font-medium text-emerald-600 active:text-emerald-800 disabled:opacity-60"
              >
                {pending ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={cancelar}
                disabled={pending}
                className="text-slate-400 active:text-slate-600"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditando(true)}
              aria-label="Editar precio"
              className="text-slate-400 active:text-slate-700"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                <path
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-medium text-slate-900">
          {formatMoney(calcularSubtotalItem(item))}
        </span>
        <EliminarItemButton path={path} itemId={item.id} />
      </div>
    </li>
  );
}
