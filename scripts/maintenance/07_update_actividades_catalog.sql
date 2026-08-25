-- Actualiza el catalogo de actividades para instalaciones existentes.
-- Al eliminar una actividad, sus asignaciones en servidor_equipo se eliminan por cascada.

BEGIN;

DELETE FROM equipos
WHERE nombre IN ('Lavatorio de pies', 'Quema de pecados', 'Refrigerio');

UPDATE equipos
SET
  nombre = CASE nombre
    WHEN 'Pared' THEN 'Dinámica de la pared'
    WHEN 'Carta de Jesús' THEN 'Dinámica de Carta de Jesús'
    WHEN 'Carta de pecados' THEN 'Dinámica de Carta de pecados'
  END,
  updated_at = NOW()
WHERE nombre IN ('Pared', 'Carta de Jesús', 'Carta de pecados');

COMMIT;

NOTIFY pgrst, 'reload schema';