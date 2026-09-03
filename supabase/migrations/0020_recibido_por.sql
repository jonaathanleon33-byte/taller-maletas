-- Registra qué persona del taller recibió la maleta (distinto del
-- técnico asignado a repararla).
alter table ordenes add column recibido_por text;
