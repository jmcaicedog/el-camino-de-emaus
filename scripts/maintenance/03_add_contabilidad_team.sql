-- Agrega el equipo de Contabilidad para gestionar pagos de caminantes y servidores.
-- Script idempotente: se puede ejecutar varias veces sin duplicar registros.

BEGIN;

INSERT INTO equipos (nombre, descripcion)
VALUES ('Contabilidad', 'Gestion de pagos de caminantes y servidores')
ON CONFLICT (nombre)
DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  updated_at = NOW();

COMMIT;
