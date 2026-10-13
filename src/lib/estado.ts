import type { Estado, Orden, Tamano, TipoMaleta } from "@/types/database";

export const ESTADOS: Estado[] = [
  "recibida",
  "lista",
  "entregada",
  "entregada_sin_reparar",
];

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
  entregada_sin_reparar: "Entregada sin reparar",
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
  manos_libres: "Manos libres",
  cartera: "Cartera",
  morral_ruedas: "Morral con ruedas",
  tula: "Tula",
};

export const DIAS_ALERTA = 3;

// "entregada" y "entregada sin reparar" son los dos estados finales:
// la maleta ya salió del taller en ambos casos, se haya reparado o no.
export function esEntregada(estado: Estado) {
  return estado === "entregada" || estado === "entregada_sin_reparar";
}

export function diasSinEntregar(orden: Pick<Orden, "fecha_recibido" | "estado">) {
  if (esEntregada(orden.estado)) return 0;
  const recibido = new Date(orden.fecha_recibido).getTime();
  const ahora = Date.now();
  return Math.floor((ahora - recibido) / (1000 * 60 * 60 * 24));
}

// Solo cuenta como atrasada mientras sigue "recibida" (todavía sin
// empezar/terminar el arreglo). Una vez que pasa a "lista" ya se hizo
// el trabajo a tiempo o no, pero deja de ser una alerta de "hay que
// atenderla" — por eso no se marca atrasada aunque lleve muchos días
// esperando a que el cliente la retire.
export function estaAtrasada(orden: Pick<Orden, "fecha_recibido" | "estado">) {
  return orden.estado === "recibida" && diasSinEntregar(orden) > DIAS_ALERTA;
}

// Días de trabajo (lunes a sábado; el domingo no se cuenta) después de
// avisarle al cliente que su maleta está lista, tras los cuales conviene
// volver a avisarle si todavía no la recoge.
export const DIAS_RENOTIFICAR = 3;

const ZONA = "America/Bogota";

// Fecha calendario (AAAA-MM-DD) en hora de Colombia: el servidor corre
// en UTC, y de noche ya sería "mañana" allá.
export function fechaColombia(fecha: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(fecha);
}

function esDomingo(fechaIso: string) {
  return new Date(`${fechaIso}T12:00:00Z`).getUTCDay() === 0;
}

function sumarDias(fechaIso: string, dias: number) {
  const d = new Date(`${fechaIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// Días de trabajo transcurridos desde `desde` hasta hoy, sin contar el
// día de `desde` y sin contar domingos.
export function diasHabilesDesde(desde: string, ahora = new Date()) {
  const inicio = fechaColombia(new Date(desde));
  const fin = fechaColombia(ahora);
  let dias = 0;
  for (let dia = sumarDias(inicio, 1); dia <= fin; dia = sumarDias(dia, 1)) {
    if (!esDomingo(dia)) dias++;
  }
  return dias;
}

// Instante límite para consultar en la base: las maletas notificadas
// antes de esto ya cumplen DIAS_RENOTIFICAR días de trabajo.
export function corteRenotificar(ahora = new Date()) {
  // Caminamos hacia atrás desde hoy contando días de trabajo; al
  // terminar, `dia` es el último día en que pudo notificarse (inclusive)
  // para que ya hayan pasado esos días. El corte es el final de ese día.
  let dia = fechaColombia(ahora);
  let contados = 0;
  while (contados < DIAS_RENOTIFICAR) {
    if (!esDomingo(dia)) contados++;
    dia = sumarDias(dia, -1);
  }
  return new Date(`${sumarDias(dia, 1)}T00:00:00-05:00`).toISOString();
}

export function diasDesdeNotificacion(
  orden: Pick<Orden, "estado" | "notificada_lista_en">,
) {
  if (orden.estado !== "lista" || !orden.notificada_lista_en) return null;
  return diasHabilesDesde(orden.notificada_lista_en);
}

export function debeRenotificar(
  orden: Pick<Orden, "estado" | "notificada_lista_en">,
) {
  const dias = diasDesdeNotificacion(orden);
  return dias !== null && dias >= DIAS_RENOTIFICAR;
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
  entregada_sin_reparar: "gris",
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

// Texto que se agrega al aviso de "ya está lista" desde la segunda
// notificación en adelante: plazo para recoger, bodegaje y destrucción.
export const AVISO_PLAZO_RECOGIDA =
  "Después de este segundo aviso tienes 6 días hábiles para recoger tus pertenencias (maletas o morrales). " +
  "Nuestro horario es de lunes a viernes de 9:00 a. m. a 6:00 p. m. y sábados de 9:00 a. m. a 4:00 p. m. " +
  "Pasados esos 6 días hábiles se cobrará un bodegaje de $50.000, y pasados 6 meses desde este segundo aviso " +
  "las maletas se enviarán a destrucción.";

export function mensajeWhatsapp(
  orden: Pick<Orden, "cliente_nombre" | "numero_recibo" | "estado" | "marca" | "color"> &
    Partial<Pick<Orden, "notificada_lista_en">>,
) {
  const nombre = orden.cliente_nombre?.split(" ")[0] || "";
  const maleta = `${orden.marca} ${orden.color}`.trim();

  switch (orden.estado) {
    case "recibida":
      return `Hola ${nombre}, te confirmamos que recibimos tu maleta ${maleta} (recibo #${orden.numero_recibo}) en el taller. Te avisamos apenas tengamos novedades.`;
    case "lista":
      if (orden.notificada_lista_en) {
        return `Hola ${nombre}, te recordamos que tu maleta ${maleta} (recibo #${orden.numero_recibo}) ya está lista para retirar en nuestro centro técnico. ${AVISO_PLAZO_RECOGIDA}`;
      }
      return `Hola ${nombre}, ¡buenas noticias! Tu maleta ${maleta} (recibo #${orden.numero_recibo}) ya está lista para retirar. Te esperamos en nuestro centro técnico.`;
    case "entregada":
      return `Hola ${nombre}, gracias por retirar tu maleta ${maleta} (recibo #${orden.numero_recibo}). ¡Cualquier consulta estamos a disposición!`;
    case "entregada_sin_reparar":
      return `Hola ${nombre}, confirmamos la entrega de tu maleta ${maleta} (recibo #${orden.numero_recibo}) sin realizar la reparación. ¡Cualquier consulta estamos a disposición!`;
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

// Un teléfono es usable si, sin signos ni espacios, tiene 10 dígitos
// (celular o fijo con indicativo), 12 con el 57 de Colombia al inicio,
// o 7 (fijo local), o número internacional con "+". Así se evita guardar números cortados o con letras
// que luego no abren WhatsApp.
export function telefonoValido(telefono: string) {
  if (/[^\d\s+\-().]/.test(telefono)) return false;
  const digitos = telefono.replace(/\D/g, "");
  // Clientes del exterior: "+" y código de país (hasta 15 dígitos).
  if (telefono.trim().startsWith("+")) {
    return digitos.length >= 8 && digitos.length <= 15;
  }
  if (digitos.length === 10 || digitos.length === 7) return true;
  return digitos.length === 12 && digitos.startsWith("57");
}

export const MENSAJE_TELEFONO_INVALIDO =
  "El teléfono no es válido: debe tener 10 dígitos (por ejemplo 3001234567).";

// Mensaje de "ya está lista" para un cliente con una o varias maletas
// listas (agrupadas por teléfono): un solo mensaje en vez de uno por
// maleta.
export function mensajeListaGrupo(
  ordenes: (Pick<Orden, "cliente_nombre" | "numero_recibo" | "marca" | "color"> &
    Partial<Pick<Orden, "notificada_lista_en">>)[],
) {
  if (ordenes.length === 1) {
    return mensajeWhatsapp({ ...ordenes[0], estado: "lista" });
  }
  const nombre = ordenes[0].cliente_nombre?.split(" ")[0] || "";
  const detalle = ordenes
    .map((o) => `${`${o.marca} ${o.color}`.trim()} (recibo #${o.numero_recibo})`)
    .join(", ");
  if (ordenes.some((o) => o.notificada_lista_en)) {
    return `Hola ${nombre}, te recordamos que tus maletas ${detalle} ya están listas para retirar en nuestro centro técnico. ${AVISO_PLAZO_RECOGIDA}`;
  }
  return `Hola ${nombre}, ¡buenas noticias! Tus maletas ${detalle} ya están listas para retirar. Te esperamos en nuestro centro técnico.`;
}
