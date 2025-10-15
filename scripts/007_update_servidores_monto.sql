-- Script idempotente para actualizar registros existentes y asegurar el default
BEGIN;

-- Actualiza servidores existentes que tengan el monto antiguo
UPDATE servidores
SET monto_total = 400000
WHERE monto_total = 150000;

-- Asegura que la columna tenga el default correcto para futuros inserts
ALTER TABLE servidores
ALTER COLUMN monto_total SET DEFAULT 400000;

COMMIT;

-- Nota: Ejecuta este script en el entorno de producción (p. ej. desde la consola SQL de Supabase).
-- Recomendación: hacer un backup o snapshot antes de ejecutar en producción.
