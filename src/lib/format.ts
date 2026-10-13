// Todo se muestra en hora de Colombia, no en la del servidor: Vercel
// corre en UTC, que va 5 horas adelantada.
const ZONA = "America/Bogota";
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function formatFecha(iso: string | null) {
  if (!iso) return "—";
  // Una fecha sin hora (como la fecha prometida) no es un instante: se
  // muestra tal cual, sin correrla de día por la zona horaria.
  const soloFecha = SOLO_FECHA.test(iso);
  return new Date(soloFecha ? `${iso}T12:00:00Z` : iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: soloFecha ? "UTC" : ZONA,
  });
}

export function formatFechaHora(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONA,
  });
}

export function formatFechaHoraRecibo(iso: string) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: ZONA,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${partes.year}-${partes.month}-${partes.day} ${partes.hour}:${partes.minute}:${partes.second}`;
}

// Lo que escribe la persona en el campo de fecha y hora (sin zona) es
// hora de Colombia; sin esto el servidor lo leía como UTC y lo guardaba
// 5 horas corrido.
export function fechaHoraColombiaAIso(valor: string) {
  const naive = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(valor);
  if (!naive) return new Date(valor).toISOString();
  const conSegundos = valor.length === 16 ? `${valor}:00` : valor;
  return new Date(`${conSegundos}-05:00`).toISOString();
}

// Fecha y hora actuales de Colombia en el formato de un
// <input type="datetime-local"> (AAAA-MM-DDTHH:mm), sin depender de la
// zona horaria del teléfono o computador desde donde se abra el sistema.
export function ahoraColombiaParaInput(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ahora);
  const get = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// Fecha (AAAA-MM-DD) de Colombia dentro de `dias` días, para los
// atajos "Hoy / Mañana / En 3 días" del formulario.
export function fechaColombiaMasDias(dias: number, ahora = new Date()) {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(ahora);
  const d = new Date(`${hoy}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
