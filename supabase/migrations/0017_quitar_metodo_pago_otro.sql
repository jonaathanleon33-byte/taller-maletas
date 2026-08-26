-- Se quita 'otro' de los métodos de pago (no hay ningún comprobante
-- guardado con ese valor). Métodos de pago finales: efectivo,
-- tarjeta, transferencia, pago_al_recoger.
alter table comprobantes alter column metodo_pago drop default;

alter type metodo_pago_enum rename to metodo_pago_enum_old;

create type metodo_pago_enum as enum (
  'efectivo',
  'tarjeta',
  'transferencia',
  'pago_al_recoger'
);

alter table comprobantes alter column metodo_pago type metodo_pago_enum using (
  case metodo_pago::text
    when 'otro' then 'efectivo'
    else metodo_pago::text
  end
)::metodo_pago_enum;

alter table comprobantes alter column metodo_pago set default 'efectivo'::metodo_pago_enum;

drop type metodo_pago_enum_old;
