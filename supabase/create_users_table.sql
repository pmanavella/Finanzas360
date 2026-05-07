-- ============================================================
-- Finanzas360 — Crear tabla users para autenticación
-- INSTRUCCIONES: Pegá y ejecutá en Supabase → SQL Editor → Run
-- Es idempotente (se puede ejecutar más de una vez sin error).
-- ============================================================

-- Tabla de usuarios del sistema (autenticación propia, no Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email           TEXT        NOT NULL UNIQUE,
  nombre          TEXT        NOT NULL,
  hashed_password TEXT        NOT NULL,
  rol             TEXT        NOT NULL DEFAULT 'user'
                  CHECK (rol IN ('admin', 'user')),
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- El service role del backend tiene acceso completo
DROP POLICY IF EXISTS "Service role only" ON users;
CREATE POLICY "Service role only" ON users
  FOR ALL USING (auth.role() = 'service_role');
