-- ============================================================
-- Unificación de autenticación: usuarios table + JWT
-- ============================================================

-- 1. Agregar columna hashed_password a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS hashed_password TEXT;

-- 2. Insertar el rol 'admin' si no existe
INSERT INTO roles (nombre, descripcion)
VALUES ('admin', 'Administrador del sistema con acceso total')
ON CONFLICT (nombre) DO NOTHING;

-- 3. Insertar roles MVP simplificados (admin ya fue insertado arriba)
INSERT INTO roles (nombre, descripcion)
VALUES
  ('usuario', 'Acceso operativo al sistema financiero'),
  ('lector',  'Acceso de solo lectura al sistema financiero')
ON CONFLICT (nombre) DO NOTHING;

-- 4. Migrar usuarios con roles obsoletos al rol 'usuario'
UPDATE usuarios
SET rol_id = (SELECT id FROM roles WHERE nombre = 'usuario')
WHERE rol_id IN (
  SELECT id FROM roles WHERE nombre IN ('Dirección', 'Financiero', 'Operativo', 'CRM')
);

DROP TABLE IF EXISTS users;
