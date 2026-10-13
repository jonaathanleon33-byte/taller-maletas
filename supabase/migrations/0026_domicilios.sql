-- Domicilios programados (recoger o entregar maletas a domicilio en
-- Bogotá). Los crea el cliente desde el formulario público /domicilio
-- (que se le envía por WhatsApp) o el taller a mano desde /domicilios.
create table domicilios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cliente_nombre text not null,
  cliente_telefono text not null,
  direccion text not null,
  barrio text,
  tipo text not null check (tipo in ('recogida', 'entrega', 'recogida_entrega', 'con_desbloqueo')),
  costo integer not null default 0,
  fecha date not null,
  hora text not null,
  numero_recibo text,
  notas text,
  estado text not null default 'nuevo' check (estado in ('nuevo', 'confirmado', 'en_camino', 'hecho', 'cancelado')),
  origen text not null default 'formulario' check (origen in ('formulario', 'manual'))
);

create index domicilios_fecha_idx on domicilios (fecha, hora);
create index domicilios_estado_idx on domicilios (estado);

alter table domicilios enable row level security;

create policy "domicilios_anon_all" on domicilios
  for all to anon, authenticated
  using (true)
  with check (true);

create or replace function set_domicilios_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger domicilios_updated_at
  before update on domicilios
  for each row execute function set_domicilios_updated_at();
