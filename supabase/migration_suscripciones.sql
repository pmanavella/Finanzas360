-- ============================================================
-- Finanzas360 — Migración: Suscripciones
-- INSTRUCCIONES: Pegá y ejecutá en Supabase → SQL Editor → Run
-- El script es idempotente (se puede ejecutar más de una vez).
-- ============================================================

-- Tabla principal de suscripciones recurrentes
CREATE TABLE IF NOT EXISTS suscripciones (
  id                  UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre              TEXT           NOT NULL,
  detalle             TEXT,
  proveedor           TEXT,
  monto               NUMERIC(15, 2) NOT NULL CHECK (monto > 0),
  moneda              TEXT           NOT NULL DEFAULT 'ARS'
                      CHECK (moneda IN ('ARS', 'USD')),
  dia_vencimiento     INTEGER        NOT NULL CHECK (dia_vencimiento BETWEEN 1 AND 31),
  frecuencia          TEXT           NOT NULL DEFAULT 'Mensual'
                      CHECK (frecuencia IN ('Mensual', 'Trimestral', 'Semestral', 'Anual')),
  estado              TEXT           NOT NULL DEFAULT 'Activa'
                      CHECK (estado IN ('Activa', 'Pausada', 'Cancelada')),
  ultimo_pago         DATE,
  proximo_vencimiento DATE,
  created_at          TIMESTAMPTZ    DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    DEFAULT NOW(),
  created_by          TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado              ON suscripciones(estado);
CREATE INDEX IF NOT EXISTS idx_suscripciones_proximo_vencimiento ON suscripciones(proximo_vencimiento);

-- Trigger updated_at (reutiliza la función update_updated_at() ya existente)
DROP TRIGGER IF EXISTS trigger_suscripciones_updated_at ON suscripciones;
CREATE TRIGGER trigger_suscripciones_updated_at
  BEFORE UPDATE ON suscripciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON suscripciones;
CREATE POLICY "Allow all for anon" ON suscripciones
  FOR ALL USING (true) WITH CHECK (true);

-- Agregar referencia desde movimientos → suscripciones (solo si no existe)
ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS suscripcion_id UUID REFERENCES suscripciones(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_movimientos_suscripcion_id ON movimientos(suscripcion_id);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
que