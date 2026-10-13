-- OPCIONAL — ejecutar a mano en el SQL Editor de Supabase.
--
-- Hoy cualquiera con la clave pública (anon) puede LISTAR todos los
-- archivos de los buckets "recibos-compartidos" y "fotos-ordenes"
-- (859 recibos y las fotos de 633 órdenes), no solo abrir los que
-- tiene el link. Estas políticas permiten ese listado.
--
-- Quitarlas NO rompe los links ya enviados por WhatsApp ni las fotos
-- de las órdenes: en un bucket público las imágenes se siguen sirviendo
-- por su dirección directa (/storage/v1/object/public/...).
--
-- Efecto secundario: al eliminar una orden, borrar sus fotos del
-- Storage dejaría de funcionar (Postgres exige poder "ver" la fila para
-- borrarla); la orden sí se borra, solo quedarían las imágenes
-- huérfanas en el bucket. Subir fotos y recibos nuevos sigue igual.
--
-- Si algún nombre no existe, "if exists" lo ignora. Para ver los
-- nombres reales:
--   select policyname, cmd from pg_policies
--   where schemaname = 'storage' and tablename = 'objects';

drop policy if exists "recibos_compartidos_public_read" on storage.objects;
drop policy if exists "fotos_ordenes_public_read" on storage.objects;
