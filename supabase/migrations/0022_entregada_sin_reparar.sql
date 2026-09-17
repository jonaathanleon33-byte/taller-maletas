-- Nuevo estado para cuando el cliente se lleva la maleta sin que se
-- haya reparado (se arrepintió, no se pudo arreglar, etc.), distinto
-- de "entregada" (reparada y entregada).
alter type estado_enum add value 'entregada_sin_reparar';

-- El trigger que completa fecha_entregada automáticamente solo
-- miraba 'entregada'; ahora también lo hace para este nuevo estado.
create or replace function registrar_historial_estado_update()
returns trigger as $$
begin
  if new.estado is distinct from old.estado then
    insert into historial_estados (orden_id, estado_anterior, estado_nuevo)
    values (new.id, old.estado, new.estado);

    if new.estado in ('entregada', 'entregada_sin_reparar') and new.fecha_entregada is null then
      new.fecha_entregada = now();
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
