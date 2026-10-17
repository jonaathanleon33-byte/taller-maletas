export type Tamano = "pequeña" | "mediana" | "grande";
export type TipoMaleta =
  | "fibra"
  | "lona"
  | "morral"
  | "maletin"
  | "estuche"
  | "manos_libres"
  | "cartera"
  | "morral_ruedas"
  | "tula";
export type Estado = "recibida" | "lista" | "entregada" | "entregada_sin_reparar";

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
  ubicacion: string | null;
  tecnico_asignado: string | null;
  recibido_por: string | null;
  notificada_lista_en: string | null;
  segunda_notificacion_en: string | null;
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
  | "id"
  | "created_at"
  | "updated_at"
  | "estado"
  | "fecha_entregada"
  | "numero_recibo"
  | "ubicacion"
  | "notificada_lista_en"
  | "segunda_notificacion_en"
> & {
  estado?: Estado;
  fecha_entregada?: string | null;
  numero_recibo?: string;
  ubicacion?: string | null;
  notificada_lista_en?: string | null;
  segunda_notificacion_en?: string | null;
};

export type MetodoPago =
  | "efectivo"
  | "tarjeta"
  | "transferencia"
  | "pago_al_recoger";

export type Servicio = {
  id: string;
  nombre: string;
  precio: number;
  activo: boolean;
  created_at: string;
};

export type Comprobante = {
  id: string;
  numero_venta: number;
  orden_id: string | null;
  metodo_pago: MetodoPago;
  atendido_por: string | null;
  descuento_global: number;
  impuestos: number;
  abono: number;
  pagado: boolean;
  facturacion_electronica: boolean;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  created_at: string;
  updated_at: string;
};

export type ComprobanteItem = {
  id: string;
  comprobante_id: string;
  servicio_id: string | null;
  descripcion: string;
  precio_unitario: number;
  cantidad: number;
  descuento_pct: number;
  created_at: string;
};

export type NegocioConfig = {
  id: number;
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
  web: string;
  pie_texto: string;
  logo_url: string | null;
  fondo_home_url: string | null;
  updated_at: string;
};

export type TipoDomicilio =
  | "recogida"
  | "entrega"
  | "recogida_entrega"
  | "con_desbloqueo";
export type EstadoDomicilio =
  | "nuevo"
  | "confirmado"
  | "en_camino"
  | "hecho"
  | "cancelado";

export type Domicilio = {
  id: string;
  created_at: string;
  updated_at: string;
  cliente_nombre: string;
  cliente_telefono: string;
  direccion: string;
  barrio: string | null;
  tipo: TipoDomicilio;
  costo: number;
  fecha: string;
  hora: string;
  numero_recibo: string | null;
  notas: string | null;
  estado: EstadoDomicilio;
  origen: "formulario" | "manual";
};

export type EstadoCotizacion = "pendiente" | "aprobada" | "rechazada";

export type Cotizacion = {
  id: string;
  numero: number;
  created_at: string;
  updated_at: string;
  cliente_nombre: string;
  cliente_telefono: string;
  descripcion: string;
  notas: string | null;
  descuento_global: number;
  incluye_iva: boolean;
  vigencia_hasta: string | null;
  estado: EstadoCotizacion;
  marca: string | null;
  color: string | null;
  tamano: string | null;
  tipo: string | null;
  orden_id: string | null;
};

export type CotizacionFoto = {
  id: string;
  cotizacion_id: string;
  url: string;
  created_at: string;
};

export type CotizacionItem = {
  id: string;
  cotizacion_id: string;
  servicio_id: string | null;
  descripcion: string;
  precio_unitario: number;
  cantidad: number;
  descuento_pct: number;
  created_at: string;
};

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
      cotizaciones: {
        Row: Cotizacion;
        Insert: Omit<
          Cotizacion,
          | "id"
          | "numero"
          | "created_at"
          | "updated_at"
          | "notas"
          | "descuento_global"
          | "incluye_iva"
          | "vigencia_hasta"
          | "estado"
          | "marca"
          | "color"
          | "tamano"
          | "tipo"
          | "orden_id"
        > &
          Partial<
            Pick<
              Cotizacion,
              | "notas"
              | "descuento_global"
              | "incluye_iva"
              | "vigencia_hasta"
              | "estado"
              | "marca"
              | "color"
              | "tamano"
              | "tipo"
              | "orden_id"
            >
          >;
        Update: Partial<Omit<Cotizacion, "id" | "numero" | "created_at">>;
        Relationships: [];
      };
      cotizacion_items: {
        Row: CotizacionItem;
        Insert: Omit<
          CotizacionItem,
          "id" | "created_at" | "descuento_pct" | "cantidad" | "servicio_id"
        > & {
          servicio_id?: string | null;
          descuento_pct?: number;
          cantidad?: number;
        };
        Update: Partial<Omit<CotizacionItem, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "cotizacion_items_cotizacion_id_fkey";
            columns: ["cotizacion_id"];
            isOneToOne: false;
            referencedRelation: "cotizaciones";
            referencedColumns: ["id"];
          },
        ];
      };
      cotizacion_fotos: {
        Row: CotizacionFoto;
        Insert: Omit<CotizacionFoto, "id" | "created_at">;
        Update: Partial<Omit<CotizacionFoto, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "cotizacion_fotos_cotizacion_id_fkey";
            columns: ["cotizacion_id"];
            isOneToOne: false;
            referencedRelation: "cotizaciones";
            referencedColumns: ["id"];
          },
        ];
      };
      domicilios: {
        Row: Domicilio;
        Insert: Omit<Domicilio, "id" | "created_at" | "updated_at" | "estado" | "origen" | "barrio" | "numero_recibo" | "notas" | "costo"> &
          Partial<
            Pick<Domicilio, "estado" | "origen" | "barrio" | "numero_recibo" | "notas" | "costo">
          >;
        Update: Partial<Omit<Domicilio, "id" | "created_at">>;
        Relationships: [];
      };
      servicios: {
        Row: Servicio;
        Insert: Omit<Servicio, "id" | "created_at" | "activo"> & {
          activo?: boolean;
        };
        Update: Partial<Omit<Servicio, "id" | "created_at">>;
        Relationships: [];
      };
      comprobantes: {
        Row: Comprobante;
        Insert: Omit<
          Comprobante,
          | "id"
          | "numero_venta"
          | "created_at"
          | "updated_at"
          | "orden_id"
          | "metodo_pago"
          | "atendido_por"
          | "descuento_global"
          | "impuestos"
          | "abono"
          | "pagado"
          | "facturacion_electronica"
          | "cliente_nombre"
          | "cliente_telefono"
        > & {
          facturacion_electronica?: boolean;
          orden_id?: string | null;
          metodo_pago?: MetodoPago;
          atendido_por?: string | null;
          descuento_global?: number;
          impuestos?: number;
          abono?: number;
          pagado?: boolean;
          cliente_nombre?: string | null;
          cliente_telefono?: string | null;
        };
        Update: Partial<
          Omit<
            Comprobante,
            "id" | "numero_venta" | "orden_id" | "created_at" | "updated_at"
          >
        >;
        Relationships: [
          {
            foreignKeyName: "comprobantes_orden_id_fkey";
            columns: ["orden_id"];
            isOneToOne: true;
            referencedRelation: "ordenes";
            referencedColumns: ["id"];
          },
        ];
      };
      comprobante_items: {
        Row: ComprobanteItem;
        Insert: Omit<
          ComprobanteItem,
          "id" | "created_at" | "descuento_pct" | "cantidad"
        > & {
          descuento_pct?: number;
          cantidad?: number;
        };
        Update: Partial<Omit<ComprobanteItem, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "comprobante_items_comprobante_id_fkey";
            columns: ["comprobante_id"];
            isOneToOne: false;
            referencedRelation: "comprobantes";
            referencedColumns: ["id"];
          },
        ];
      };
      negocio_config: {
        Row: NegocioConfig;
        Insert: Partial<Omit<NegocioConfig, "id" | "updated_at">> & {
          id: number;
        };
        Update: Partial<Omit<NegocioConfig, "id" | "updated_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
