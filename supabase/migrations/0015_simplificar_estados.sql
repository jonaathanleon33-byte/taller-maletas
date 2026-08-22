-- Simplifica el flujo de estados a Recibida -> Lista -> Entregada,
-- quitando los pasos intermedios "En reparación" y "Esperando
-- repuesto". Las órdenes que estuvieran en alguno de esos dos pasos
-- vuelven a "Recibida" (siguen en el taller, no listas para retirar).
alter table ordenes alter column estado drop default;

alter type estado_enum rename to estado_enum_old;

create type estado_enum as enum ('recibida', 'lista', 'entregada');

alter table ordenes alter column estado type estado_enum using (
  case estado::text
    when 'en_reparacion' then 'recibida'
    when 'esperando_repuesto' then 'recibida'
    else estado::text
  end
)::estado_enum;

alter table ordenes alter column estado set default 'recibida'::estado_enum;

alter table historial_estados alter column estado_anterior type estado_enum using (
  case estado_anterior::text
    when 'en_reparacion' then 'recibida'
    when 'esperando_repuesto' then 'recibida'
    else estado_anterior::text
  end
)::estado_enum;

alter table historial_estados alter column estado_nuevo type estado_enum using (
  case estado_nuevo::text
    when 'en_reparacion' then 'recibida'
    when 'esperando_repuesto' then 'recibida'
    else estado_nuevo::text
  end
)::estado_enum;

drop type estado_enum_old;
