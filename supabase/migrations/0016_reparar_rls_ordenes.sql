-- Las políticas de acceso público (anon) sobre ordenes/fotos/historial
-- dejaron de estar activas (probablemente se perdieron al recrear el
-- tipo estado_enum en la migración anterior). Las volvemos a crear
-- exactamente como en el esquema original.
drop policy if exists "ordenes_anon_all" on ordenes;
create policy "ordenes_anon_all" on ordenes
  for all to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "fotos_anon_all" on fotos;
create policy "fotos_anon_all" on fotos
  for all to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "historial_anon_select" on historial_estados;
create policy "historial_anon_select" on historial_estados
  for select to anon, authenticated
  using (true);
