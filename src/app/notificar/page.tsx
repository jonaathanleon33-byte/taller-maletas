import { AppHeader } from "@/components/AppHeader";
import { NotificarGrupoButton } from "@/components/NotificarGrupoButton";
import { createClient } from "@/lib/supabase/server";
import {
  corteRenotificar,
  debeRenotificar,
  diasDesdeNotificacion,
  linkWhatsapp,
  mensajeListaGrupo,
} from "@/lib/estado";
import type { Orden } from "@/types/database";

export const dynamic = "force-dynamic";

type Grupo = { clave: string; ordenes: Orden[] };

export default async function NotificarPage() {
  const supabase = await createClient();

  // Maletas listas que nunca se avisaron, o que se avisaron hace 3 días
  // hábiles o más (lunes a sábado) y siguen sin recogerse.
  const { data } = await supabase
    .from("ordenes")
    .select("*")
    .eq("estado", "lista")
    .or(`notificada_lista_en.is.null,notificada_lista_en.lt.${corteRenotificar()}`)
    .order("notificada_lista_en", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .limit(1000);

  const ordenes = (data ?? []) as Orden[];

  const grupos = new Map<string, Grupo>();
  for (const orden of ordenes) {
    const clave = orden.cliente_telefono.replace(/\D/g, "") || orden.id;
    const grupo = grupos.get(clave) ?? { clave, ordenes: [] };
    grupo.ordenes.push(orden);
    grupos.set(clave, grupo);
  }
  const lista = Array.from(grupos.values());

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Por notificar" backHref="/" />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 px-4 py-4 pb-10">
        <p className="text-sm text-slate-500">
          {lista.length === 0
            ? "No hay clientes por notificar."
            : `${lista.length} ${lista.length === 1 ? "cliente" : "clientes"} con maletas listas por avisar. Al tocar “Notificar” se abre WhatsApp y el cliente sale de esta lista.`}
        </p>

        {lista.map((grupo) => {
          const primera = grupo.ordenes[0];
          const volver = grupo.ordenes.some((o) => debeRenotificar(o));
          const dias = Math.max(
            ...grupo.ordenes.map((o) => diasDesdeNotificacion(o) ?? 0),
          );
          const href = linkWhatsapp(
            primera.cliente_telefono,
            mensajeListaGrupo(grupo.ordenes),
          );
          return (
            <div
              key={grupo.clave}
              className={`rounded-lg border bg-white p-4 shadow-sm ${
                volver ? "border-amber-300" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {primera.cliente_nombre}
                  </p>
                  <p className="text-sm text-slate-500">
                    {primera.cliente_telefono}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      volver ? "font-semibold text-amber-700" : "text-slate-400"
                    }`}
                  >
                    {volver
                      ? `Avisada hace ${dias} ${dias === 1 ? "día" : "días"} (lunes a sábado)`
                      : "Nunca se ha notificado"}
                  </p>
                </div>
                <NotificarGrupoButton
                  ordenIds={grupo.ordenes.map((o) => o.id)}
                  href={href}
                  volver={volver}
                />
              </div>
              <ul className="mt-3 border-t border-slate-100 pt-2 text-sm text-slate-600">
                {grupo.ordenes.map((o) => (
                  <li key={o.id} className="py-0.5">
                    <span className="font-semibold text-slate-800">
                      #{o.numero_recibo}
                    </span>{" "}
                    {o.marca} {o.color}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </main>
    </div>
  );
}
