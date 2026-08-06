-- ============================================================
-- Taller de maletas — esquema inicial
-- Ejecutar en el SQL Editor de Supabase o con `supabase db push`
-- ============================================================

-- Enums -------------------------------------------------------
create type tamano_enum as enum ('cabina', 'mediana', 'grande');
create type tipo_enum as enum ('rigida', 'tela', 'mochila', 'maletin');
create type estado_enum as enum (
  'recibida',
  'en_reparacion',
  'esperando_repuesto',
  'lista',
  'entregada'
);

-- Tabla: ordenes ------------------------------------------------
create table ordenes (
  id uuid primary key default gen_random_uuid(),
  numero_recibo text not null unique,
  cliente_nombre text not null,
  cliente_telefono text not null,
  marca text not null,
  color text not null,
  tamano tamano_enum not null,
  tipo tipo_enum not null,
  dano_descripcion text not null,
  ubicacion text not null,
  tecnico_asignado text,
  estado estado_enum not null default 'recibida',
  fecha_recibido timestamptz not null default now(),
  fecha_prometida date,
  fecha_entregada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ordenes_estado_idx on ordenes (estado);
create index ordenes_fecha_recibido_idx on ordenes (fecha_recibido desc);
create index ordenes_numero_recibo_idx on ordenes (numero_recibo);

-- Tabla: fotos ----------------------------------------------------
create table fotos (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references ordenes (id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

create index fotos_orden_id_idx on fotos (orden_id);

-- Tabla: historial_estados ----------------------------------------
create table historial_estados (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references ordenes (id) on delete cascade,
  estado_anterior estado_enum,
  estado_nuevo estado_enum not null,
  created_at timestamptz not null default now()
);

create index historial_estados_orden_id_idx on historial_estados (orden_id);

-- Trigger: mantener updated_at al día ------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger ordenes_set_updated_at
  before update on ordenes
  for each row
  execute function set_updated_at();

-- Trigger: registrar historial de estados automáticamente ----------
-- Al crear una orden, registra el estado inicial (estado_anterior = null).
-- Al actualizar, solo registra si el estado realmente cambió.
create or replace function registrar_historial_estado()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into historial_estados (orden_id, estado_anterior, estado_nuevo)
    values (new.id, null, new.estado);
  elsif tg_op = 'UPDATE' and new.estado is distinct from old.estado then
    insert into historial_estados (orden_id, estado_anterior, estado_nuevo)
    values (new.id, old.estado, new.estado);

    if new.estado = 'entregada' and new.fecha_entregada is null then
      new.fecha_entregada = now();
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger ordenes_registrar_historial
  before insert or update on ordenes
  for each row
  execute function registrar_historial_estado();

-- ============================================================
-- Storage: bucket para fotos de órdenes
-- ============================================================
insert into storage.buckets (id, name, public)
values ('fotos-ordenes', 'fotos-ordenes', true)
on conflict (id) do nothing;

-- ============================================================
-- Row Level Security
--
-- MVP sin login propio (se usa desde el mostrador del taller).
-- Se habilita RLS y se permite acceso completo al rol `anon` para
-- no bloquear el uso inmediato. Antes de exponer la app fuera de
-- la red del taller, restringir estas políticas (por ejemplo,
-- agregando autenticación de Supabase y cambiando `anon` por
-- `authenticated`).
-- ============================================================
alter table ordenes enable row level security;
alter table fotos enable row level security;
alter table historial_estados enable row level security;

create policy "ordenes_anon_all" on ordenes
  for all to anon, authenticated
  using (true)
  with check (true);

create policy "fotos_anon_all" on fotos
  for all to anon, authenticated
  using (true)
  with check (true);

create policy "historial_anon_select" on historial_estados
  for select to anon, authenticated
  using (true);

-- El historial solo se inserta vía trigger (contexto del owner de la
-- función), por eso no se agrega policy de insert/update/delete para
-- anon/authenticated en historial_estados.

create policy "fotos_ordenes_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'fotos-ordenes');

create policy "fotos_ordenes_anon_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'fotos-ordenes');

create policy "fotos_ordenes_anon_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'fotos-ordenes');
