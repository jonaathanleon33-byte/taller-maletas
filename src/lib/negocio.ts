import { createClient } from "@/lib/supabase/server";
import type { NegocioConfig } from "@/types/database";

const NEGOCIO_DEFAULT: NegocioConfig = {
  id: 1,
  nombre: "REPARACIÓN DE MALETAS SAS",
  nit: "NIT 901909878-0",
  direccion: "CRA 58 # 127-42",
  telefono: "322 716 6223",
  web: "reparaciondemaletas.com.co",
  pie_texto:
    "Gracias por confiar en nosotros\nRetiro máx. 30 días posfecha de entrega. Luego, abandono y no nos hacemos responsables.\nPara la entrega presente este recibo. Gracias.",
  logo_url: null,
  updated_at: "",
};

export async function obtenerNegocioConfig(): Promise<NegocioConfig> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("negocio_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  return data ?? NEGOCIO_DEFAULT;
}
