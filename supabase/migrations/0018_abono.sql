-- Abono: algunos clientes dejan un adelanto al entregar la maleta.
-- Se guarda en el comprobante y se descuenta del total para mostrar
-- el saldo pendiente en el recibo.
alter table comprobantes add column abono numeric(12, 2) not null default 0;
