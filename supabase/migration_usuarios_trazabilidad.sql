-- ============================================================
-- Finanzas360 — Trazabilidad en gestión de usuarios
-- INSTRUCCIONES: Pegá y ejecutá en Supabase → SQL Editor → Run
-- El script es idempotente (se puede ejecutar más de una vez).
-- ============================================================

-- 1. Agregar columnas de auditoría a usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS created_by  TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS updated_by  TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS deleted_by  TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ;

-- 2. Extender el CHECK de estado para soportar soft-delete.
--    Primero se elimina la constraint existente y se recrea con el valor 'Eliminado'.
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_estado_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_estado_check
  CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'));

-- 3. Índice para filtrar usuarios activos/inactivos eficientemente
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);
