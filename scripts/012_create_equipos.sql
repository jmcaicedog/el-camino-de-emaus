-- Crear tabla de equipos
CREATE TABLE IF NOT EXISTS equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de relación muchos a muchos entre servidores y equipos
CREATE TABLE IF NOT EXISTS servidor_equipo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES servidores(id) ON DELETE CASCADE,
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(servidor_id, equipo_id)
);

-- Insertar los equipos predefinidos
INSERT INTO equipos (nombre, descripcion) VALUES
  ('Líderes y colíderes', 'Líderes y colíderes de mesas'),
  ('Logística', 'Equipo de logística y organización'),
  ('Palanquitas', 'Equipo de palanquitas'),
  ('Snacks', 'Equipo de snacks y refrigerios'),
  ('Registro', 'Equipo de registro y documentación'),
  ('Música', 'Equipo de música y alabanza'),
  ('Cartas', 'Equipo de cartas para caminantes'),
  ('Santísimo', 'Equipo del Santísimo Sacramento')
ON CONFLICT (nombre) DO NOTHING;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_servidor_equipo_servidor ON servidor_equipo(servidor_id);
CREATE INDEX IF NOT EXISTS idx_servidor_equipo_equipo ON servidor_equipo(equipo_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servidor_equipo ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para equipos
CREATE POLICY "Equipos son visibles para usuarios autenticados"
  ON equipos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden modificar equipos"
  ON equipos FOR ALL
  TO authenticated
  USING (true);

-- Políticas de acceso para servidor_equipo
CREATE POLICY "Relaciones servidor-equipo visibles para autenticados"
  ON servidor_equipo FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden modificar relaciones servidor-equipo"
  ON servidor_equipo FOR ALL
  TO authenticated
  USING (true);
