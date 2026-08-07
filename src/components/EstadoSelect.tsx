"use client";

import { useEffect, useRef, useState } from "react";
import { ESTADO_LABELS, estadoDotClass } from "@/lib/estado";
import type { Estado } from "@/types/database";

export function EstadoSelect({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: Estado;
  options: Estado[];
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-slate-500 focus:outline-none"
      >
        <span className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${estadoDotClass(value)}`} />
          {ESTADO_LABELS[value]}
        </span>
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-slate-400">
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((estado) => (
            <li key={estado}>
              <button
                type="button"
                onClick={() => {
                  setValue(estado);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-base text-slate-900 active:bg-slate-100"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${estadoDotClass(estado)}`} />
                {ESTADO_LABELS[estado]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
