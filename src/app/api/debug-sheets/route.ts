import { NextResponse } from "next/server";

export async function GET() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  return NextResponse.json({
    tieneEmail: Boolean(email),
    tieneKey: Boolean(key),
    tieneSheetId: Boolean(sheetId),
    keyEmpiezaCon: key ? key.slice(0, 30) : null,
    keyTerminaCon: key ? key.slice(-30) : null,
    keyLargo: key ? key.length : 0,
    keyTieneBackslashN: key ? key.includes("\\n") : false,
    keyTieneNewlineReal: key ? key.includes("\n") : false,
    email,
    sheetId,
  });
}
