-- Asignaciones horarias de servidores para Turnos en el Santisimo

CREATE TABLE IF NOT EXISTS turnos_santisimo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES servidores(id) ON DELETE CASCADE,
  turno_inicio TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT turnos_santisimo_servidor_hora_unique UNIQUE (servidor_id, turno_inicio),
  CONSTRAINT turnos_santisimo_hora_completa_check CHECK (
    turno_inicio = date_trunc('hour', turno_inicio)
  )
);

CREATE INDEX IF NOT EXISTS idx_turnos_santisimo_inicio
  ON turnos_santisimo(turno_inicio);

CREATE INDEX IF NOT EXISTS idx_turnos_santisimo_servidor
  ON turnos_santisimo(servidor_id);

ALTER TABLE turnos_santisimo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS turnos_santisimo_select_admin_or_self ON turnos_santisimo;
CREATE POLICY turnos_santisimo_select_admin_or_self
ON turnos_santisimo
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users admin
    WHERE admin.id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM servidores servidor
    WHERE servidor.id = turnos_santisimo.servidor_id
      AND servidor.auth_user_id = (SELECT auth.uid())
  )
);

REVOKE ALL ON TABLE turnos_santisimo FROM anon;
GRANT SELECT ON TABLE turnos_santisimo TO authenticated;
GRANT ALL ON TABLE turnos_santisimo TO service_role;

NOTIFY pgrst, 'reload schema';
