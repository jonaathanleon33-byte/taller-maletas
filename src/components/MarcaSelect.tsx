"use client";

import { useMemo, useRef, useState } from "react";
import { MARCAS, normalizarMarca } from "@/lib/marcas";

// Menú desplegable de marcas con búsqueda: al tocar el campo se ve la
// lista, al escribir se filtra, y si la marca no está se puede usar
// tal como se escribió.
export function MarcaSelect({
  id,
  name,
  className,
  defaultValue = "",
  required = true,
}: {
  id: string;
  name: string;
  className: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [valor, setValor] = useState(defaultValue);
  const [abierto, setAbierto] = useState(false);
  const cierre = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtradas = useMemo(() => {
    const q = normalizarMarca(valor);
    if (!q) return MARCAS;
    const empiezan = MARCAS.filter((m) => normalizarMarca(m).startsWith(q));
    const contienen = MARCAS.filter(
      (m) => !normalizarMarca(m).startsWith(q) && normalizarMarca(m).includes(q),
    );
    return [...empiezan, ...contienen];
  }, [valor]);

  const textoLibre = valor.trim();
  const esExacta = MARCAS.some(
    (m) => normalizarMarca(m) === normalizarMarca(textoLibre),
  );

  function elegir(marca: string) {
    setValor(marca);
    setAbierto(false);
  }

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        placeholder="Elegir…"
        value={valor}
        onChange={(e) => {
          setValor(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => {
          if (cierre.current) clearTimeout(cierre.current);
          setAbierto(true);
        }}
        onBlur={() => {
          // Pequeño retraso para que el toque en una opción alcance a registrarse.
          cierre.current = setTimeout(() => setAbierto(false), 150);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setAbierto(false);
        }}
        className={`${className} pr-9`}
      />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      >
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {abierto ? (
        <ul
          id={`${id}-lista`}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {textoLibre && !esExacta ? (
            <li role="option" aria-selected="false">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(textoLibre)}
                className="w-full px-3 py-2 text-left text-sm font-medium text-blue-700 active:bg-slate-100"
              >
                Usar “{textoLibre}”
              </button>
            </li>
          ) : null}
          {filtradas.map((marca) => (
            <li key={marca} role="option" aria-selected={marca === valor}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(marca)}
                className="w-full px-3 py-2 text-left text-sm text-slate-800 active:bg-slate-100"
              >
                {marca}
              </button>
            </li>
          ))}
          {filtradas.length === 0 && !textoLibre ? (
            <li className="px-3 py-2 text-sm text-slate-400">Sin resultados</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
