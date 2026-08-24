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
  'Carta de Jesús',
  'Carta de pecados',
  'Despertar de caminantes',
  'El abrazo / La vela (Explicación)',
  'Entrega de biblias',
  'Fotografía',
  'Imposición de cenizas',
  'La Rosa (Explicación)',
  'Lavado de manos',
  'Lavatorio de pies',
  'Lema de Emáus (Explicación)',
  'Oración al Espíritu Santo (Oración)',
  'Pared',
  'Quema de pecados',
  'Resumen',
  'Rosario',
  'Sanación de recuerdos'
);

UPDATE equipos
SET tipo = 'equipo'
WHERE nombre NOT IN (
  'Camino de Emaús (Explicación)',
  'Carta de Jesús',
  'Carta de pecados',
  'Despertar de caminantes',
  'El abrazo / La vela (Explicación)',
  'Entrega de biblias',
  'Fotografía',
  'Imposición de cenizas',
  'La Rosa (Explicación)',
  'Lavado de manos',
  'Lavatorio de pies',
  'Lema de Emáus (Explicación)',
  'Oración al Espíritu Santo (Oración)',
  'Pared',
  'Quema de pecados',
  'Resumen',
  'Rosario',
  'Sanación de recuerdos'
);

COMMIT;
