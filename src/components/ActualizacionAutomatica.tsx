"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Cuando hay varias personas usando el sistema a la vez, la lista se
// pone al día sola cada minuto (solo si la pestaña está a la vista).
export function ActualizacionAutomatica({ segundos = 60 }: { segundos?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, segundos * 1000);
    return () => clearInterval(id);
  }, [router, segundos]);

  return null;
}
