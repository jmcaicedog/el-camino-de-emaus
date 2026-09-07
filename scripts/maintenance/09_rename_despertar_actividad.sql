-- Renombra la actividad "Despertar de caminantes" a "Despertar de servidores".
-- Ejecutar en el SQL Editor de Supabase (proyecto real de produccion).

BEGIN;

UPDATE equipos
SET
  nombre = 'Despertar de servidores',
  descripcion = 'Apoyo en la dinamica de despertar de servidores',
  updated_at = NOW()
WHERE normalize(nombre, NFC) = normalize('Despertar de caminantes', NFC);

COMMIT;

NOTIFY pgrst, 'reload schema';
