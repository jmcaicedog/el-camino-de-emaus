-- Permite activar o desactivar completamente el registro/lista de espera de caminantes
ALTER TABLE retiro_settings
ADD COLUMN IF NOT EXISTS caminante_form_enabled BOOLEAN NOT NULL DEFAULT true;

UPDATE retiro_settings
SET caminante_form_enabled = COALESCE(caminante_form_enabled, true)
WHERE id = 1;