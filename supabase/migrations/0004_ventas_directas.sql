-- ============================================================
-- Ventas directas: permite crear un comprobante sin una orden de
-- reparación asociada (ej: venta de una maleta, cobro de domicilio),
-- cargando el cliente a mano en el comprobante mismo.
-- ============================================================

alter table comprobantes
  alter column orden_id drop not null;

alter table comprobantes
  add column cliente_nombre text,
  add column cliente_telefono text;

-- Un comprobante debe tener orden_id (venta ligada a una reparación)
-- o cliente_nombre + cliente_telefono (venta directa), nunca ninguno.
alter table comprobantes
  add constraint comprobantes_cliente_o_orden check (
    orden_id is not null
    or (cliente_nombre is not null and cliente_telefono is not null)
  );
