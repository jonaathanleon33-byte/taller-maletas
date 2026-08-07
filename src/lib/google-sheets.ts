import { google } from "googleapis";
import { ESTADO_LABELS, TAMANO_LABELS, TIPO_LABELS } from "@/lib/estado";
import { formatFecha, formatFechaHora } from "@/lib/format";
import type { Orden } from "@/types/database";

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

export async function exportarOrdenASheets(orden: Orden) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const auth = getAuth();

  if (!sheetId || !auth) return;

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
          ],
        ],
      },
    });
  } catch (err) {
    console.error("No se pudo exportar la orden a Google Sheets:", err);
  }
}
