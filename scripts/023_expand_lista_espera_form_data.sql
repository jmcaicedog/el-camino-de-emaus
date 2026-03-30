-- Extiende lista_espera para almacenar el formulario completo de caminante

ALTER TABLE lista_espera
ADD COLUMN IF NOT EXISTS form_data JSONB;

-- Backfill básico para registros existentes creados con el formulario corto.
UPDATE lista_espera
SET form_data = jsonb_build_object(
  'nombre_completo', nombre_completo,
  'celular', celular,
  'correo', correo
)
WHERE form_data IS NULL;

ALTER TABLE lista_espera
ALTER COLUMN form_data SET DEFAULT '{}'::jsonb;

ALTER TABLE lista_espera
ALTER COLUMN form_data SET NOT NULL;
