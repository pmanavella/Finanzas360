-- ============================================================
-- Finanzas360 - Schema SQL para Supabase
-- Ejecutar este script completo en el SQL Editor de Supabase
-- ============================================================

-- Tabla de movimientos financieros (ingresos y gastos)
CREATE TABLE IF NOT EXISTS movimientos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Tecnología', 'RRHH', 'Insumos', 'Servicios', 'Inversión', 'Otros')),
  tipo TEXT NOT NULL CHECK (tipo IN ('Ingreso', 'Gasto')),
  monto NUMERIC(15, 2) NOT NULL CHECK (monto > 0),
  proveedor_cliente TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de comprobantes digitales
CREATE TABLE IF NOT EXISTS comprobantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movimiento_id UUID REFERENCES movimientos(id) ON DELETE SET NULL,
  nombre_archivo TEXT NOT NULL,
  tipo_archivo TEXT NOT NULL CHECK (tipo_archivo IN ('image/jpeg', 'image/jpg', 'image/png', 'application/pdf')),
  url_archivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  ocr_estado TEXT DEFAULT 'pendiente' CHECK (ocr_estado IN ('pendiente', 'procesado', 'error')),
  ocr_texto TEXT,
  ocr_fecha DATE,
  ocr_monto NUMERIC(15, 2),
  ocr_proveedor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance en consultas
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos(tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_categoria ON movimientos(categoria);
CREATE INDEX IF NOT EXISTS idx_comprobantes_movimiento ON comprobantes(movimiento_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_movimientos_updated_at
  BEFORE UPDATE ON movimientos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobantes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: permitir todo al rol anónimo (para MVP sin auth)
-- En producción, reemplazar con políticas por usuario autenticado
CREATE POLICY "Allow all for anon" ON movimientos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON comprobantes FOR ALL USING (true) WITH CHECK (true);

-- Storage: crear bucket para comprobantes (ejecutar también desde Storage en el dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('comprobantes', 'comprobantes', true);

-- Datos de ejemplo para demo
INSERT INTO movimientos (fecha, descripcion, categoria, tipo, monto, proveedor_cliente) VALUES
  ('2026-04-02', 'Servicio de automatización — Cliente A', 'Servicios', 'Ingreso', 120000, 'Cliente A'),
  ('2026-04-01', 'Servidor AWS — Marzo 2026', 'Tecnología', 'Gasto', 38400, 'AWS'),
  ('2026-03-30', 'Consultoría IA — Cliente B', 'Servicios', 'Ingreso', 85000, 'Cliente B'),
  ('2026-03-29', 'Insumos electrónicos — Proveedor X', 'Insumos', 'Gasto', 54200, 'Proveedor X'),
  ('2026-03-28', 'Aporte de inversión — Guillermo R.', 'Inversión', 'Ingreso', 79500, 'Guillermo R.'),
  ('2026-03-27', 'Honorarios desarrollador — Freelance', 'RRHH', 'Gasto', 65000, 'Freelance'),
  ('2026-03-25', 'Licencias de software', 'Tecnología', 'Gasto', 22100, 'Adobe');
