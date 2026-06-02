-- =============================================================================
-- QA — VALIDACIÓN DE BASE DE DATOS
-- Proyecto: Finanzas360 MVP
-- Base:     Supabase / PostgreSQL
-- Modo:     Solo lectura — ninguna instrucción modifica datos
-- Uso:      Ejecutar cada bloque por separado en Supabase SQL Editor
-- =============================================================================


-- =============================================================================
-- BLOQUE 1 — PERSISTENCIA
-- Verifica que existan movimientos registrados con sus campos obligatorios.
-- =============================================================================

-- 1.1  Total de movimientos en la tabla
SELECT
  COUNT(*)                          AS total_movimientos,
  MIN(fecha)                        AS fecha_mas_antigua,
  MAX(fecha)                        AS fecha_mas_reciente
FROM movimientos;

-- ─────────────────────────────────────────────────────────────────────────────

-- 1.2  Cantidad de movimientos por tipo
--      Esperado: al menos un registro por tipo usado (Ingreso, Gasto, Salario)
SELECT
  tipo,
  COUNT(*)   AS cantidad,
  SUM(monto) AS total_monto
FROM movimientos
GROUP BY tipo
ORDER BY cantidad DESC;

-- ─────────────────────────────────────────────────────────────────────────────

-- 1.3  Movimientos que tienen todos los campos obligatorios completos
--      Checklist: el resultado debe coincidir con el total de 1.1
SELECT
  COUNT(*) AS movimientos_completos
FROM movimientos
WHERE
  fecha        IS NOT NULL
  AND descripcion IS NOT NULL AND descripcion <> ''
  AND tipo        IS NOT NULL AND tipo        <> ''
  AND monto       IS NOT NULL AND monto       >  0;

-- ─────────────────────────────────────────────────────────────────────────────

-- 1.4  Últimos 10 movimientos registrados (más recientes por fecha)
SELECT
  id,
  fecha,
  tipo,
  categoria,
  descripcion,
  monto
FROM movimientos
ORDER BY fecha DESC, created_at DESC
LIMIT 10;


-- =============================================================================
-- BLOQUE 2 — ACTUALIZACIÓN
-- Verifica que el campo updated_at se popula al modificar un registro.
-- No modifica datos — solo lee el estado actual.
-- =============================================================================

-- 2.1  Movimientos que tienen updated_at poblado
SELECT
  COUNT(*) AS movimientos_con_updated_at
FROM movimientos
WHERE updated_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────

-- 2.2  Movimientos que fueron modificados después de su creación
--      (updated_at posterior a created_at indica que el registro fue editado)
SELECT
  COUNT(*) AS movimientos_modificados
FROM movimientos
WHERE
  updated_at IS NOT NULL
  AND updated_at > created_at;

-- ─────────────────────────────────────────────────────────────────────────────

-- 2.3  Detalle de los últimos 5 movimientos modificados
SELECT
  id,
  fecha,
  tipo,
  descripcion,
  monto,
  created_at,
  updated_at,
  ROUND(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60, 1) AS minutos_entre_creacion_y_edicion
FROM movimientos
WHERE updated_at IS NOT NULL AND updated_at > created_at
ORDER BY updated_at DESC
LIMIT 5;

-- ─────────────────────────────────────────────────────────────────────────────

-- 2.4  Usuarios que tienen updated_at poblado
SELECT
  COUNT(*) AS usuarios_con_updated_at
FROM usuarios
WHERE updated_at IS NOT NULL;


-- =============================================================================
-- BLOQUE 3 — ELIMINACIÓN LÓGICA
-- Valida que el borrado lógico funciona: el registro sigue en la tabla
-- pero queda marcado con estado, deleted_at y deleted_by.
-- No se borra nada — solo lectura.
-- =============================================================================

-- 3.1  Distribución de usuarios por estado
--      Esperado: al menos un estado 'Activo'. Los eliminados aparecen como 'Inactivo' u otro valor.
SELECT
  estado,
  COUNT(*) AS cantidad
FROM usuarios
GROUP BY estado
ORDER BY cantidad DESC;

-- ─────────────────────────────────────────────────────────────────────────────

-- 3.2  Usuarios con eliminación lógica aplicada (deleted_at poblado)
--      Si el borrado lógico funciona: existen filas con deleted_at <> NULL
SELECT
  id,
  email,
  nombre,
  estado,
  deleted_at,
  deleted_by
FROM usuarios
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- ─────────────────────────────────────────────────────────────────────────────

-- 3.3  Verificar que los usuarios eliminados lógicamente NO fueron borrados físicamente
--      Checklist: si el conteo es mayor a 0, el borrado lógico funciona correctamente
SELECT
  COUNT(*) AS usuarios_eliminados_logicamente_aun_en_tabla
FROM usuarios
WHERE deleted_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────

-- 3.4  Usuarios activos vs eliminados — resumen
SELECT
  CASE
    WHEN deleted_at IS NOT NULL THEN 'Eliminado lógicamente'
    ELSE 'Activo / Sin eliminar'
  END                AS condicion,
  COUNT(*)           AS cantidad
FROM usuarios
GROUP BY condicion;


-- =============================================================================
-- BLOQUE 4 — TRAZABILIDAD
-- Verifica que los campos de auditoría estén correctamente poblados.
-- =============================================================================

-- 4.1  Trazabilidad en movimientos
--      Muestra cuántos registros tienen cada campo de auditoría poblado
SELECT
  COUNT(*)                                          AS total,
  COUNT(created_at)                                 AS con_created_at,
  COUNT(updated_at)                                 AS con_updated_at,
  COUNT(created_by)                                 AS con_created_by,
  COUNT(*) - COUNT(created_at)                      AS sin_created_at,
  COUNT(*) - COUNT(updated_at)                      AS sin_updated_at,
  COUNT(*) - COUNT(created_by)                      AS sin_created_by
FROM movimientos;

-- ─────────────────────────────────────────────────────────────────────────────

-- 4.2  Movimientos con trazabilidad incompleta
--      Checklist: idealmente este SELECT devuelve 0 filas
SELECT
  id,
  fecha,
  tipo,
  descripcion,
  CASE WHEN created_at IS NULL THEN 'FALTA created_at'  ELSE NULL END AS alerta_created_at,
  CASE WHEN created_by IS NULL THEN 'FALTA created_by'  ELSE NULL END AS alerta_created_by
FROM movimientos
WHERE
  created_at IS NULL
  OR created_by IS NULL
ORDER BY fecha DESC;

-- ─────────────────────────────────────────────────────────────────────────────

-- 4.3  Trazabilidad completa en usuarios
SELECT
  COUNT(*)                                  AS total,
  COUNT(created_at)                         AS con_created_at,
  COUNT(updated_at)                         AS con_updated_at,
  COUNT(created_by)                         AS con_created_by,
  COUNT(updated_by)                         AS con_updated_by,
  COUNT(deleted_at)                         AS con_deleted_at,
  COUNT(deleted_by)                         AS con_deleted_by
FROM usuarios;

-- ─────────────────────────────────────────────────────────────────────────────

-- 4.4  Usuarios con trazabilidad de eliminación inconsistente
--      Caso A: tiene deleted_at pero no deleted_by (o viceversa)
--      Checklist: idealmente 0 filas
SELECT
  id,
  email,
  nombre,
  estado,
  deleted_at,
  deleted_by,
  CASE
    WHEN deleted_at IS NOT NULL AND deleted_by IS NULL THEN 'Tiene deleted_at sin deleted_by'
    WHEN deleted_at IS NULL     AND deleted_by IS NOT NULL THEN 'Tiene deleted_by sin deleted_at'
  END AS inconsistencia
FROM usuarios
WHERE
  (deleted_at IS NOT NULL AND deleted_by IS NULL)
  OR (deleted_at IS NULL  AND deleted_by IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────────────────

-- 4.5  Últimos 10 movimientos con trazabilidad completa (referencia)
SELECT
  id,
  fecha,
  tipo,
  descripcion,
  monto,
  created_at,
  created_by,
  updated_at
FROM movimientos
ORDER BY created_at DESC
LIMIT 10;


-- =============================================================================
-- BLOQUE 5 — CONSISTENCIA
-- Detecta datos potencialmente incorrectos sin modificar nada.
-- =============================================================================

-- 5.1  Movimientos con monto inválido (nulo, cero o negativo)
--      Checklist: idealmente 0 filas
SELECT
  id,
  fecha,
  tipo,
  descripcion,
  monto,
  CASE
    WHEN monto IS NULL THEN 'Monto nulo'
    WHEN monto  = 0   THEN 'Monto cero'
    WHEN monto  < 0   THEN 'Monto negativo'
  END AS problema
FROM movimientos
WHERE
  monto IS NULL
  OR monto = 0
  OR monto < 0;

-- ─────────────────────────────────────────────────────────────────────────────

-- 5.2  Movimientos con campos estructurales faltantes
--      Checklist: idealmente 0 filas
SELECT
  id,
  fecha,
  tipo,
  descripcion,
  monto,
  CASE
    WHEN fecha       IS NULL              THEN 'Sin fecha'
    WHEN descripcion IS NULL OR descripcion = '' THEN 'Sin descripción'
    WHEN tipo        IS NULL OR tipo        = '' THEN 'Sin tipo'
    ELSE NULL
  END AS problema
FROM movimientos
WHERE
  fecha IS NULL
  OR descripcion IS NULL OR descripcion = ''
  OR tipo        IS NULL OR tipo        = '';

-- ─────────────────────────────────────────────────────────────────────────────

-- 5.3  Todos los valores distintos de tipo cargados en movimientos
--      Referencia: qué tipos existen realmente en la base
SELECT DISTINCT tipo, COUNT(*) AS cantidad
FROM movimientos
GROUP BY tipo
ORDER BY tipo;

-- ─────────────────────────────────────────────────────────────────────────────

-- 5.4  Validación contable: Ingresos vs Egresos del mes actual
--      Los movimientos tipo Salario se cuentan como egreso (igual que Gasto)
SELECT
  CASE
    WHEN tipo = 'Ingreso'              THEN 'Ingreso'
    WHEN tipo IN ('Gasto', 'Salario')  THEN 'Egreso'
    ELSE tipo
  END                                  AS clasificacion_contable,
  COUNT(*)                             AS cantidad,
  SUM(monto)                           AS total_monto
FROM movimientos
WHERE
  DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY clasificacion_contable
ORDER BY clasificacion_contable;

-- ─────────────────────────────────────────────────────────────────────────────

-- 5.5  Balance neto del mes actual
--      Ingreso total − Egreso total (Gasto + Salario)
SELECT
  SUM(CASE WHEN tipo = 'Ingreso'             THEN monto ELSE 0 END) AS total_ingresos,
  SUM(CASE WHEN tipo IN ('Gasto','Salario')  THEN monto ELSE 0 END) AS total_egresos,
  SUM(CASE WHEN tipo = 'Ingreso'             THEN monto ELSE 0 END)
  - SUM(CASE WHEN tipo IN ('Gasto','Salario') THEN monto ELSE 0 END) AS balance_neto
FROM movimientos
WHERE
  DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE);

-- ─────────────────────────────────────────────────────────────────────────────

-- 5.6  Total acumulado histórico por clasificación contable
SELECT
  CASE
    WHEN tipo = 'Ingreso'             THEN 'Ingreso'
    WHEN tipo IN ('Gasto','Salario')  THEN 'Egreso'
    ELSE tipo
  END              AS clasificacion_contable,
  COUNT(*)         AS cantidad,
  SUM(monto)       AS total_monto
FROM movimientos
GROUP BY clasificacion_contable
ORDER BY clasificacion_contable;


-- =============================================================================
-- FIN DEL ARCHIVO — qa_validacion_db.sql
-- Todos los bloques son de solo lectura (SELECT).
-- Ninguna instrucción modifica, inserta ni elimina datos.
-- =============================================================================
