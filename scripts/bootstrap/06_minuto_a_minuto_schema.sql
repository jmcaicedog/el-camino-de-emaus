-- Esquema para la funcionalidad Minuto a Minuto (Agenda del Retiro)

CREATE TABLE IF NOT EXISTS minuto_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  ubicacion TEXT,
  requerimientos TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ NOT NULL,
  color TEXT NOT NULL DEFAULT 'sky',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_minuto_evento_fechas CHECK (fecha_fin >= fecha_inicio)
);

CREATE TABLE IF NOT EXISTS minuto_evento_responsables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES minuto_eventos(id) ON DELETE CASCADE,
  tipo_responsable TEXT NOT NULL CHECK (tipo_responsable IN ('servidor', 'equipo', 'todos')),
  servidor_id UUID REFERENCES servidores(id) ON DELETE CASCADE,
  equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_responsable_target CHECK (
    (tipo_responsable = 'servidor' AND servidor_id IS NOT NULL AND equipo_id IS NULL) OR
    (tipo_responsable = 'equipo' AND equipo_id IS NOT NULL AND servidor_id IS NULL) OR
    (tipo_responsable = 'todos' AND servidor_id IS NULL AND equipo_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_minuto_eventos_inicio ON minuto_eventos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_minuto_eventos_fin ON minuto_eventos(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_minuto_resp_evento ON minuto_evento_responsables(evento_id);
CREATE INDEX IF NOT EXISTS idx_minuto_resp_servidor ON minuto_evento_responsables(servidor_id);
CREATE INDEX IF NOT EXISTS idx_minuto_resp_equipo ON minuto_evento_responsables(equipo_id);

DROP TRIGGER IF EXISTS update_minuto_eventos_updated_at ON minuto_eventos;
CREATE TRIGGER update_minuto_eventos_updated_at
BEFORE UPDATE ON minuto_eventos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE minuto_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE minuto_evento_responsables ENABLE ROW LEVEL SECURITY;

-- PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
