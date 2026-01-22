-- Agregar columna email a admin_users para poder enviar notificaciones
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS email TEXT;

-- Crear índice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Comentario: Este campo almacena el correo electrónico del administrador
-- para poder enviarle notificaciones sobre eventos importantes en la plataforma

-- Intentar poblar el email desde auth.users si existe la relación
DO $$
DECLARE
  admin_record RECORD;
  user_email TEXT;
BEGIN
  FOR admin_record IN SELECT id FROM admin_users WHERE email IS NULL
  LOOP
    -- Buscar el email en auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = admin_record.id LIMIT 1;
    
    IF user_email IS NOT NULL THEN
      UPDATE admin_users SET email = user_email WHERE id = admin_record.id;
      RAISE NOTICE 'Email actualizado para admin ID: %', admin_record.id;
    END IF;
  END LOOP;
END $$;
