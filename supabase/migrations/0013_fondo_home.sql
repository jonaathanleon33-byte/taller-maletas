alter table negocio_config add column fondo_home_url text;

insert into storage.buckets (id, name, public)
values ('fondo-home', 'fondo-home', true)
on conflict (id) do nothing;

create policy "fondo_home_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'fondo-home');

create policy "fondo_home_anon_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'fondo-home');

create policy "fondo_home_anon_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'fondo-home');

create policy "fondo_home_anon_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'fondo-home');
