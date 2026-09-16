-- Se retira la opción de "ubicación en el taller" al crear la orden
-- (no se va a implementar). La columna queda, para no perder el dato
-- de las órdenes que ya lo tenían, pero deja de ser obligatoria.
alter table ordenes alter column ubicacion drop not null;
