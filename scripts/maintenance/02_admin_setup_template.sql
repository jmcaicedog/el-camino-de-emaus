-- Plantilla para registrar un administrador sin exponer datos sensibles en Git.
-- Reemplaza los placeholders antes de ejecutar.

INSERT INTO admin_users (id, nombre_completo, role, is_super, email)
VALUES (
  'REEMPLAZAR_UUID_AUTH_USER',
  'REEMPLAZAR_NOMBRE_COMPLETO',
  'admin',
  false,
  'REEMPLAZAR_EMAIL'
)
ON CONFLICT (id) DO UPDATE
SET
  nombre_completo = EXCLUDED.nombre_completo,
  role = EXCLUDED.role,
  is_super = EXCLUDED.is_super,
  email = EXCLUDED.email,
  updated_at = NOW();
