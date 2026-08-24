-- Diagnostico y re-aplicacion de la clasificacion tipo=actividad en equipos.
-- Ejecutar completo en el SQL Editor de Supabase. Es idempotente.

BEGIN;

-- Asegura columna y constraint (no-op si ya existen)
ALTER TABLE equipos
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'equipo';

ALTER TABLE equipos
  DROP CONSTRAINT IF EXISTS equipos_tipo_check;

ALTER TABLE equipos
  ADD CONSTRAINT equipos_tipo_check CHECK (tipo IN ('equipo', 'actividad'));

-- Re-aplica la clasificacion comparando con acentos normalizados,
-- para evitar fallos por diferencias de normalizacion Unicode (NFC/NFD).
UPDATE equipos
SET tipo = 'actividad'
WHERE normalize(nombre, NFC) IN (
  normalize('Camino de Emaús (Explicación)', NFC),
  normalize('Carta de Jesús', NFC),
  normalize('Carta de pecados', NFC),
  normalize('Despertar de caminantes', NFC),
  normalize('El abrazo / La vela (Explicación)', NFC),
  normalize('Entrega de biblias', NFC),
  normalize('Fotografía', NFC),
  normalize('Imposición de cenizas', NFC),
  normalize('La Rosa (Explicación)', NFC),
  normalize('Lavado de manos', NFC),
  normalize('Lavatorio de pies', NFC),
  normalize('Lema de Emáus (Explicación)', NFC),
  normalize('Oración al Espíritu Santo (Oración)', NFC),
  normalize('Pared', NFC),
  normalize('Quema de pecados', NFC),
  normalize('Resumen', NFC),
  normalize('Rosario', NFC),
  normalize('Sanación de recuerdos', NFC)
);

UPDATE equipos
SET tipo = 'equipo'
WHERE normalize(nombre, NFC) NOT IN (
  normalize('Camino de Emaús (Explicación)', NFC),
  normalize('Carta de Jesús', NFC),
  normalize('Carta de pecados', NFC),
  normalize('Despertar de caminantes', NFC),
  normalize('El abrazo / La vela (Explicación)', NFC),
  normalize('Entrega de biblias', NFC),
  normalize('Fotografía', NFC),
  normalize('Imposición de cenizas', NFC),
  normalize('La Rosa (Explicación)', NFC),
  normalize('Lavado de manos', NFC),
  normalize('Lavatorio de pies', NFC),
  normalize('Lema de Emáus (Explicación)', NFC),
  normalize('Oración al Espíritu Santo (Oración)', NFC),
  normalize('Pared', NFC),
  normalize('Quema de pecados', NFC),
  normalize('Resumen', NFC),
  normalize('Rosario', NFC),
  normalize('Sanación de recuerdos', NFC)
);

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Diagnostico: revisa esta salida para confirmar que "actividad" tiene filas.
SELECT tipo, count(*) FROM equipos GROUP BY tipo ORDER BY tipo;

-- Diagnostico detallado: lista cada equipo con su tipo asignado.
SELECT nombre, tipo FROM equipos ORDER BY tipo, nombre;
