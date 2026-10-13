"use client";

import { useState } from "react";
import { registrarNotificacionListaGrupo } from "@/app/ordenes/[id]/actions";

// Link normal a WhatsApp (para que el navegador no lo bloquee) y, en
// paralelo, deja registradas todas las maletas del cliente como
// notificadas; al refrescar la lista el cliente ya no aparece y
// queda arriba el siguiente.
export function NotificarGrupoButton({
  ordenIds,
  href,
  volver,
}: {
  ordenIds: string[];
  href: string;
  volver: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-stretch gap-1">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          void registrarNotificacionListaGrupo(ordenIds).then((res) =>
            setError(res?.error ?? null),
          );
        }}
        className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white active:bg-emerald-700"
      >
        {volver ? "Volver a notificar" : "Notificar"}
      </a>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
