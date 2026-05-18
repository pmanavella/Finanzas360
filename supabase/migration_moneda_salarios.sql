-- Tabla para guardar cotizaciones del dólar con cache por fecha
CREATE TABLE IF NOT EXISTS cotizaciones_dolar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  fuente TEXT NOT NULL,
  valor_compra NUMERIC(12, 2),
  valor_venta NUMERIC(12, 2),
  valor_unico NUMERIC(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_dolar_fecha ON cotizaciones_dolar(fecha);

-- Campos de moneda y cotización en empleados
ALTER TABLE empleados
  ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS cotizacion_tipo TEXT,
  ADD COLUMN IF NOT EXISTS cotizacion_valor NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS cotizacion_fecha DATE,
  ADD COLUMN IF NOT EXISTS cotizacion_fuente TEXT;

-- Campos de trazabilidad USD en movimientos_salario
ALTER TABLE movimientos_salario
  ADD COLUMN IF NOT EXISTS moneda_origen TEXT DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS monto_origen NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS cotizacion_usada NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS cotizacion_tipo TEXT,
  ADD COLUMN IF NOT EXISTS cotizacion_fecha DATE,
  ADD COLUMN IF NOT EXISTS cotizacion_fuente TEXT,
  ADD COLUMN IF NOT EXISTS monto_ars NUMERIC(12, 2);
