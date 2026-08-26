import type { Estado, Orden, Tamano, TipoMaleta } from "@/types/database";

export const ESTADOS: Estado[] = ["recibida", "lista", "entregada"];

// Lista fija de técnicos/encargados: no se saca de ninguna fuente
// editable (antes venía de los nombres de las pestañas del Google
// Sheet), para que nadie la pueda cambiar sin tocar el código.
export const TECNICOS: string[] = [
  "Tatiana",
  "Laura",
  "Ana Maria",
  "Valentina",
  "Juan",
  "Juan Esteban",
  "Mike",
  "Viviana",
  "Roimer",
  "Patricia",
  "Jonathan",
  "Michel",
];

export const ESTADO_LABELS: Record<Estado, string> = {
  recibida: "Recibida",
  lista: "Lista",
  entregada: "Entregada",
};

export const TAMANO_LABELS: Record<Tamano, string> = {
  "pequeña": "Pequeña",
  mediana: "Mediana",
  grande: "Grande",
};

export const TIPO_LABELS: Record<TipoMaleta, string> = {
  fibra: "Fibra",
  lona: "Lona",
  morral: "Morral",
  maletin: "Maletín",
  estuche: "Estuche",
};

const DIAS_ALERTA = 30;

export function diasSinEntregar(orden: Pick<Orden, "fecha_recibido" | "estado">) {
  if (orden.estado === "entregada") return 0;
  const recibido = new Date(orden.fecha_recibido).getTime();
  const ahora = Date.now();
  return Math.floor((ahora - recibido) / (1000 * 60 * 60 * 24));
}

export function estaAtrasada(orden: Pick<Orden, "fecha_recibido" | "estado">) {
  return orden.estado !== "entregada" && diasSinEntregar(orden) > DIAS_ALERTA;
}

type EstadoColor = "verde" | "amarillo" | "azul" | "rojo" | "gris";

const COLOR_CLASSES: Record<EstadoColor, { bar: string; badge: string; dot: string }> = {
  verde: {
    bar: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
  amarillo: {
    bar: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  azul: {
    bar: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
  },
  rojo: {
    bar: "border-l-red-500",
    badge: "bg-red-100 text-red-800",
    dot: "bg-red-500",
  },
  gris: {
    bar: "border-l-slate-400",
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
};

const ESTADO_COLOR: Record<Estado, EstadoColor> = {
  recibida: "amarillo",
  lista: "verde",
  entregada: "azul",
};

export function getEstadoColor(orden: Pick<Orden, "estado" | "fecha_recibido">): EstadoColor {
  if (estaAtrasada(orden)) return "rojo";
  return ESTADO_COLOR[orden.estado];
}

export function getEstadoClasses(orden: Pick<Orden, "estado" | "fecha_recibido">) {
  return COLOR_CLASSES[getEstadoColor(orden)];
}

export function estadoDotClass(estado: Estado) {
  return COLOR_CLASSES[ESTADO_COLOR[estado]].dot;
}

export function mensajeWhatsapp(orden: Pick<Orden, "cliente_nombre" | "numero_recibo" | "estado" | "marca" | "color">) {
  const nombre = orden.cliente_nombre?.split(" ")[0] || "";
  const maleta = `${orden.marca} ${orden.color}`.trim();

  switch (orden.estado) {
    case "recibida":
      return `Hola ${nombre}, te confirmamos que recibimos tu maleta ${maleta} (recibo #${orden.numero_recibo}) en el taller. Te avisamos apenas tengamos novedades.`;
    case "lista":
      return `Hola ${nombre}, ¡buenas noticias! Tu maleta ${maleta} (recibo #${orden.numero_recibo}) ya está lista para retirar. Te esperamos en nuestro centro técnico.`;
    case "entregada":
      return `Hola ${nombre}, gracias por retirar tu maleta ${maleta} (recibo #${orden.numero_recibo}). ¡Cualquier consulta estamos a disposición!`;
    default:
      return `Hola ${nombre}, te escribimos por tu maleta ${maleta} (recibo #${orden.numero_recibo}).`;
  }
}

// Los números se guardan a nivel local (10 dígitos, sin el 57 de
// Colombia), pero wa.me necesita el código de país completo o WhatsApp
// no encuentra el contacto y termina pidiendo buscarlo a mano.
export function numeroWhatsapp(telefono: string) {
  const soloDigitos = telefono.replace(/[^\d]/g, "");
  if (soloDigitos.length === 10) return `57${soloDigitos}`;
  return soloDigitos;
}

export function linkWhatsapp(telefono: string, mensaje: string) {
  return `https://wa.me/${numeroWhatsapp(telefono)}?text=${encodeURIComponent(mensaje)}`;
}
