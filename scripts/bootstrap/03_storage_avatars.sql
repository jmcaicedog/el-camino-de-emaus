-- Configuracion de Storage para avatares
-- Enfoque de seguridad: lectura publica, escritura restringida.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
DROP POLICY IF EXISTS avatars_authenticated_insert ON storage.objects;
DROP POLICY IF EXISTS avatars_authenticated_update ON storage.objects;
DROP POLICY IF EXISTS avatars_authenticated_delete ON storage.objects;

CREATE POLICY avatars_public_read
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY avatars_authenticated_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY avatars_authenticated_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY avatars_authenticated_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
