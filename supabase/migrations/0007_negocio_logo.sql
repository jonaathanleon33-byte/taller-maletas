alter table negocio_config add column logo_url text;

insert into storage.buckets (id, name, public)
values ('logo-negocio', 'logo-negocio', true)
on conflict (id) do nothing;

create policy "logo_negocio_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'logo-negocio');

create policy "logo_negocio_anon_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'logo-negocio');

create policy "logo_negocio_anon_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'logo-negocio');

create policy "logo_negocio_anon_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'logo-negocio');
