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
            orden.ubicacion,
            orden.tecnico_asignado ?? "",
            ESTADO_LABELS[orden.estado],
            formatFechaHora(orden.fecha_recibido),
            formatFecha(orden.fecha_prometida),
            // Precio: todavía no se conoce al crear la orden (el
            // comprobante se llena después), se actualiza más
            // adelante con actualizarPrecioEnSheets.
            0,
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

// Ambas funciones de abajo actualizan una celda de una fila ya
// creada (por eso no se conocía el valor al exportar la orden por
// primera vez), buscando la fila por número de recibo en la columna A.
async function buscarFilaPorRecibo(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  numeroRecibo: string,
) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A:A`,
  });

  const filas = res.data.values ?? [];
  const indice = filas.findIndex(
    (fila) => String(fila[0] ?? "") === String(numeroRecibo),
  );
  return indice === -1 ? null : indice + 1;
}

export async function actualizarPrecioEnSheets(
  numeroRecibo: string,
  precio: number,
) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const auth = getAuth();

  if (!sheetId || !auth) {
    warnFaltanVariables("actualización de precio");
    return;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const numeroFila = await buscarFilaPorRecibo(sheets, sheetId, numeroRecibo);
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
export async function actualizarEstadoEnSheets(
  numeroRecibo: string,
  estado: Estado,
) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const auth = getAuth();

  if (!sheetId || !auth) {
    warnFaltanVariables("actualización de estado");
    return;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const numeroFila = await buscarFilaPorRecibo(sheets, sheetId, numeroRecibo);
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
