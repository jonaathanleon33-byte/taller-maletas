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

export function ReciboImprimible({
  negocio,
  numeroRecibo,
  comprobante,
  items,
  clienteNombre,
  clienteTelefono,
  maletaInfo,
  fechaEntrega,
}: {
  negocio: NegocioConfig;
  numeroRecibo: string;
  comprobante: Comprobante;
  items: ComprobanteItem[];
  clienteNombre: string;
  clienteTelefono: string;
  maletaInfo?: string;
  fechaEntrega?: string;
}) {
  const { subtotal, total } = calcularTotales(
    items,
    comprobante.descuento_global,
    comprobante.impuestos,
  );
  const cantidadProductos = items.reduce((acc, item) => acc + item.cantidad, 0);
  const pieLineas = negocio.pie_texto.split("\n").filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-[320px] font-mono text-[13px] leading-relaxed text-black print:max-w-[54mm] print:text-[9px] print:leading-snug">
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
          <p className="mt-1">
            Entrega {fechaEntrega} ( &nbsp; )
          </p>
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
        <span>{formatFechaHoraRecibo(comprobante.created_at)}</span>
      </div>
      <div className="flex justify-between">
        <span>Método Pago:</span>
        <span>{METODO_PAGO_LABELS[comprobante.metodo_pago]}</span>
      </div>
      <div className="flex justify-between">
        <span>Atendido por:</span>
        <span>{comprobante.atendido_por || "—"}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="shrink-0">Cliente:</span>
        <span className="text-right">
          {clienteNombre}
          {maletaInfo ? ` ${maletaInfo}` : ""}
        </span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="shrink-0">Teléfono:</span>
        <span className="text-right">{clienteTelefono}</span>
      </div>

      <hr className="my-2 border-dashed border-black print:my-1" />

      <p className="text-center font-bold">PRODUCTOS</p>

      <hr className="my-2 border-dashed border-black print:my-1" />

      {items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
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

      <div className="flex justify-between font-bold">
        <span>{comprobante.pagado ? "PAGADO" : "PENDIENTE"}</span>
        <span>{formatMoney(total)}</span>
      </div>

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
