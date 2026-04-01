-- Garantizar asignación automática al equipo de Líderes y colíderes
-- cuando un servidor quede como líder/colíder en una mesa.

BEGIN;

-- Asegurar que el equipo exista
INSERT INTO equipos (nombre, descripcion)
VALUES ('Líderes y colíderes', 'Líderes y colíderes de mesas')
ON CONFLICT (nombre) DO NOTHING;

-- Backfill idempotente para recuperar asignaciones faltantes
INSERT INTO servidor_equipo (servidor_id, equipo_id)
SELECT s.id, e.id
FROM servidores s
JOIN equipos e ON e.nombre = 'Líderes y colíderes'
WHERE s.mesa_id IS NOT NULL
  AND s.tipo_servidor IN ('lider', 'colider')
ON CONFLICT (servidor_id, equipo_id) DO NOTHING;

-- Trigger para mantener la asignación automática en adelante
CREATE OR REPLACE FUNCTION sync_lideres_colideres_equipo()
RETURNS TRIGGER AS $$
DECLARE
  lideres_equipo_id UUID;
BEGIN
  IF NEW.mesa_id IS NULL OR NEW.tipo_servidor NOT IN ('lider', 'colider') THEN
    RETURN NEW;
  END IF;

  SELECT id INTO lideres_equipo_id
  FROM equipos
  WHERE nombre = 'Líderes y colíderes'
  LIMIT 1;

  IF lideres_equipo_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO servidor_equipo (servidor_id, equipo_id)
  VALUES (NEW.id, lideres_equipo_id)
  ON CONFLICT (servidor_id, equipo_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_lideres_colideres_equipo ON servidores;

CREATE TRIGGER trg_sync_lideres_colideres_equipo
AFTER INSERT OR UPDATE OF mesa_id, tipo_servidor
ON servidores
FOR EACH ROW
EXECUTE FUNCTION sync_lideres_colideres_equipo();

COMMIT;
