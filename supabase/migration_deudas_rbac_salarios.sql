-- ============================================================
-- Finanzas360 — Migración: Deudas + RBAC + Salarios
-- INSTRUCCIONES: Pegá y ejecutá en Supabase → SQL Editor → Run
-- El script es idempotente (se puede ejecutar más de una vez).
-- ============================================================


-- ============================================================
-- SECCIÓN 1 — DEUDAS
-- ============================================================

CREATE TABLE IF NOT EXISTS deudas (
  id          UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  acreedor    TEXT           NOT NULL,
  descripcion TEXT,
  monto       NUMERIC(15, 2) NOT NULL CHECK (monto > 0),
  vencimiento DATE           NOT NULL,
  estado      TEXT           DEFAULT 'Pendiente'
              CHECK (estado IN ('Pendiente', 'Pagada', 'Vencida')),
  notas       TEXT,
  created_at  TIMESTAMPTZ    DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deudas_estado      ON deudas(estado);
CREATE INDEX IF NOT EXISTS idx_deudas_vencimiento ON deudas(vencimiento);

DROP TRIGGER IF EXISTS trigger_deudas_updated_at ON deudas;
CREATE TRIGGER trigger_deudas_updated_at
  BEFORE UPDATE ON deudas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE deudas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON deudas;
CREATE POLICY "Allow all for anon" ON deudas
  FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- SECCIÓN 2 — RBAC (roles y usuarios de la aplicación)
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT        NOT NULL UNIQUE,
  descripcion TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT        NOT NULL UNIQUE,
  nombre     TEXT        NOT NULL,
  rol_id     UUID        REFERENCES roles(id) ON DELETE SET NULL,
  estado     TEXT        DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado  ON usuarios(estado);

DROP TRIGGER IF EXISTS trigger_usuarios_updated_at ON usuarios;
CREATE TRIGGER trigger_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE roles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON roles;
CREATE POLICY "Allow all for anon" ON roles
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon" ON usuarios;
CREATE POLICY "Allow all for anon" ON usuarios
  FOR ALL USING (true) WITH CHECK (true);

-- Roles seed
INSERT INTO roles (nombre, descripcion) VALUES
  ('Dirección', 'Acceso completo al sistema'),
  ('Financiero', 'Acceso al módulo financiero')
ON CONFLICT (nombre) DO NOTHING;


-- ============================================================
-- SECCIÓN 3 — ESTRUCTURA SALARIAL
-- ============================================================

CREATE TABLE IF NOT EXISTS empleados (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre            TEXT        NOT NULL,
  apellido          TEXT        NOT NULL,
  email             TEXT        UNIQUE,
  telefono          TEXT,
  tipo_permanencia  TEXT        NOT NULL
                    CHECK (tipo_permanencia IN ('Planta', 'Temporal')),
  modalidad_trabajo TEXT        NOT NULL
                    CHECK (modalidad_trabajo IN ('Mensual', 'Por Turno', 'Por Horas')),
  fecha_ingreso     DATE,
  estado            TEXT        DEFAULT 'Activo'
                    CHECK (estado IN ('Activo', 'Inactivo')),
  tipo_salario      TEXT        DEFAULT 'mensual'
                    CHECK (tipo_salario IN ('mensual', 'hora', 'turno')),
  monto_base        NUMERIC(12, 2) DEFAULT 0 CHECK (monto_base >= 0),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias_salariales (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT        NOT NULL UNIQUE,
  descripcion TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movimientos_salario (
  id           UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id  UUID           NOT NULL REFERENCES empleados(id)             ON DELETE CASCADE,
  categoria_id UUID           NOT NULL REFERENCES categorias_salariales(id) ON DELETE RESTRICT,
  monto        NUMERIC(12, 2) NOT NULL,
  fecha        DATE           NOT NULL,
  descripcion  TEXT,
  created_at   TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empleados_estado       ON empleados(estado);
CREATE INDEX IF NOT EXISTS idx_empleados_tipo_salario ON empleados(tipo_salario);
CREATE INDEX IF NOT EXISTS idx_mov_sal_empleado_id    ON movimientos_salario(empleado_id);
CREATE INDEX IF NOT EXISTS idx_mov_sal_categoria_id   ON movimientos_salario(categoria_id);
CREATE INDEX IF NOT EXISTS idx_mov_sal_fecha          ON movimientos_salario(fecha);

DROP TRIGGER IF EXISTS trigger_empleados_updated_at ON empleados;
CREATE TRIGGER trigger_empleados_updated_at
  BEFORE UPDATE ON empleados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE empleados             ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_salariales ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_salario   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON empleados;
CREATE POLICY "Allow all for anon" ON empleados
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon" ON categorias_salariales;
CREATE POLICY "Allow all for anon" ON categorias_salariales
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon" ON movimientos_salario;
CREATE POLICY "Allow all for anon" ON movimientos_salario
  FOR ALL USING (true) WITH CHECK (true);

-- Categorías salariales seed
INSERT INTO categorias_salariales (nombre, descripcion) VALUES
  ('Sueldo Base',     'Salario mensual base acordado con el empleado'),
  ('Horas Extra',     'Pago por horas trabajadas fuera del horario habitual'),
  ('Bono',            'Bonificación por desempeño o resultados'),
  ('Descuento',       'Descuento aplicado al salario bruto'),
  ('Aporte Patronal', 'Contribución del empleador a cargas sociales'),
  ('Otros',           'Otros conceptos salariales')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
