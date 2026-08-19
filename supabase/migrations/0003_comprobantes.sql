-- ============================================================
-- Comprobantes: recibo interno con ítems y precios, vinculado a
-- una orden. No es una factura fiscal (no pasa por la DIAN); es un
-- comprobante interno del taller, similar al que ya entrega el POS
-- del mostrador, para tener el detalle de cobro junto a la orden.
-- ============================================================

create type metodo_pago_enum as enum (
  'efectivo',
  'tarjeta',
  'transferencia',
  'otro'
);

-- Catálogo de servicios/reparaciones con precio -------------------
create table servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio numeric(12, 2) not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index servicios_activo_idx on servicios (activo);

-- Comprobante: uno por orden --------------------------------------
create table comprobantes (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null unique references ordenes (id) on delete cascade,
  metodo_pago metodo_pago_enum not null default 'efectivo',
  atendido_por text,
  descuento_global numeric(12, 2) not null default 0,
  impuestos numeric(12, 2) not null default 0,
  pagado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger comprobantes_set_updated_at
  before update on comprobantes
  for each row
  execute function set_updated_at();

-- Ítems del comprobante ---------------------------------------------
-- precio_unitario queda como "foto" del precio al momento de agregar
-- el ítem, para que cambios futuros en `servicios` no alteren
-- comprobantes ya emitidos.
create table comprobante_items (
  id uuid primary key default gen_random_uuid(),
  comprobante_id uuid not null references comprobantes (id) on delete cascade,
  servicio_id uuid references servicios (id) on delete set null,
  descripcion text not null,
  precio_unitario numeric(12, 2) not null,
  cantidad integer not null default 1,
  descuento_pct numeric(5, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index comprobante_items_comprobante_id_idx on comprobante_items (comprobante_id);

-- ============================================================
-- Row Level Security (mismo criterio que el resto del MVP: sin
-- login propio, acceso abierto a anon/authenticated)
-- ============================================================
alter table servicios enable row level security;
alter table comprobantes enable row level security;
alter table comprobante_items enable row level security;

create policy "servicios_anon_all" on servicios
  for all to anon, authenticated
  using (true)
  with check (true);

create policy "comprobantes_anon_all" on comprobantes
  for all to anon, authenticated
  using (true)
  with check (true);

create policy "comprobante_items_anon_all" on comprobante_items
  for all to anon, authenticated
  using (true)
  with check (true);
