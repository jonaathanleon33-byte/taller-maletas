-- Cuándo se envió el SEGUNDO aviso de "maleta lista" (el que trae el
-- plazo de 6 días hábiles, el bodegaje y la destrucción). Desde esta
-- fecha se cuentan los 6 días hábiles (lunes a sábado) tras los cuales
-- se cobra bodegaje, y los 6 meses tras los cuales se manda a destrucción.
alter table ordenes add column segunda_notificacion_en timestamptz;
