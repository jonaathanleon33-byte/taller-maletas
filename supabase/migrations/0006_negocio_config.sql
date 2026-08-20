-- ============================================================
-- Configuración del negocio para el recibo imprimible.
-- Tabla singleton (una sola fila, id fijo en 1) editable desde
-- una pantalla de ajustes en la app.
-- ============================================================
create table negocio_config (
  id integer primary key default 1,
  nombre text not null default 'REPARACIÓN DE MALETAS SAS',
  nit text not null default 'NIT 901909878-0',
  direccion text not null default 'CRA 58 # 127-42',
  telefono text not null default '322 716 6223',
  web text not null default 'reparaciondemaletas.com.co',
  pie_texto text not null default 'Gracias por confiar en nosotros
Retiro máx. 30 días posfecha de entrega. Luego, abandono y no nos hacemos responsables.
Para la entrega presente este recibo. Gracias.',
  updated_at timestamptz not null default now(),
  constraint negocio_config_singleton check (id = 1)
);

insert into negocio_config (id) values (1);

create trigger negocio_config_set_updated_at
  before update on negocio_config
  for each row
  execute function set_updated_at();

alter table negocio_config enable row level security;

create policy "negocio_config_anon_select" on negocio_config
  for select to anon, authenticated
  using (true);

create policy "negocio_config_anon_update" on negocio_config
  for update to anon, authenticated
  using (true)
  with check (true);
