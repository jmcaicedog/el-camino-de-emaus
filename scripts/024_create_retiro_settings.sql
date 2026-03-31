-- Configuración global del retiro (single row)

CREATE TABLE IF NOT EXISTS retiro_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  retiro_datetime TIMESTAMPTZ NOT NULL DEFAULT '2026-04-10 16:00:00-05',
  logo_url TEXT,
  mesas_count INTEGER NOT NULL DEFAULT 12,
  caminantes_por_mesa INTEGER NOT NULL DEFAULT 7,
  max_caminantes INTEGER NOT NULL DEFAULT 65,
  costo_servidor NUMERIC(10, 2) NOT NULL DEFAULT 400000,
  costo_caminante NUMERIC(10, 2) NOT NULL DEFAULT 490000,
  countdown_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO retiro_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS update_retiro_settings_updated_at ON retiro_settings;
CREATE TRIGGER update_retiro_settings_updated_at
  BEFORE UPDATE ON retiro_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE retiro_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_retiro_settings" ON retiro_settings;
DROP POLICY IF EXISTS "superadmin_update_retiro_settings" ON retiro_settings;

-- Cualquier usuario puede leer esta configuración pública
CREATE POLICY "public_select_retiro_settings"
ON retiro_settings
FOR SELECT
USING (true);

-- Solo superadmin puede actualizar
CREATE POLICY "superadmin_update_retiro_settings"
ON retiro_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
      AND admin_users.is_super = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
      AND admin_users.is_super = true
  )
);
