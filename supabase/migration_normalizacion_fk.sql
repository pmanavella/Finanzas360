-- ============================================================
-- Finanzas360 — Migración: Normalización FK (deudas + cotizaciones)
-- INSTRUCCIONES: Pegá y ejecutá en Supabase → SQL Editor → Run
-- El script es idempotente (ADD COLUMN IF NOT EXISTS).
-- No elimina datos, no modifica columnas existentes.
-- Todas las FK son nullable con ON DELETE SET NULL.
-- ============================================================


-- ============================================================
-- SECCIÓN 1 — movimientos.deuda_id
-- Vincula un movimiento (pago/gasto) a la deuda que lo origina.
-- Nullable: los movimientos existentes no se ven afectados.
-- ============================================================

ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS deuda_id UUID REFERENCES deudas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_movimientos_deuda_id ON movimientos(deuda_id);


-- ============================================================
-- SECCIÓN 2 — movimientos.cotizacion_id
-- Referencia a la cotización del dólar usada al convertir
-- el monto de una suscripción USD a ARS.
-- Complementa los campos de snapshot ya existentes (no los reemplaza).
-- ============================================================

ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS cotizacion_id UUID REFERENCES cotizaciones_dolar(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_movimientos_cotizacion_id ON movimientos(cotizacion_id);


-- ============================================================
-- SECCIÓN 3 — movimientos_salario.cotizacion_id
-- Referencia a la cotización usada al liquidar un salario USD.
-- Los campos snapshot (cotizacion_usada, cotizacion_tipo, etc.)
-- se mantienen para trazabilidad histórica exacta.
-- ============================================================

ALTER TABLE movimientos_salario
  ADD COLUMN IF NOT EXISTS cotizacion_id UUID REFERENCES cotizaciones_dolar(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mov_sal_cotizacion_id ON movimientos_salario(cotizacion_id);


-- ============================================================
-- VERIFICACIÓN (opcional — ejecutar para confirmar)
-- ============================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'movimientos'
--   AND column_name IN ('deuda_id', 'cotizacion_id');
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'movimientos_salario'
--   AND column_name = 'cotizacion_id';

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
