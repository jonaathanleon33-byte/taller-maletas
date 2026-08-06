export type Tamano = "cabina" | "mediana" | "grande";
export type TipoMaleta = "rigida" | "tela" | "mochila" | "maletin";
export type Estado =
  | "recibida"
  | "en_reparacion"
  | "esperando_repuesto"
  | "lista"
  | "entregada";

export type Orden = {
  id: string;
  numero_recibo: string;
  cliente_nombre: string;
  cliente_telefono: string;
  marca: string;
  color: string;
  tamano: Tamano;
  tipo: TipoMaleta;
  dano_descripcion: string;
  ubicacion: string;
  tecnico_asignado: string | null;
  estado: Estado;
  fecha_recibido: string;
  fecha_prometida: string | null;
  fecha_entregada: string | null;
  created_at: string;
  updated_at: string;
};

export type Foto = {
  id: string;
  orden_id: string;
  url: string;
  created_at: string;
};

export type HistorialEstado = {
  id: string;
  orden_id: string;
  estado_anterior: Estado | null;
  estado_nuevo: Estado;
  created_at: string;
};

export type OrdenInsert = Omit<
  Orden,
  "id" | "created_at" | "updated_at" | "estado" | "fecha_entregada"
> & { estado?: Estado; fecha_entregada?: string | null };

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      ordenes: {
        Row: Orden;
        Insert: OrdenInsert;
        Update: Partial<OrdenInsert>;
        Relationships: [];
      };
      fotos: {
        Row: Foto;
        Insert: Omit<Foto, "id" | "created_at">;
        Update: Partial<Omit<Foto, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "fotos_orden_id_fkey";
            columns: ["orden_id"];
            isOneToOne: false;
            referencedRelation: "ordenes";
            referencedColumns: ["id"];
          },
        ];
      };
      historial_estados: {
        Row: HistorialEstado;
        Insert: Omit<HistorialEstado, "id" | "created_at">;
        Update: Partial<Omit<HistorialEstado, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "historial_estados_orden_id_fkey";
            columns: ["orden_id"];
            isOneToOne: false;
            referencedRelation: "ordenes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
