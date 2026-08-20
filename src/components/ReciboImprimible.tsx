import { LogoTaller } from "@/components/LogoTaller";
import { NEGOCIO } from "@/lib/negocio";
import { calcularSubtotalItem, calcularTotales, formatMoney } from "@/lib/money";
import { formatFechaHora } from "@/lib/format";
import type { Comprobante, ComprobanteItem } from "@/types/database";

const METODO_PAGO_LABELS: Record<Comprobante["metodo_pago"], string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
};

export function ReciboImprimible({
  numeroRecibo,
  comprobante,
  items,
  clienteNombre,
  clienteTelefono,
  maletaInfo,
}: {
  numeroRecibo: string;
  comprobante: Comprobante;
  items: ComprobanteItem[];
  clienteNombre: string;
  clienteTelefono: string;
  maletaInfo?: string;
}) {
  const { subtotal, total } = calcularTotales(
    items,
    comprobante.descuento_global,
    comprobante.impuestos,
  );
  const cantidadProductos = items.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <div className="mx-auto w-full max-w-[320px] font-mono text-[13px] leading-relaxed text-black">
      <div className="flex flex-col items-center text-center">
        <LogoTaller className="h-14 w-14" />
        <p className="mt-1 text-sm font-bold uppercase tracking-wide">
          {NEGOCIO.nombre}
        </p>
        <p>{NEGOCIO.nit}</p>
        <p>{NEGOCIO.direccion}</p>
        <p>{NEGOCIO.telefono}</p>
        <p>{NEGOCIO.web}</p>
      </div>

      <hr className="my-2 border-dashed border-black" />

      <p className="text-center font-bold">RECIBO</p>

      <hr className="my-2 border-dashed border-black" />

      <div className="flex justify-between">
        <span>Recibo:</span>
        <span>{numeroRecibo}</span>
      </div>
      <div className="flex justify-between">
        <span>Fecha:</span>
        <span>{formatFechaHora(comprobante.created_at)}</span>
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
        <span className="text-right">{clienteNombre}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="shrink-0">Teléfono:</span>
        <span className="text-right">{clienteTelefono}</span>
      </div>
      {maletaInfo ? (
        <div className="flex justify-between gap-2">
          <span className="shrink-0">Maleta:</span>
          <span className="text-right">{maletaInfo}</span>
        </div>
      ) : null}

      <hr className="my-2 border-dashed border-black" />

      <p className="text-center font-bold">PRODUCTOS</p>

      <hr className="my-2 border-dashed border-black" />

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

      <hr className="my-2 border-dashed border-black" />

      <p className="text-center font-bold">RESUMEN TOTALES</p>

      <hr className="my-2 border-dashed border-black" />

      <div className="flex justify-between">
        <span>Cantidad Productos:</span>
        <span>{cantidadProductos}</span>
      </div>
      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span>{formatMoney(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>Dto. Global:</span>
        <span>{formatMoney(comprobante.descuento_global)}</span>
      </div>
      <div className="flex justify-between">
        <span>Impuestos:</span>
        <span>{formatMoney(comprobante.impuestos)}</span>
      </div>
      <div className="flex justify-between font-bold">
        <span>Total:</span>
        <span>{formatMoney(total)}</span>
      </div>

      <hr className="my-2 border-dashed border-black" />

      <p className="text-center font-bold">ESTADO DE PAGO</p>

      <hr className="my-2 border-dashed border-black" />

      <div className="flex justify-between font-bold">
        <span>{comprobante.pagado ? "PAGADO" : "PENDIENTE"}</span>
        <span>{formatMoney(total)}</span>
      </div>

      <p className="mt-4 text-center text-xs">
        Gracias por confiar en nosotros
        <br />
        Retiro máx. 30 días posfecha de entrega. Luego, abandono y no nos
        hacemos responsables.
        <br />
        Para la entrega presente este recibo. Gracias.
      </p>
    </div>
  );
}
