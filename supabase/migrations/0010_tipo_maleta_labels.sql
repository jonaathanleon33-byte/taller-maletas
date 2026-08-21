-- Reemplaza las opciones de tipo de maleta (rígida/tela/mochila/maletín)
-- por las que usa el taller: fibra/lona/morral/maletín/estuche.
-- Mapeo de datos existentes: rígida→fibra, tela→lona, mochila→morral,
-- maletín→maletín (sin cambio). "Estuche" queda disponible para nuevas
-- órdenes, no había equivalente previo.
alter type tipo_enum rename to tipo_enum_old;

create type tipo_enum as enum ('fibra', 'lona', 'morral', 'maletin', 'estuche');

alter table ordenes alter column tipo type tipo_enum using (
  case tipo::text
    when 'rigida' then 'fibra'
    when 'tela' then 'lona'
    when 'mochila' then 'morral'
    when 'maletin' then 'maletin'
    else 'estuche'
  end
)::tipo_enum;

drop type tipo_enum_old;
