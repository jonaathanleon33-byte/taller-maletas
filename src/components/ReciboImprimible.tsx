import { LogoTaller } from "@/components/LogoTaller";
import { calcularSubtotalItem, calcularTotales, formatMoney } from "@/lib/money";
import { formatFechaHoraRecibo } from "@/lib/format";
import type { Comprobante, ComprobanteItem, NegocioConfig } from "@/types/database";

const METODO_PAGO_LABELS: Record<Comprobante["metodo_pago"], string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
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

export function ReciboImprimible({
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
  const subtotal = totalesPorMaleta.reduce((acc, t) => acc + t.subtotal, 0);
  const total = totalesPorMaleta.reduce((acc, t) => acc + t.total, 0);
  const cantidadProductos = maletas.reduce(
    (acc, m) => acc + m.items.reduce((a, item) => a + item.cantidad, 0),
    0,
  );
  const hayItems = maletas.some((m) => m.items.length > 0);
  const pieLineas = negocio.pie_texto.split("\n").filter(Boolean);

  return (
    <div
      id={id}
      className="mx-auto w-full max-w-[320px] font-mono text-[13px] leading-relaxed text-black print:max-w-[40mm] print:text-[7px] print:leading-snug print:font-bold"
    >
      <div className="flex flex-col items-center text-center">
        {negocio.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={negocio.logo_url}
            alt="Logo"
            crossOrigin="anonymous"
            className="h-14 w-14 object-contain print:h-10 print:w-10"
          />
        ) : (
          <LogoTaller className="h-14 w-14 print:h-10 print:w-10" />
        )}
        <p className="mt-1 text-sm font-bold uppercase tracking-wide">
          {negocio.nombre}
        </p>
        <p>{negocio.nit}</p>
        <p>{negocio.direccion}</p>
        <p>{negocio.telefono}</p>
        <p>{negocio.web}</p>
        {fechaEntrega ? (
          <p className="mt-1">Entrega {fechaEntrega}</p>
        ) : null}
      </div>

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-center font-bold">RECIBO</p>

      <hr className="my-2 border-dashed border-black print:my-1" />

      <div className="flex justify-between">
        <span>Recibo:</span>
        <span>{numeroRecibo}</span>
      </div>
      <div className="flex justify-between">
        <span>Fecha:</span>
        <span>{formatFechaHoraRecibo(fecha)}</span>
      </div>
      {!multiples && principal ? (
        <>
          <div className="flex justify-between">
            <span>Método Pago:</span>
            <span>{METODO_PAGO_LABELS[principal.metodo_pago]}</span>
          </div>
          <div className="flex justify-between">
            <span>Atendido por:</span>
            <span>{principal.atendido_por || "-"}</span>
          </div>
        </>
      ) : null}
      <div className="flex justify-between gap-2">
        <span className="shrink-0">Cliente:</span>
        <span className="text-right">
          {clienteNombre}
          {!multiples && maletas[0]?.info ? ` ${maletas[0].info}` : ""}
        </span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="shrink-0">Teléfono:</span>
        <span className="text-right">{clienteTelefono}</span>
      </div>

      {multiples ? (
        <>
          <hr className="my-2 border-dashed border-black print:my-1" />
          <p className="text-center font-bold">MALETAS</p>
          <hr className="my-2 border-dashed border-black print:my-1" />
          {maletas.map((m, i) => (
            <p key={i}>
              {i + 1}. {m.info ?? "-"}
            </p>
          ))}
        </>
      ) : null}

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-center font-bold">PRODUCTOS</p>

      <hr className="my-2 border-dashed border-black print:my-1" />

      {hayItems ? (
        <div className="flex flex-col gap-3">
          {maletas.map((m, i) =>
            m.items.length > 0 ? (
              <div key={i} className="flex flex-col gap-2">
                {multiples ? (
                  <p className="font-bold">
                    Maleta {i + 1}
                    {m.comprobante?.atendido_por ? ` - ${m.comprobante.atendido_por}` : ""}
                    {m.comprobante
                      ? ` - ${METODO_PAGO_LABELS[m.comprobante.metodo_pago]}`
                      : ""}
                  </p>
                ) : null}
                {m.items.map((item) => (
                  <div key={item.id}>
                    <p>{item.descripcion}</p>
                    <div className="flex justify-between text-xs">
                      <span>
                        {formatMoney(item.precio_unitario)} x{item.cantidad}{" "}
                        {item.descuento_pct > 0 ? `${item.descuento_pct}%` : "0%"}
                      </span>
                      <span>{formatMoney(calcularSubtotalItem(item))}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <p className="text-center text-xs">Sin ítems</p>
      )}

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-center font-bold">RESUMEN TOTALES</p>

      <hr className="my-2 border-dashed border-black print:my-1" />

      <div className="flex justify-between">
        <span>Cantidad Productos:</span>
        <span>{cantidadProductos}</span>
      </div>
      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span>{formatMoney(subtotal)}</span>
      </div>
      <div className="flex justify-between font-bold">
        <span>Total:</span>
        <span>{formatMoney(total)}</span>
      </div>

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-center font-bold">ESTADO DE PAGO</p>

      <hr className="my-2 border-dashed border-black print:my-1" />

      {multiples ? (
        <div className="flex flex-col gap-1">
          {maletas.map((m, i) =>
            m.comprobante ? (
              <div key={i} className="flex justify-between">
                <span>
                  Maleta {i + 1}: {m.comprobante.pagado ? "PAGADO" : "PENDIENTE"}
                </span>
                <span>{formatMoney(totalesPorMaleta[i].total)}</span>
              </div>
            ) : (
              <div key={i} className="flex justify-between text-slate-500">
                <span>Maleta {i + 1}: sin comprobante</span>
              </div>
            ),
          )}
          <div className="mt-1 flex justify-between border-t border-dashed border-black pt-1 font-bold">
            <span>TOTAL</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      ) : (
        <div className="flex justify-between font-bold">
          <span>{principal?.pagado ? "PAGADO" : "PENDIENTE"}</span>
          <span>{formatMoney(total)}</span>
        </div>
      )}

      <p className="mt-4 text-center text-xs">
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
