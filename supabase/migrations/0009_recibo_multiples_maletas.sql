-- Un mismo número de recibo físico puede cubrir varias maletas del mismo
-- cliente; cada maleta sigue siendo su propia orden (estado, técnico,
-- fotos y comprobante independientes), pero ya no exigimos que el
-- número de recibo sea único entre órdenes.
alter table ordenes drop constraint if exists ordenes_numero_recibo_key;
