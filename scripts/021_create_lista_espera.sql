-- Crear tabla para lista de espera de caminantes

CREATE TABLE IF NOT EXISTS lista_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo TEXT NOT NULL,
  celular TEXT NOT NULL,
  correo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lista_espera_correo_unique ON lista_espera (lower(correo));
CREATE INDEX IF NOT EXISTS idx_lista_espera_created_at ON lista_espera (created_at DESC);

DROP TRIGGER IF EXISTS update_lista_espera_updated_at ON lista_espera;
CREATE TRIGGER update_lista_espera_updated_at
  BEFORE UPDATE ON lista_espera
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE lista_espera ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_lista_espera" ON lista_espera;
DROP POLICY IF EXISTS "admins_select_lista_espera" ON lista_espera;
DROP POLICY IF EXISTS "admins_delete_lista_espera" ON lista_espera;

-- Permite registro publico en lista de espera
CREATE POLICY "public_insert_lista_espera"
ON lista_espera
FOR INSERT
WITH CHECK (true);

-- Solo admins pueden ver la lista de espera
CREATE POLICY "admins_select_lista_espera"
ON lista_espera
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Solo admins pueden eliminar registros de lista de espera
CREATE POLICY "admins_delete_lista_espera"
ON lista_espera
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);
