-- El número de recibo de las órdenes ahora se asigna solo (consecutivo),
-- en vez de que el taller tenga que escribirlo. Arranca en 2 porque la
-- orden #1 ya existe.
create sequence ordenes_numero_recibo_seq start 2;

alter table ordenes
  alter column numero_recibo set default nextval('ordenes_numero_recibo_seq')::text;
