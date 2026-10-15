import { google } from "googleapis";
import { ESTADO_LABELS, TAMANO_LABELS, TIPO_LABELS } from "@/lib/estado";
import { formatFecha, formatFechaHora } from "@/lib/format";
import type { Estado, Orden } from "@/types/database";

const SHEET_NAME = "Ordenes";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) return null;

  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function warnFaltanVariables(contexto: string) {
  console.warn(`Sheets: ${contexto} salteada, faltan variables de entorno.`, {
    tieneSheetId: Boolean(process.env.GOOGLE_SHEET_ID),
    tieneEmail: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
    tieneKey: Boolean(process.env.GOOGLE_PRIVATE_KEY),
  });
}

// El número de recibo NO es único por fila: cuando un cliente deja
// varias maletas en una sola visita, todas comparten el mismo número
// y cada una es su propia fila. Por eso cada fila también guarda el
// id interno de la orden en una columna aparte (fuera de lo que el
// taller necesita ver) — así las actualizaciones posteriores
// (precio, estado) siempre pegan en la fila correcta, no en la
// primera que comparte número de recibo.
const COLUMNA_ID = "O";

export async function exportarOrdenASheets(orden: Orden) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const auth = getAuth();

  if (!sheetId || !auth) {
    warnFaltanVariables("exportación de orden");
    return;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            orden.numero_recibo,
            orden.cliente_nombre,
            orden.cliente_telefono,
            orden.marca,
            orden.color,
            TAMANO_LABELS[orden.tamano],
            TIPO_LABELS[orden.tipo],
            orden.dano_descripcion,
            orden.ubicacion ?? "",
            orden.tecnico_asignado ?? "",
            ESTADO_LABELS[orden.estado],
            formatFechaHora(orden.fecha_recibido),
            formatFecha(orden.fecha_prometida),
            // Precio: todavía no se conoce al crear la orden (el
            // comprobante se llena después), se actualiza más
            // adelante con actualizarPrecioEnSheets.
            0,
            orden.id,
          ],
        ],
      },
    });
  } catch (err) {
    console.error("No se pudo exportar la orden a Google Sheets:", err);
  }
}

const COLUMNA_PRECIO = "N";
const COLUMNA_ESTADO = "K";

async function buscarFilaPorOrdenId(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  ordenId: string,
) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!${COLUMNA_ID}:${COLUMNA_ID}`,
  });

  const filas = res.data.values ?? [];
  const indice = filas.findIndex((fila) => String(fila[0] ?? "") === ordenId);
  return indice === -1 ? null : indice + 1;
}

export async function actualizarPrecioEnSheets(ordenId: string, precio: number) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const auth = getAuth();

  if (!sheetId || !auth) {
    warnFaltanVariables("actualización de precio");
    return;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const numeroFila = await buscarFilaPorOrdenId(sheets, sheetId, ordenId);
    if (!numeroFila) return;

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!${COLUMNA_PRECIO}${numeroFila}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[precio]] },
    });
  } catch (err) {
    console.error("No se pudo actualizar el precio en Google Sheets:", err);
  }
}

// El estado cambia varias veces durante la vida de la orden
// (recibida → lista → entregada) y hasta ahora el Sheet se quedaba
// con el valor de cuando se creó — esto lo mantiene al día en cada
// cambio, sea desde el selector manual o desde "Entregar y cobrar".
export async function actualizarEstadoEnSheets(ordenId: string, estado: Estado) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const auth = getAuth();

  if (!sheetId || !auth) {
    warnFaltanVariables("actualización de estado");
    return;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const numeroFila = await buscarFilaPorOrdenId(sheets, sheetId, ordenId);
    if (!numeroFila) return;

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!${COLUMNA_ESTADO}${numeroFila}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[ESTADO_LABELS[estado]]] },
    });
  } catch (err) {
    console.error("No se pudo actualizar el estado en Google Sheets:", err);
  }
}

const COLUMNA_DESCRIPCION = "H";

// La descripción del arreglo se puede corregir después de crear la
// orden; esto refleja el cambio en la columna "Daño" del Sheet.
export async function actualizarDescripcionEnSheets(
  ordenId: string,
  descripcion: string,
) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const auth = getAuth();

  if (!sheetId || !auth) {
    warnFaltanVariables("actualización de descripción");
    return;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const numeroFila = await buscarFilaPorOrdenId(sheets, sheetId, ordenId);
    if (!numeroFila) return;

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!${COLUMNA_DESCRIPCION}${numeroFila}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[descripcion]] },
    });
  } catch (err) {
    console.error("No se pudo actualizar la descripción en Google Sheets:", err);
  }
}

// Cuando se elimina una orden no se borra su fila del Sheet (es el
// respaldo del taller); se deja marcada como "Eliminada" para que no
// parezca una maleta todavía pendiente.
export async function marcarOrdenEliminadaEnSheets(ordenId: string) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const auth = getAuth();

  if (!sheetId || !auth) {
    warnFaltanVariables("marcar orden eliminada");
    return;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const numeroFila = await buscarFilaPorOrdenId(sheets, sheetId, ordenId);
    if (!numeroFila) return;

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!${COLUMNA_ESTADO}${numeroFila}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["Eliminada"]] },
    });
  } catch (err) {
    console.error("No se pudo marcar la orden como eliminada en Sheets:", err);
  }
}

// Escribe `valor` en `columna` de las filas de varias órdenes a la vez
// (se buscan por el id de la orden, columna O).
async function actualizarColumnaDeOrdenes(
  ordenIds: string[],
  columna: string,
  valor: string,
  contexto: string,
) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const auth = getAuth();

  if (!sheetId || !auth) {
    warnFaltanVariables(contexto);
    return;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!${COLUMNA_ID}:${COLUMNA_ID}`,
    });
    const filas = res.data.values ?? [];
    const ids = new Set(ordenIds);
    const data = filas.flatMap((fila, i) =>
      ids.has(String(fila[0] ?? ""))
        ? [{ range: `${SHEET_NAME}!${columna}${i + 1}`, values: [[valor]] }]
        : [],
    );
    if (data.length === 0) return;

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: { valueInputOption: "USER_ENTERED", data },
    });
  } catch (err) {
    console.error(`No se pudo hacer la ${contexto} en Google Sheets:`, err);
  }
}

// Cambia el nombre del cliente en las filas de varias órdenes a la vez
// (las maletas de un mismo recibo comparten cliente).
export async function actualizarNombreEnSheets(
  ordenIds: string[],
  nombre: string,
) {
  await actualizarColumnaDeOrdenes(ordenIds, "B", nombre, "actualización de nombre");
}

export async function actualizarFechaPrometidaEnSheets(
  ordenIds: string[],
  fechaIso: string,
) {
  await actualizarColumnaDeOrdenes(
    ordenIds,
    "M",
    formatFecha(fechaIso),
    "actualización de fecha prometida",
  );
}
