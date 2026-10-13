-- Si el cliente pide facturación electrónica, el total del comprobante
-- incluye el IVA (19 %) sobre el subtotal menos el descuento.
alter table comprobantes add column facturacion_electronica boolean not null default false;
