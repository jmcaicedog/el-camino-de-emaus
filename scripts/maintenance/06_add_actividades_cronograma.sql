-- Agrega nuevas actividades del retiro (dinamicas del cronograma).
-- Script idempotente: se puede ejecutar varias veces sin duplicar registros.

BEGIN;

INSERT INTO equipos (nombre, descripcion, tipo) VALUES
  ('Bienvenida', 'Responsable de la bienvenida al retiro', 'actividad'),
  ('Explicación del retiro', 'Responsable de la explicacion del retiro', 'actividad'),
  ('Reglas del retiro', 'Responsable de explicar las reglas del retiro', 'actividad'),
  ('Asignación de mesas', 'Responsable de la asignacion de mesas', 'actividad'),
  ('Oración por los caminantes', 'Responsable de la oracion por los caminantes', 'actividad'),
  ('Cena y presentación individual', 'Responsable de la cena y presentacion individual', 'actividad'),
  ('Lecturas de confidencialidad', 'Responsable de las lecturas de confidencialidad', 'actividad'),
  ('Explicación de Por qué oramos al Espíritu Santo', 'Responsable de explicar por que oramos al Espiritu Santo', 'actividad'),
  ('Presentación de testimonios', 'Responsable de la presentacion de testimonios', 'actividad'),
  ('Explicación del Santísimo Sacramento', 'Responsable de la explicacion del Santisimo Sacramento', 'actividad'),
  ('Reglas para la noche', 'Responsable de explicar las reglas para la noche', 'actividad'),
  ('Oración de inicio del día', 'Responsable de la oracion de inicio del dia', 'actividad'),
  ('Oración y bendición de los alimentos', 'Responsable de la oracion y bendicion de los alimentos', 'actividad'),
  ('Cena de sacerdotes', 'Responsable de la cena de sacerdotes', 'actividad'),
  ('Misa nocturna', 'Responsable de la misa nocturna', 'actividad'),
  ('Dinámica del perdón', 'Responsable de la dinamica del perdon', 'actividad'),
  ('Refrigerio', 'Responsable del refrigerio', 'actividad')
ON CONFLICT (nombre)
DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  tipo = EXCLUDED.tipo,
  updated_at = NOW();

COMMIT;

NOTIFY pgrst, 'reload schema';
