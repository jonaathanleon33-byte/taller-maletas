import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { createClient } from "@/lib/supabase/server";
import {
  BODEGAJE,
  destruccionVencida,
  fechaColombia,
  fechaDestruccion,
  plazoVencido,
  telefonoValido,
} from "@/lib/estado";
import { formatFecha } from "@/lib/format";
import { calcularSubtotalItem, calcularTotales, formatMoney } from "@/lib/money";
import type { Comprobante, ComprobanteItem, Orden } from "@/types/database";

export const dynamic = "force-dynamic";

// PostgREST devuelve máximo 1000 filas por consulta; se pide por
// páginas para revisar TODOS los registros, no solo los primeros.
async function traerTodo<T>(
  pagina: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null }>,
): Promise<T[]> {
  const todo: T[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data } = await pagina(desde, desde + 999);
    const filas = data ?? [];
    todo.push(...filas);
    if (filas.length < 1000) break;
  }
  return todo;
}

type Hallazgo = { href: string; titulo: string; detalle: string };

export default async function RevisionPage() {
  const supabase = await createClient();

  const [ordenes, comprobantes, items] = await Promise.all([
    traerTodo<Orden>((d, h) =>
      supabase
        .from("ordenes")
        .select("*")
        .order("created_at", { ascending: true })
        .range(d, h),
    ),
    traerTodo<Comprobante>((d, h) =>
      supabase
        .from("comprobantes")
        .select("*")
        .not("orden_id", "is", null)
        .order("created_at", { ascending: true })
        .range(d, h),
    ),
    traerTodo<ComprobanteItem>((d, h) =>
      supabase
        .from("comprobante_items")
        .select("*")
        .order("created_at", { ascending: true })
        .range(d, h),
    ),
  ]);

  const ordenPorId = new Map(ordenes.map((o) => [o.id, o]));
  const itemsPorComprobante = new Map<string, ComprobanteItem[]>();
  for (const item of items) {
    const lista = itemsPorComprobante.get(item.comprobante_id) ?? [];
    lista.push(item);
    itemsPorComprobante.set(item.comprobante_id, lista);
  }

  const etiqueta = (o: Orden) => `Recibo #${o.numero_recibo} · ${o.cliente_nombre}`;

  const entregadasSinPagar: Hallazgo[] = [];
  const sinItems: Hallazgo[] = [];
  const precioCero: Hallazgo[] = [];
  const abonoMayor: Hallazgo[] = [];
  const sinAtendido: Hallazgo[] = [];
  let deudaTotal = 0;

  for (const c of comprobantes) {
    const orden = c.orden_id ? ordenPorId.get(c.orden_id) : undefined;
    if (!orden) continue;
    const susItems = itemsPorComprobante.get(c.id) ?? [];
    const { total } = calcularTotales(susItems, c.descuento_global, c.impuestos);
    const hrefFactura = `/ordenes/${orden.id}/comprobante`;

    if (susItems.length === 0) {
      sinItems.push({
        href: hrefFactura,
        titulo: etiqueta(orden),
        detalle: "La factura no tiene ningún ítem.",
      });
    }
    for (const item of susItems) {
      if (item.precio_unitario === 0 || calcularSubtotalItem(item) === 0) {
        precioCero.push({
          href: hrefFactura,
          titulo: etiqueta(orden),
          detalle: `"${item.descripcion}" está en $0.`,
        });
      }
    }
    if (c.abono > total && total > 0) {
      abonoMayor.push({
        href: hrefFactura,
        titulo: etiqueta(orden),
        detalle: `Abono ${formatMoney(c.abono)} mayor que el total ${formatMoney(total)}.`,
      });
    }
    if (!c.atendido_por) {
      sinAtendido.push({
        href: hrefFactura,
        titulo: etiqueta(orden),
        detalle: "No se registró quién atendió.",
      });
    }
    if (orden.estado === "entregada" && !c.pagado && total > 0) {
      deudaTotal += total - c.abono;
      entregadasSinPagar.push({
        href: hrefFactura,
        titulo: etiqueta(orden),
        detalle: `Entregada sin marcar pagada · total ${formatMoney(total)}${
          c.abono > 0 ? ` (abono ${formatMoney(c.abono)})` : ""
        }.`,
      });
    }
  }

  const bodegajePendiente: Hallazgo[] = [];
  const paraDestruccion: Hallazgo[] = [];
  for (const o of ordenes) {
    if (!o.segunda_notificacion_en) continue;
    if (destruccionVencida(o)) {
      paraDestruccion.push({
        href: `/ordenes/${o.id}`,
        titulo: etiqueta(o),
        detalle: `Segundo aviso: ${formatFecha(o.segunda_notificacion_en)} · destrucción desde el ${formatFecha(fechaDestruccion(o.segunda_notificacion_en))}.`,
      });
    } else if (plazoVencido(o)) {
      bodegajePendiente.push({
        href: `/ordenes/${o.id}`,
        titulo: etiqueta(o),
        detalle: `Segundo aviso: ${formatFecha(o.segunda_notificacion_en)} · plazo vencido, cobrar bodegaje ${formatMoney(BODEGAJE)}.`,
      });
    }
  }

  const telefonosMalos: Hallazgo[] = [];
  const fechasMalas: Hallazgo[] = [];
  for (const o of ordenes) {
    if (!telefonoValido(o.cliente_telefono)) {
      telefonosMalos.push({
        href: `/ordenes/${o.id}`,
        titulo: etiqueta(o),
        detalle: `Teléfono: "${o.cliente_telefono}".`,
      });
    }
    if (!o.fecha_prometida) {
      fechasMalas.push({
        href: `/ordenes/${o.id}`,
        titulo: etiqueta(o),
        detalle: "No tiene fecha prometida.",
      });
    } else if (o.fecha_prometida < fechaColombia(new Date(o.fecha_recibido))) {
      fechasMalas.push({
        href: `/ordenes/${o.id}`,
        titulo: etiqueta(o),
        detalle: "La fecha prometida es anterior a la fecha de recepción.",
      });
    }
  }

  const secciones: { titulo: string; ayuda: string; lista: Hallazgo[]; extra?: string }[] = [
    {
      titulo: "Entregadas sin pagar",
      ayuda: "La maleta salió del taller pero la factura sigue como pendiente.",
      lista: entregadasSinPagar,
      extra: deudaTotal > 0 ? `Por cobrar: ${formatMoney(deudaTotal)}` : undefined,
    },
    {
      titulo: "Bodegaje por cobrar",
      ayuda: "Pasaron 6 días hábiles desde el segundo aviso y siguen sin recogerse.",
      lista: bodegajePendiente,
    },
    {
      titulo: "Para enviar a destrucción",
      ayuda: "Pasaron 6 meses desde el segundo aviso.",
      lista: paraDestruccion,
    },
    {
      titulo: "Facturas sin ítems",
      ayuda: "Tienen total $0 porque no se agregó ningún servicio.",
      lista: sinItems,
    },
    { titulo: "Ítems con precio $0", ayuda: "Revisa si falta el precio.", lista: precioCero },
    { titulo: "Abono mayor al total", ayuda: "Casi seguro es un error de digitación.", lista: abonoMayor },
    { titulo: "Facturas sin “Atendido por”", ayuda: "Necesario para entregar y cobrar.", lista: sinAtendido },
    { titulo: "Teléfonos inválidos", ayuda: "No abrirán bien en WhatsApp.", lista: telefonosMalos },
    { titulo: "Fechas prometidas dudosas", ayuda: "Faltan o están antes de la recepción.", lista: fechasMalas },
  ];

  const totalProblemas = secciones.reduce((acc, s) => acc + s.lista.length, 0);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Revisión de datos" backHref="/" />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4 pb-10">
        <p
          className={`rounded-lg border p-3 text-center text-sm font-medium ${
            totalProblemas === 0
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          {totalProblemas === 0
            ? "Todo en orden: no hay datos por corregir."
            : `${totalProblemas} ${totalProblemas === 1 ? "cosa por revisar" : "cosas por revisar"} en ${ordenes.length} órdenes.`}
        </p>

        {secciones.map((s) => (
          <section
            key={s.titulo}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {s.titulo}
              </h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  s.lista.length === 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {s.lista.length}
              </span>
            </div>
            <p className="text-xs text-slate-400">{s.ayuda}</p>
            {s.extra ? (
              <p className="mt-1 text-sm font-semibold text-red-700">{s.extra}</p>
            ) : null}
            {s.lista.length > 0 ? (
              <ul className="mt-2 divide-y divide-slate-100">
                {s.lista.map((h, i) => (
                  <li key={`${h.href}-${i}`}>
                    <Link href={h.href} className="block py-2 active:bg-slate-50">
                      <p className="text-sm font-medium text-slate-900">{h.titulo}</p>
                      <p className="text-xs text-slate-500">{h.detalle}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </main>
    </div>
  );
}
