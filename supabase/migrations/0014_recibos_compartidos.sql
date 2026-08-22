-- Bucket para las imágenes del recibo que se generan al compartir por
-- WhatsApp: el link de wa.me solo puede llevar texto (no un archivo
-- adjunto), así que subimos la imagen y metemos su URL pública dentro
-- del mensaje — WhatsApp la muestra como vista previa en el chat.
insert into storage.buckets (id, name, public)
values ('recibos-compartidos', 'recibos-compartidos', true)
on conflict (id) do nothing;

create policy "recibos_compartidos_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'recibos-compartidos');

create policy "recibos_compartidos_anon_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'recibos-compartidos');
