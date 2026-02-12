-- Ejecutar esta política en Supabase si la política existente no permite actualizar observaciones
-- Esta política específicamente permite a líderes y colíderes actualizar observaciones

-- Primero, eliminar la política antigua si existe
DROP POLICY IF EXISTS "Servidores pueden actualizar observaciones de su mesa" ON caminantes;

-- Crear nueva política que específicamente permite actualizar el campo observaciones
-- Solo líderes y colíderes pueden hacerlo
CREATE POLICY "Servidores pueden actualizar observaciones de su mesa"
ON caminantes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM servidores
    WHERE servidores.auth_user_id = auth.uid()
    AND servidores.mesa_id = caminantes.mesa_id
    AND servidores.mesa_id IS NOT NULL
    AND (servidores.tipo_servidor = 'lider' OR servidores.tipo_servidor = 'colider')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM servidores
    WHERE servidores.auth_user_id = auth.uid()
    AND servidores.mesa_id = caminantes.mesa_id
    AND servidores.mesa_id IS NOT NULL
    AND (servidores.tipo_servidor = 'lider' OR servidores.tipo_servidor = 'colider')
  )
);
