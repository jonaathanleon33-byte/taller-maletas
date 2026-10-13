"use client";

import { registrarNotificacionLista } from "@/app/ordenes/[id]/actions";

// Sigue siendo un link normal (target=_blank) para que el navegador no
// bloquee la ventana de WhatsApp; el registro de "ya se avisó" se
// dispara en paralelo al hacer clic.
export function NotificarWhatsappButton({
  ordenId,
  href,
  registrar,
  volver,
}: {
  ordenId: string;
  href: string;
  registrar: boolean;
  volver: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (registrar) void registrarNotificacionLista(ordenId);
      }}
      className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-center text-base font-semibold text-white active:bg-emerald-700"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.62-.6-2.84-1.23-4.7-4.1-4.84-4.29-.14-.19-1.16-1.54-1.16-2.94s.73-2.09.99-2.38c.26-.28.56-.35.75-.35.19 0 .38 0 .54.01.17.01.4-.07.63.48.24.57.81 1.98.88 2.12.07.14.12.31.02.5-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.28.36-.23.6-.14.24.09 1.53.72 1.79.85.26.13.43.19.5.3.07.11.07.63-.17 1.31z" />
      </svg>
      {volver ? "Volver a notificar por WhatsApp" : "Notificar por WhatsApp"}
    </a>
  );
}
