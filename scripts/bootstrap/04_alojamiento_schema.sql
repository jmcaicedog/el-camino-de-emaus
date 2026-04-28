-- Esquema adicional para la gestión de alojamiento

CREATE TABLE IF NOT EXISTS edificios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edificio_id UUID NOT NULL REFERENCES edificios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  camas_total INTEGER NOT NULL CHECK (camas_total > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (edificio_id, nombre)
);

CREATE TABLE IF NOT EXISTS asignaciones_alojamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habitacion_id UUID NOT NULL REFERENCES habitaciones(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL,
  persona_tipo TEXT NOT NULL CHECK (persona_tipo IN ('caminante', 'servidor')),
  cama_numero INTEGER NOT NULL CHECK (cama_numero > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (habitacion_id, cama_numero),
  UNIQUE (persona_id, persona_tipo)
);

CREATE INDEX IF NOT EXISTS idx_habitaciones_edificio_id ON habitaciones(edificio_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_habitacion_id ON asignaciones_alojamiento(habitacion_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_persona ON asignaciones_alojamiento(persona_tipo, persona_id);

DROP TRIGGER IF EXISTS update_edificios_updated_at ON edificios;
CREATE TRIGGER update_edificios_updated_at
BEFORE UPDATE ON edificios
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_habitaciones_updated_at ON habitaciones;
CREATE TRIGGER update_habitaciones_updated_at
BEFORE UPDATE ON habitaciones
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_asignaciones_alojamiento_updated_at ON asignaciones_alojamiento;
CREATE TRIGGER update_asignaciones_alojamiento_updated_at
BEFORE UPDATE ON asignaciones_alojamiento
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();