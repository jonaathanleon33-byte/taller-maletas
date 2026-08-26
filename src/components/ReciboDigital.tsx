import { LogoTaller } from "@/components/LogoTaller";
import { calcularSubtotalItem, calcularTotales, formatMoney } from "@/lib/money";
import { formatFecha } from "@/lib/format";
import type { Comprobante, ComprobanteItem, NegocioConfig } from "@/types/database";

const METODO_PAGO_LABELS: Record<Comprobante["metodo_pago"], string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  pago_al_recoger: "Pago al recoger",
};

type MaletaGrupo = {
  info?: string;
  comprobante: Comprobante | null;
  items: ComprobanteItem[];
};

function totalesDe(items: ComprobanteItem[], comprobante: Comprobante | null) {
  if (!comprobante) return { subtotal: 0, total: 0 };
  return calcularTotales(items, comprobante.descuento_global, comprobante.impuestos);
}

// Versión "bonita" del recibo, pensada solo para la imagen que se
// comparte por WhatsApp (no para imprimir en la impresora térmica) —
// por eso no tiene las restricciones de ancho/letra del papel de 58mm
// que sí tiene ReciboImprimible.
//
// Usamos valores hexadecimales arbitrarios (bg-[#...]) en vez de las
// clases de color de Tailwind (bg-blue-600, etc.): en Tailwind v4 esas
// clases usan la función de color oklch(), que html2canvas no sabe
// interpretar y hace fallar toda la captura en silencio.
export function ReciboDigital({
  id,
  negocio,
  numeroRecibo,
  fecha,
  clienteNombre,
  clienteTelefono,
  maletas,
  fechaEntrega,
}: {
  id?: string;
  negocio: NegocioConfig;
  numeroRecibo: string;
  fecha: string;
  clienteNombre: string;
  clienteTelefono: string;
  maletas: MaletaGrupo[];
  fechaEntrega?: string;
}) {
  const multiples = maletas.length > 1;
  const principal = maletas[0]?.comprobante ?? null;

  const totalesPorMaleta = maletas.map((m) => totalesDe(m.items, m.comprobante));
  const total = totalesPorMaleta.reduce((acc, t) => acc + t.total, 0);
  const abono = maletas.reduce((acc, m) => acc + (m.comprobante?.abono ?? 0), 0);
  const saldoPendiente = total - abono;
  const hayItems = maletas.some((m) => m.items.length > 0);
  const pieLineas = negocio.pie_texto.split("\n").filter(Boolean);
  const pagado = multiples
    ? maletas.every((m) => m.comprobante?.pagado)
    : !!principal?.pagado;

  return (
    <div id={id} className="w-[420px] bg-white p-8 font-sans text-[#0f172a]">
      <div className="flex flex-col items-center text-center">
        {negocio.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={negocio.logo_url}
            alt="Logo"
            crossOrigin="anonymous"
            className="h-16 w-16 object-contain"
          />
        ) : (
          <LogoTaller className="h-16 w-16 text-[#2563eb]" />
        )}
        <p className="mt-3 text-lg font-bold text-[#0f172a]">{negocio.nombre}</p>
        <p className="mt-1 text-xs text-[#64748b]">
          {negocio.nit} · {negocio.direccion}
        </p>
        <p className="text-xs text-[#64748b]">
          {negocio.telefono} · {negocio.web}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl bg-[#eff6ff] px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2563eb]">
            Recibo
          </p>
          <p className="text-2xl font-bold text-[#1d4ed8]">#{numeroRecibo}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2563eb]">
            Fecha
          </p>
          <p className="text-sm font-medium text-[#334155]">
            {formatFecha(fecha)}
          </p>
        </div>
      </div>

      {fechaEntrega ? (
        <div className="mt-3 rounded-xl bg-[#fef3c7] px-4 py-2.5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#92400e]">
            Fecha de entrega
          </p>
          <p className="text-lg font-bold text-[#92400e]">{fechaEntrega}</p>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
            Cliente
          </p>
          <p className="text-sm font-semibold text-[#0f172a]">{clienteNombre}</p>
          <p className="text-sm text-[#64748b]">{clienteTelefono}</p>
        </div>
        {!multiples && principal ? (
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
              Atendido por
            </p>
            <p className="text-sm font-semibold text-[#0f172a]">
              {principal.atendido_por || "-"}
            </p>
            <p className="text-sm text-[#64748b]">
              {METODO_PAGO_LABELS[principal.metodo_pago]}
            </p>
          </div>
        ) : null}
      </div>

      {!multiples && maletas[0]?.info ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
            Maleta
          </p>
          <p className="text-sm font-semibold text-[#0f172a]">{maletas[0].info}</p>
        </div>
      ) : null}

      {multiples ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
            Maletas
          </p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {maletas.map((m, i) => (
              <li key={i} className="text-sm text-[#0f172a]">
                {i + 1}. {m.info ?? "-"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 border-t border-[#f1f5f9] pt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
          Productos
        </p>
        {hayItems ? (
          <div className="flex flex-col gap-3">
            {maletas.map((m, i) =>
              m.items.length > 0 ? (
                <div key={i} className="flex flex-col gap-2">
                  {multiples ? (
                    <p className="text-xs font-semibold text-[#64748b]">
                      Maleta {i + 1}
                      {m.comprobante?.atendido_por
                        ? ` · ${m.comprobante.atendido_por}`
                        : ""}
                      {m.comprobante
                        ? ` · ${METODO_PAGO_LABELS[m.comprobante.metodo_pago]}`
                        : ""}
                    </p>
                  ) : null}
                  {m.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#0f172a]">
                          {item.descripcion}
                        </p>
                        <p className="text-xs text-[#64748b]">
                          {formatMoney(item.precio_unitario)} x{item.cantidad}
                          {item.descuento_pct > 0
                            ? ` · ${item.descuento_pct}% dto.`
                            : ""}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[#0f172a]">
                        {formatMoney(calcularSubtotalItem(item))}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null,
            )}
          </div>
        ) : (
          <p className="text-sm text-[#94a3b8]">Sin ítems</p>
        )}
      </div>

      <div className="mt-6 rounded-xl bg-[#f8fafc] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
              Total
            </p>
            <p className="text-xl font-bold text-[#0f172a]">{formatMoney(total)}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              pagado ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#fef3c7] text-[#92400e]"
            }`}
          >
            {pagado ? "Pagado" : "Pendiente"}
          </span>
        </div>
        {abono > 0 ? (
          <div className="mt-3 flex items-center justify-between border-t border-[#e2e8f0] pt-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                Abono
              </p>
              <p className="text-sm font-semibold text-[#0f172a]">
                -{formatMoney(abono)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                Saldo pendiente
              </p>
              <p className="text-base font-bold text-[#92400e]">
                {formatMoney(saldoPendiente)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-6 text-left text-[11px] leading-relaxed text-[#94a3b8]">
        {pieLineas.map((linea, i) => (
          <span key={i}>
            {linea}
            {i < pieLineas.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    </div>
  );
}
