-- Seed inicial para una instalacion nueva
-- Incluye: mesas, catalogo de equipos y fila base de configuracion.

BEGIN;

INSERT INTO retiro_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mesas (numero, nombre)
SELECT n, 'Mesa ' || n::TEXT
FROM generate_series(1, 12) AS n
ON CONFLICT (numero) DO UPDATE
SET nombre = EXCLUDED.nombre;

INSERT INTO equipos (nombre, descripcion, tipo) VALUES
  ('Coordinador del retiro', 'Coordinacion general del retiro', 'equipo'),
  ('Mesa de Registro', 'Registro y apoyo de ingreso al retiro', 'equipo'),
  ('Logistica', 'Logistica y organizacion general', 'equipo'),
  ('Cocina/Snacks', 'Preparacion y distribucion de alimentos y snacks', 'equipo'),
  ('Apoyo de mesas', 'Acompanamiento y soporte operativo a mesas', 'equipo'),
  ('Líderes y colíderes', 'Lideres y colideres de mesas', 'equipo'),
  ('Santísimo / Oración', 'Acompanamiento espiritual y oracion', 'equipo'),
  ('Rosario', 'Organizacion y guia del rosario', 'actividad'),
  ('Música', 'Musica y ambientacion del retiro', 'equipo'),
  ('Palanquitas', 'Coordinacion de palanquitas', 'equipo'),
  ('Cartas', 'Gestion de cartas para caminantes', 'equipo'),
  ('Despertar de caminantes', 'Apoyo en la dinamica de despertar de caminantes', 'actividad'),
  ('Fotografía', 'Cobertura fotografica del retiro', 'actividad'),
  ('Sacerdotes', 'Coordinacion y apoyo a sacerdotes', 'equipo'),
  ('Salones', 'Preparacion y logistica de salones', 'equipo'),
  ('Lavado de manos', 'Coordinacion de la dinamica de lavado de manos', 'actividad'),
  ('Lavatorio de pies', 'Coordinacion de la dinamica de lavatorio de pies', 'actividad'),
  ('Sanación de recuerdos', 'Apoyo en la dinamica de sanacion de recuerdos', 'actividad'),
  ('Carta de pecados', 'Coordinacion de la dinamica carta de pecados', 'actividad'),
  ('Quema de pecados', 'Coordinacion de la dinamica de quema de pecados', 'actividad'),
  ('Imposición de cenizas', 'Coordinacion de la dinamica de imposicion de cenizas', 'actividad'),
  ('Resumen', 'Responsable de la dinamica de resumen', 'actividad'),
  ('Mantelitos', 'Preparacion y entrega de mantelitos', 'equipo'),
  ('Carta de Jesús', 'Coordinacion de la dinamica carta de Jesus', 'actividad'),
  ('Pared', 'Coordinacion de la dinamica de la pared', 'actividad'),
  ('Abrazos', 'Coordinacion de la dinamica de abrazos', 'equipo'),
  ('Contabilidad', 'Gestion de pagos de caminantes y servidores', 'equipo'),
  ('Entrega de biblias', 'Organizacion de entrega de biblias', 'actividad'),
  ('Campanero', 'Responsable de campana y tiempos', 'equipo'),
  ('Minuto a minuto', 'Seguimiento operativo del minuto a minuto', 'equipo'),
  ('Camino de Emaús (Explicación)', 'Responsable de explicacion Camino de Emaus', 'actividad'),
  ('El abrazo / La vela (Explicación)', 'Responsable de explicacion El abrazo y La vela', 'actividad'),
  ('La Rosa (Explicación)', 'Responsable de explicacion La Rosa', 'actividad'),
  ('Lema de Emáus (Explicación)', 'Responsable de explicacion del lema de Emaus', 'actividad'),
  ('Oración al Espíritu Santo (Oración)', 'Responsable de oracion al Espiritu Santo', 'actividad')
ON CONFLICT (nombre)
DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  tipo = EXCLUDED.tipo,
  updated_at = NOW();

-- Backfill idempotente de asignacion para lideres/colideres en mesas
INSERT INTO servidor_equipo (servidor_id, equipo_id)
SELECT s.id, e.id
FROM servidores s
JOIN equipos e ON e.nombre = 'Líderes y colíderes'
WHERE s.mesa_id IS NOT NULL
  AND s.tipo_servidor IN ('lider', 'colider')
ON CONFLICT (servidor_id, equipo_id) DO NOTHING;

COMMIT;
