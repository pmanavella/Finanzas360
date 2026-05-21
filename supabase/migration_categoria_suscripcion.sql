-- ============================================================
-- Finanzas360 — Migración: Agregar 'Suscripción' al CHECK de movimientos.categoria
-- INSTRUCCIONES: Pegá y ejecutá en Supabase → SQL Editor → Run
-- Es segura para ejecutar una sola vez. No modifica ni borra registros existentes.
-- ============================================================

-- 1. Eliminar el constraint anterior (que no incluía 'Suscripción')
ALTER TABLE movimientos
  DROP CONSTRAINT IF EXISTS movimientos_categoria_check;

-- 2. Recrearlo con la lista completa de categorías, incluyendo 'Suscripción'
ALTER TABLE movimientos
  ADD CONSTRAINT movimientos_categoria_check
  CHECK (
    categoria IN (
      'Tecnología',
      'RRHH',
      'Insumos',
      'Servicios',
      'Inversión',
      'Suscripción',
      'Otros'
    )
  );

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
