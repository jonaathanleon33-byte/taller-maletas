-- Cotizaciones: datos opcionales de la maleta, fotos que manda el cliente
-- por WhatsApp y el vínculo con la orden en que se convierte.
alter table cotizaciones
  add column marca text,
  add column color text,
  add column tamano text,
  add column tipo text,
  add column orden_id uuid references ordenes(id) on delete set null;

create table cotizacion_fotos (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references cotizaciones(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

create index cotizacion_fotos_cotizacion_idx on cotizacion_fotos (cotizacion_id);

alter table cotizacion_fotos enable row level security;

create policy "cotizacion_fotos_anon_all" on cotizacion_fotos
  for all to anon, authenticated using (true) with check (true);
