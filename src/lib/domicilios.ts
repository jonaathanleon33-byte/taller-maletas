import type { Domicilio, EstadoDomicilio, TipoDomicilio } from "@/types/database";
import { fechaColombia, telefonoValido, MENSAJE_TELEFONO_INVALIDO } from "@/lib/estado";
import { formatFecha } from "@/lib/format";
import { formatMoney } from "@/lib/money";

export const TIPOS_DOMICILIO: Record<
  TipoDomicilio,
  { label: string; resumen: string; detalle: string; costo: number }
> = {
  recogida: {
    label: "Recoger mi maleta",
    resumen: "recogida de tu maleta",
    detalle: "Pasamos por tu maleta o morral a tu dirección",
    costo: 20000,
  },
  entrega: {
    label: "Entregarme mi maleta",
    resumen: "entrega de tu maleta",
    detalle: "Te llevamos tu maleta ya reparada a tu dirección",
    costo: 20000,
  },
  recogida_entrega: {
    label: "Recoger y entregar",
    resumen: "recogida y entrega de tu maleta",
    detalle: "Recogemos tu maleta y te la devolvemos reparada",
    costo: 40000,
  },
  con_desbloqueo: {
    label: "Domicilio con desbloqueo",
    resumen: "domicilio con desbloqueo",
    detalle: "Domicilio con servicio de desbloqueo",
    costo: 60000,
  },
};

export const ESTADOS_DOMICILIO: Record<
  EstadoDomicilio,
  { label: string; badge: string }
> = {
  nuevo: { label: "Nuevo", badge: "bg-blue-100 text-blue-800" },
  confirmado: { label: "Confirmado", badge: "bg-emerald-100 text-emerald-800" },
  en_camino: { label: "En camino", badge: "bg-amber-100 text-amber-800" },
  hecho: { label: "Hecho", badge: "bg-slate-200 text-slate-700" },
  cancelado: { label: "Cancelado", badge: "bg-red-100 text-red-800" },
};

export const ESTADOS_ACTIVOS: EstadoDomicilio[] = ["nuevo", "confirmado", "en_camino"];

export const MUNICIPIOS_SIN_COBERTURA = ["Cajicá", "Chía", "Soacha", "Cota"];

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function mencionaZonaSinCobertura(texto: string) {
  const t = normalizar(texto);
  return MUNICIPIOS_SIN_COBERTURA.some((m) =>
    new RegExp(`\\b${normalizar(m)}\\b`).test(t),
  );
}

// Horario del taller: lunes a viernes 9 a. m. - 6 p. m., sábados
// 9 a. m. - 4 p. m., domingos cerrado. Las horas ofrecidas para el
// domicilio empiezan a la hora en punto y la última es una hora antes
// de cerrar.
export function horasDisponibles(fechaIso: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaIso)) return [];
  const dia = new Date(`${fechaIso}T12:00:00Z`).getUTCDay();
  if (dia === 0) return [];
  const ultima = dia === 6 ? 15 : 17;
  const horas: string[] = [];
  for (let h = 9; h <= ultima; h++) horas.push(`${String(h).padStart(2, "0")}:00`);
  return horas;
}

export function formatHora(hora: string) {
  const [hh, mm] = hora.split(":").map(Number);
  const sufijo = hh >= 12 ? "p. m." : "a. m.";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${sufijo}`;
}

function horaActualColombia(ahora: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(ahora);
}

export type DatosDomicilio = {
  cliente_nombre: string;
  cliente_telefono: string;
  direccion: string;
  barrio: string;
  tipo: string;
  fecha: string;
  hora: string;
  numero_recibo: string;
  notas: string;
};

export function validarDomicilio(
  d: DatosDomicilio,
  ahora = new Date(),
): string | null {
  if (!d.cliente_nombre || !d.cliente_telefono || !d.direccion || !d.fecha || !d.hora) {
    return "Completa todos los campos obligatorios.";
  }
  if (!(d.tipo in TIPOS_DOMICILIO)) return "Elige el tipo de domicilio.";
  if (!telefonoValido(d.cliente_telefono)) return MENSAJE_TELEFONO_INVALIDO;
  if (
    d.cliente_nombre.length > 100 ||
    d.direccion.length > 200 ||
    d.barrio.length > 100 ||
    d.notas.length > 500 ||
    d.numero_recibo.length > 20
  ) {
    return "Alguno de los textos es demasiado largo.";
  }
  if (mencionaZonaSinCobertura(`${d.direccion} ${d.barrio}`)) {
    return "El domicilio es solo para Bogotá. No cubrimos Cajicá, Chía, Soacha ni Cota.";
  }
  const hoy = fechaColombia(ahora);
  if (d.fecha < hoy) return "La fecha ya pasó. Elige hoy o un día próximo.";
  if (d.fecha > fechaColombia(new Date(ahora.getTime() + 60 * 864e5))) {
    return "Elige una fecha dentro de los próximos 60 días.";
  }
  const horas = horasDisponibles(d.fecha);
  if (horas.length === 0) return "No hacemos domicilios los domingos.";
  if (!horas.includes(d.hora)) {
    return "Esa hora está fuera de nuestro horario (lunes a viernes 9 a. m. a 6 p. m., sábados 9 a. m. a 4 p. m.).";
  }
  if (d.fecha === hoy && d.hora <= horaActualColombia(ahora)) {
    return "Esa hora de hoy ya pasó. Elige una hora posterior o otro día.";
  }
  return null;
}

type ParaMensaje = Pick<
  Domicilio,
  "cliente_nombre" | "tipo" | "costo" | "fecha" | "hora" | "direccion"
>;

export function mensajeDomicilio(
  d: ParaMensaje,
  tipo: "confirmar" | "en_camino",
) {
  const nombre = d.cliente_nombre.split(" ")[0] || "";
  if (tipo === "en_camino") {
    return `Hola ${nombre}, tu domiciliario ya va en camino a ${d.direccion}. ¡Gracias por confiar en nosotros!`;
  }
  return `Hola ${nombre}, confirmamos tu domicilio (${TIPOS_DOMICILIO[d.tipo].resumen}) para el ${formatFecha(d.fecha)} a las ${formatHora(d.hora)} en ${d.direccion}. Valor: ${formatMoney(d.costo)}. Te avisaremos por mensaje cuando el domiciliario esté en camino.`;
}
