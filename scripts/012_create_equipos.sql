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
  ('Coordinador del retiro', 'Coordinación general del retiro'),
  ('Mesa de Registro', 'Registro y apoyo de ingreso al retiro'),
  ('Logistica', 'Logística y organización general'),
  ('Cocina/Snacks', 'Preparación y distribución de alimentos y snacks'),
  ('Apoyo de mesas', 'Acompañamiento y soporte operativo a mesas'),
  ('Líderes y colíderes', 'Líderes y colíderes de mesas'),
  ('Santísimo / Oración', 'Acompañamiento espiritual y oración'),
  ('Rosario', 'Organización y guía del rosario'),
  ('Música', 'Música y ambientación del retiro'),
  ('Palanquitas', 'Coordinación de palanquitas'),
  ('Cartas', 'Gestión de cartas para caminantes'),
  ('Despertar de caminantes', 'Apoyo en la dinámica de despertar de caminantes'),
  ('Fotografía', 'Cobertura fotográfica del retiro'),
  ('Sacerdotes', 'Coordinación y apoyo a sacerdotes'),
  ('Salones', 'Preparación y logística de salones'),
  ('Lavado de manos', 'Coordinación de la dinámica de lavado de manos'),
  ('Lavatorio de pies', 'Coordinación de la dinámica de lavatorio de pies'),
  ('Sanación de recuerdos', 'Apoyo en la dinámica de sanación de recuerdos'),
  ('Carta de pecados', 'Coordinación de la dinámica carta de pecados'),
  ('Quema de pecados', 'Coordinación de la dinámica de quema de pecados'),
  ('Imposición de cenizas', 'Coordinación de la dinámica de imposición de cenizas'),
  ('Resumen', 'Responsable de la dinámica de resumen'),
  ('Mantelitos', 'Preparación y entrega de mantelitos'),
  ('Carta de Jesús', 'Coordinación de la dinámica carta de Jesús'),
  ('Pared', 'Coordinación de la dinámica de la pared'),
  ('Abrazos', 'Coordinación de la dinámica de abrazos'),
  ('Entrega de biblias', 'Organización de entrega de biblias'),
  ('Campanero', 'Responsable de campana y tiempos'),
  ('Minuto a minuto', 'Seguimiento operativo del minuto a minuto'),
  ('Camino de Emaús (Explicación)', 'Responsable de explicación Camino de Emaús'),
  ('El abrazo / La vela (Explicación)', 'Responsable de explicación El abrazo y La vela'),
  ('La Rosa (Explicación)', 'Responsable de explicación La Rosa'),
  ('Lema de Emáus (Explicación)', 'Responsable de explicación del lema de Emaús'),
  ('Oración al Espíritu Santo (Oración)', 'Responsable de oración al Espíritu Santo')
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
