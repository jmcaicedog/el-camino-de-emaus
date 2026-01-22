-- Configurar bucket de storage para avatares
-- Nota: Este script debe ejecutarse en el SQL Editor de Supabase

-- Crear bucket 'avatars' si no existe (público para lectura, privado para escritura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- público para lectura
  2097152, -- 2MB en bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Permitir subida pública de avatares" ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura pública de avatares" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización pública de avatares" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación para autenticados" ON storage.objects;

-- Política para permitir CUALQUIER PERSONA subir avatares (INSERT)
-- Esto es necesario para el registro público de caminantes y servidores
CREATE POLICY "Permitir subida pública de avatares"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'avatars');

-- Política para permitir lectura pública de avatares (SELECT)
CREATE POLICY "Permitir lectura pública de avatares"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Política para permitir actualización pública de avatares (UPDATE)
CREATE POLICY "Permitir actualización pública de avatares"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Política para permitir eliminación solo a usuarios autenticados (DELETE)
CREATE POLICY "Permitir eliminación para autenticados"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Verificar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%avatares%'
ORDER BY policyname;
