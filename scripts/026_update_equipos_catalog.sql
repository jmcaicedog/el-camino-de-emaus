-- Actualizar catálogo de equipos al listado oficial del retiro
-- Esta migración está diseñada para bases existentes:
-- 1) Renombra equipos antiguos sin perder asignaciones
-- 2) Inserta/actualiza el catálogo oficial
-- 3) Elimina equipos que no formen parte del catálogo oficial

BEGIN;

-- Consolidar y renombrar equipos heredados para conservar relaciones.
DO $$
DECLARE
  old_id UUID;
  new_id UUID;
BEGIN
  -- Logística -> Logistica
  SELECT id INTO old_id FROM equipos WHERE nombre = 'Logística';
  IF old_id IS NOT NULL THEN
    INSERT INTO equipos (nombre, descripcion)
    VALUES ('Logistica', 'Logística y organización general')
    ON CONFLICT (nombre) DO NOTHING;

    SELECT id INTO new_id FROM equipos WHERE nombre = 'Logistica';

    IF new_id IS NOT NULL THEN
      INSERT INTO servidor_equipo (servidor_id, equipo_id)
      SELECT servidor_id, new_id
      FROM servidor_equipo
      WHERE equipo_id = old_id
      ON CONFLICT (servidor_id, equipo_id) DO NOTHING;

      DELETE FROM equipos WHERE id = old_id;
    END IF;
  END IF;

  -- Snacks -> Cocina/Snacks
  SELECT id INTO old_id FROM equipos WHERE nombre = 'Snacks';
  IF old_id IS NOT NULL THEN
    INSERT INTO equipos (nombre, descripcion)
    VALUES ('Cocina/Snacks', 'Preparación y distribución de alimentos y snacks')
    ON CONFLICT (nombre) DO NOTHING;

    SELECT id INTO new_id FROM equipos WHERE nombre = 'Cocina/Snacks';

    IF new_id IS NOT NULL THEN
      INSERT INTO servidor_equipo (servidor_id, equipo_id)
      SELECT servidor_id, new_id
      FROM servidor_equipo
      WHERE equipo_id = old_id
      ON CONFLICT (servidor_id, equipo_id) DO NOTHING;

      DELETE FROM equipos WHERE id = old_id;
    END IF;
  END IF;

  -- Santísimo -> Santísimo / Oración
  SELECT id INTO old_id FROM equipos WHERE nombre = 'Santísimo';
  IF old_id IS NOT NULL THEN
    INSERT INTO equipos (nombre, descripcion)
    VALUES ('Santísimo / Oración', 'Acompañamiento espiritual y oración')
    ON CONFLICT (nombre) DO NOTHING;

    SELECT id INTO new_id FROM equipos WHERE nombre = 'Santísimo / Oración';

    IF new_id IS NOT NULL THEN
      INSERT INTO servidor_equipo (servidor_id, equipo_id)
      SELECT servidor_id, new_id
      FROM servidor_equipo
      WHERE equipo_id = old_id
      ON CONFLICT (servidor_id, equipo_id) DO NOTHING;

      DELETE FROM equipos WHERE id = old_id;
    END IF;
  END IF;
END $$;

-- Catálogo oficial de equipos
INSERT INTO equipos (nombre, descripcion) VALUES
  ('Coordinador del retiro', 'Coordinación general del retiro'),
  ('Logistica', 'Logística y organización general'),
  ('Cocina/Snacks', 'Preparación y distribución de alimentos y snacks'),
  ('Apoyo de mesas', 'Acompañamiento y soporte operativo a mesas'),
  ('Líderes y colíderes', 'Líderes y colíderes de mesas'),
  ('Santísimo / Oración', 'Acompañamiento espiritual y oración'),
  ('Rosario', 'Organización y guía del rosario'),
  ('Música', 'Música y ambientación del retiro'),
  ('Palanquitas', 'Coordinación de palanquitas'),
  ('Cartas', 'Gestión de cartas para caminantes'),
  ('Despertar de caminantes', 'Apoyo en la dinámica de despertar de caminantes'),
  ('Fotografía', 'Cobertura fotográfica del retiro'),
  ('Sacerdotes', 'Coordinación y apoyo a sacerdotes'),
  ('Salones', 'Preparación y logística de salones'),
  ('Lavado de manos', 'Coordinación de la dinámica de lavado de manos'),
  ('Lavatorio de pies', 'Coordinación de la dinámica de lavatorio de pies'),
  ('Sanación de recuerdos', 'Apoyo en la dinámica de sanación de recuerdos'),
  ('Carta de pecados', 'Coordinación de la dinámica carta de pecados'),
  ('Imposición de cenizas', 'Coordinación de la dinámica de imposición de cenizas'),
  ('Mantelitos', 'Preparación y entrega de mantelitos'),
  ('Carta de Jesús', 'Coordinación de la dinámica carta de Jesús'),
  ('Pared', 'Coordinación de la dinámica de la pared'),
  ('Abrazos', 'Coordinación de la dinámica de abrazos'),
  ('Entrega de biblias', 'Organización de entrega de biblias'),
  ('Campanero', 'Responsable de campana y tiempos'),
  ('Minuto a minuto', 'Seguimiento operativo del minuto a minuto'),
  ('Camino de Emaús (Explicación)', 'Responsable de explicación Camino de Emaús'),
  ('El abrazo / La vela (Explicación)', 'Responsable de explicación El abrazo y La vela'),
  ('La Rosa (Explicación)', 'Responsable de explicación La Rosa'),
  ('Lema de Emáus (Explicación)', 'Responsable de explicación del lema de Emaús'),
  ('Oración al Espíritu Santo (Oración)', 'Responsable de oración al Espíritu Santo')
ON CONFLICT (nombre)
DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  updated_at = NOW();

-- Recuperar asignaciones del equipo de Líderes y colíderes
-- para quienes ya están asignados como líder/colíder en una mesa.
INSERT INTO servidor_equipo (servidor_id, equipo_id)
SELECT s.id, e.id
FROM servidores s
JOIN equipos e ON e.nombre = 'Líderes y colíderes'
WHERE s.mesa_id IS NOT NULL
  AND s.tipo_servidor IN ('lider', 'colider')
ON CONFLICT (servidor_id, equipo_id) DO NOTHING;

-- Eliminar equipos fuera del catálogo oficial
DELETE FROM equipos
WHERE nombre NOT IN (
  'Coordinador del retiro',
  'Logistica',
  'Cocina/Snacks',
  'Apoyo de mesas',
  'Líderes y colíderes',
  'Santísimo / Oración',
  'Rosario',
  'Música',
  'Palanquitas',
  'Cartas',
  'Despertar de caminantes',
  'Fotografía',
  'Sacerdotes',
  'Salones',
  'Lavado de manos',
  'Lavatorio de pies',
  'Sanación de recuerdos',
  'Carta de pecados',
  'Imposición de cenizas',
  'Mantelitos',
  'Carta de Jesús',
  'Pared',
  'Abrazos',
  'Entrega de biblias',
  'Campanero',
  'Minuto a minuto',
  'Camino de Emaús (Explicación)',
  'El abrazo / La vela (Explicación)',
  'La Rosa (Explicación)',
  'Lema de Emáus (Explicación)',
  'Oración al Espíritu Santo (Oración)'
);

COMMIT;
