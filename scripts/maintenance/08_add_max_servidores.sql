-- Agrega el cupo maximo de servidores como control de capacidad, similar a max_caminantes.
-- Script idempotente: se puede ejecutar varias veces sin error.

BEGIN;

ALTER TABLE retiro_settings
  ADD COLUMN IF NOT EXISTS max_servidores INTEGER NOT NULL DEFAULT 60;

COMMIT;

-- Si PostgREST no refleja la columna nueva de inmediato, recargar el cache de esquema:
-- NOTIFY pgrst, 'reload schema';
