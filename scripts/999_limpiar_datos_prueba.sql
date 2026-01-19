-- Script para limpiar todos los datos de prueba
-- ADVERTENCIA: Este script eliminará TODOS los caminantes y servidores registrados
-- Úsalo SOLO cuando estés seguro de que quieres eliminar toda la información de prueba

-- Paso 1: Eliminar todas las relaciones de servidores con equipos
DELETE FROM servidor_equipo;

-- Paso 2: Eliminar todos los caminantes
DELETE FROM caminantes;

-- Paso 3: Eliminar todos los servidores
DELETE FROM servidores;

-- Paso 4 (OPCIONAL): Reiniciar los contadores si quieres empezar desde cero
-- Si quieres que los IDs vuelvan a empezar desde el principio, descomenta las siguientes líneas:
-- ALTER SEQUENCE IF EXISTS caminantes_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS servidores_id_seq RESTART WITH 1;

-- Verificar que las tablas están vacías
SELECT 'Caminantes restantes:' as tabla, COUNT(*) as cantidad FROM caminantes
UNION ALL
SELECT 'Servidores restantes:' as tabla, COUNT(*) as cantidad FROM servidores
UNION ALL
SELECT 'Relaciones servidor-equipo restantes:' as tabla, COUNT(*) as cantidad FROM servidor_equipo;
