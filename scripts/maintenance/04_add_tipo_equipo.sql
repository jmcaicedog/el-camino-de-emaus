-- Separa "equipos" de "actividades" agregando la columna tipo a la tabla equipos.
-- Script idempotente: se puede ejecutar varias veces sin duplicar cambios.

BEGIN;

ALTER TABLE equipos
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'equipo';

ALTER TABLE equipos
  DROP CONSTRAINT IF EXISTS equipos_tipo_check;

ALTER TABLE equipos
  ADD CONSTRAINT equipos_tipo_check CHECK (tipo IN ('equipo', 'actividad'));

UPDATE equipos
SET tipo = 'actividad'
WHERE nombre IN (
  'Camino de Emaús (Explicación)',
  'Dinámica de Carta de Jesús',
  'Dinámica de Carta de pecados',
  'Despertar de caminantes',
  'El abrazo / La vela (Explicación)',
  'Entrega de biblias',
  'Fotografía',
  'Imposición de cenizas',
  'La Rosa (Explicación)',
  'Lavado de manos',
  'Lema de Emáus (Explicación)',
  'Oración al Espíritu Santo (Oración)',
  'Dinámica de la pared',
  'Resumen',
  'Rosario',
  'Sanación de recuerdos'
);

UPDATE equipos
SET tipo = 'equipo'
WHERE nombre NOT IN (
  'Camino de Emaús (Explicación)',
  'Dinámica de Carta de Jesús',
  'Dinámica de Carta de pecados',
  'Despertar de caminantes',
  'El abrazo / La vela (Explicación)',
  'Entrega de biblias',
  'Fotografía',
  'Imposición de cenizas',
  'La Rosa (Explicación)',
  'Lavado de manos',
  'Lema de Emáus (Explicación)',
  'Oración al Espíritu Santo (Oración)',
  'Dinámica de la pared',
  'Resumen',
  'Rosario',
  'Sanación de recuerdos'
);

COMMIT;

-- PostgREST cachea el esquema; sin este aviso la API puede no ver la columna nueva.
NOTIFY pgrst, 'reload schema';
