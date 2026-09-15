-- Esquema para el control de asistencia de caminantes

CREATE TABLE IF NOT EXISTS asistencia_caminantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caminante_id UUID NOT NULL UNIQUE REFERENCES caminantes(id) ON DELETE CASCADE,
  llego BOOLEAN NOT NULL DEFAULT FALSE,
  llegada_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asistencia_caminante_id ON asistencia_caminantes(caminante_id);

DROP TRIGGER IF EXISTS update_asistencia_caminantes_updated_at ON asistencia_caminantes;
CREATE TRIGGER update_asistencia_caminantes_updated_at
BEFORE UPDATE ON asistencia_caminantes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Esquema para el control de asistencia de servidores

CREATE TABLE IF NOT EXISTS asistencia_servidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL UNIQUE REFERENCES servidores(id) ON DELETE CASCADE,
  llego BOOLEAN NOT NULL DEFAULT FALSE,
  llegada_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asistencia_servidor_id ON asistencia_servidores(servidor_id);

DROP TRIGGER IF EXISTS update_asistencia_servidores_updated_at ON asistencia_servidores;
CREATE TRIGGER update_asistencia_servidores_updated_at
BEFORE UPDATE ON asistencia_servidores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
