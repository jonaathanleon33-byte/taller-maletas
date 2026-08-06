-- ============================================================
-- Fix: el trigger de historial fallaba al crear una orden nueva
-- ("violates foreign key constraint historial_estados_orden_id_fkey")
-- porque insertaba en historial_estados desde un BEFORE INSERT, momento
-- en el que la fila de `ordenes` todavía no existe en la tabla.
--
-- Ejecutar en el SQL Editor de Supabase si ya corriste 0001_init.sql.
-- ============================================================

drop trigger if exists ordenes_registrar_historial on ordenes;
drop function if exists registrar_historial_estado();

create or replace function registrar_historial_estado_insert()
returns trigger as $$
begin
  insert into historial_estados (orden_id, estado_anterior, estado_nuevo)
  values (new.id, null, new.estado);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger ordenes_registrar_historial_insert
  after insert on ordenes
  for each row
  execute function registrar_historial_estado_insert();

create or replace function registrar_historial_estado_update()
returns trigger as $$
begin
  if new.estado is distinct from old.estado then
    insert into historial_estados (orden_id, estado_anterior, estado_nuevo)
    values (new.id, old.estado, new.estado);

    if new.estado = 'entregada' and new.fecha_entregada is null then
      new.fecha_entregada = now();
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger ordenes_registrar_historial_update
  before update on ordenes
  for each row
  execute function registrar_historial_estado_update();
