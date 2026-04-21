-- Migración: agregar soporte de mesas en la Base de Datos

-- 1. Agregar columna tables_count a tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS tables_count INTEGER DEFAULT 0;

-- 2. Crear tabla de asignaciones de mesas en tiempo real
CREATE TABLE IF NOT EXISTS table_assignments (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  table_number INTEGER NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  category_name VARCHAR(255),
  group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
  group_name VARCHAR(100),
  match_id INTEGER NOT NULL,
  match_type VARCHAR(20) DEFAULT 'round-robin' CHECK (match_type IN ('round-robin', 'elimination')),
  p1_name VARCHAR(255),
  p2_name VARCHAR(255),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, table_number)
);

-- 3. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_table_assignments_tournament ON table_assignments(tournament_id);
CREATE INDEX IF NOT EXISTS idx_table_assignments_match ON table_assignments(match_id, match_type);
