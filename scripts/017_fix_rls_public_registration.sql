-- Arreglar políticas RLS para permitir registro público de servidores

-- Eliminar políticas restrictivas existentes para servidores
DROP POLICY IF EXISTS "Admins can view all servidores" ON servidores;
DROP POLICY IF EXISTS "Admins can insert servidores" ON servidores;
DROP POLICY IF EXISTS "Admins can update servidores" ON servidores;
DROP POLICY IF EXISTS "Admins can delete servidores" ON servidores;
DROP POLICY IF EXISTS "Servidores can view own data" ON servidores;
DROP POLICY IF EXISTS "Allow all for now" ON servidores;
DROP POLICY IF EXISTS "Permitir registro público de servidores" ON servidores;

-- IMPORTANTE: Permitir INSERT público para registro de servidores (sin autenticación)
-- Esta política permite que usuarios anónimos (no autenticados) puedan registrarse
CREATE POLICY "public_insert_servidores"
ON servidores
FOR INSERT
WITH CHECK (true);

-- Permitir a admins ver todos los servidores
CREATE POLICY "Admins pueden ver todos los servidores"
ON servidores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Permitir a admins actualizar servidores
CREATE POLICY "Admins pueden actualizar servidores"
ON servidores
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Permitir a admins eliminar servidores
CREATE POLICY "Admins pueden eliminar servidores"
ON servidores
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Permitir a servidores ver sus propios datos
CREATE POLICY "Servidores pueden ver sus propios datos"
ON servidores
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- También arreglar políticas para caminantes (registro público)
DROP POLICY IF EXISTS "Admins can view all caminantes" ON caminantes;
DROP POLICY IF EXISTS "Admins can insert caminantes" ON caminantes;
DROP POLICY IF EXISTS "Admins can update caminantes" ON caminantes;
DROP POLICY IF EXISTS "Admins can delete caminantes" ON caminantes;
DROP POLICY IF EXISTS "Servidores can view their mesa caminantes" ON caminantes;
DROP POLICY IF EXISTS "Servidores can update tracking for their mesa" ON caminantes;
DROP POLICY IF EXISTS "Allow all for now" ON caminantes;
DROP POLICY IF EXISTS "Permitir registro público de caminantes" ON caminantes;

-- IMPORTANTE: Permitir INSERT público para registro de caminantes (sin autenticación)
-- Esta política permite que usuarios anónimos (no autenticados) puedan registrarse
CREATE POLICY "public_insert_caminantes"
ON caminantes
FOR INSERT
WITH CHECK (true);

-- Permitir a admins ver todos los caminantes
CREATE POLICY "Admins pueden ver todos los caminantes"
ON caminantes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Permitir a admins actualizar caminantes
CREATE POLICY "Admins pueden actualizar caminantes"
ON caminantes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Permitir a admins eliminar caminantes
CREATE POLICY "Admins pueden eliminar caminantes"
ON caminantes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Permitir a servidores ver caminantes de su mesa
CREATE POLICY "Servidores pueden ver caminantes de su mesa"
ON caminantes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM servidores
    WHERE servidores.auth_user_id = auth.uid()
    AND servidores.mesa_id = caminantes.mesa_id
    AND servidores.mesa_id IS NOT NULL
  )
);

-- Permitir a servidores actualizar tracking de caminantes de su mesa
CREATE POLICY "Servidores pueden actualizar tracking de su mesa"
ON caminantes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM servidores
    WHERE servidores.auth_user_id = auth.uid()
    AND servidores.mesa_id = caminantes.mesa_id
    AND servidores.mesa_id IS NOT NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM servidores
    WHERE servidores.auth_user_id = auth.uid()
    AND servidores.mesa_id = caminantes.mesa_id
    AND servidores.mesa_id IS NOT NULL
  )
);
