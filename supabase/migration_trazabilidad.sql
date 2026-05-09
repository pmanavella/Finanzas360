-- ============================================================
-- Trazabilidad: agregar created_by en tablas principales
-- ============================================================
-- Ejecutar una sola vez en Supabase SQL Editor.
-- Todas las operaciones son idempotentes (IF NOT EXISTS / IF EXISTS).

-- movimientos
ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS created_by TEXT;

-- deudas
ALTER TABLE deudas
  ADD COLUMN IF NOT EXISTS created_by TEXT;

-- comprobantes
ALTER TABLE comprobantes
  ADD COLUMN IF NOT EXISTS created_by TEXT;

-- movimientos_salario
ALTER TABLE movimientos_salario
  ADD COLUMN IF NOT EXISTS created_by TEXT;

-- empleados
ALTER TABLE empleados
  ADD COLUMN IF NOT EXISTS created_by TEXT;

-- categorias_salariales
ALTER TABLE categorias_salariales
  ADD COLUMN IF NOT EXISTS created_by TEXT;

-- movements (tabla alternativa si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'movements') THEN
    ALTER TABLE movements ADD COLUMN IF NOT EXISTS created_by TEXT;
  END IF;
END $$;

-- receipts (tabla alternativa si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipts') THEN
    ALTER TABLE receipts ADD COLUMN IF NOT EXISTS created_by TEXT;
  END IF;
END $$;
