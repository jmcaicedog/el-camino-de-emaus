-- Limpieza de datos operativos sin tocar configuracion estructural
-- ADVERTENCIA: elimina informacion de caminantes, servidores y sus relaciones.

BEGIN;

DELETE FROM servidor_equipo;
DELETE FROM caminantes;
DELETE FROM servidores;
DELETE FROM lista_espera;

COMMIT;

-- Verificacion rapida
SELECT 'caminantes' AS tabla, COUNT(*) AS total FROM caminantes
UNION ALL
SELECT 'servidores' AS tabla, COUNT(*) AS total FROM servidores
UNION ALL
SELECT 'servidor_equipo' AS tabla, COUNT(*) AS total FROM servidor_equipo
UNION ALL
SELECT 'lista_espera' AS tabla, COUNT(*) AS total FROM lista_espera;
