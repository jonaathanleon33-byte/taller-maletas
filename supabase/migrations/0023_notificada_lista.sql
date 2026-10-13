-- Cuándo se le avisó al cliente (por WhatsApp) que su maleta ya
-- estaba lista, para mostrarlo en la orden y avisar cuando toque
-- volver a notificarlo si pasan varios días sin que la recoja.
alter table ordenes add column notificada_lista_en timestamptz;
