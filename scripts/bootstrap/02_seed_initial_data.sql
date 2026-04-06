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

INSERT INTO equipos (nombre, descripcion) VALUES
  ('Coordinador del retiro', 'Coordinacion general del retiro'),
  ('Mesa de Registro', 'Registro y apoyo de ingreso al retiro'),
  ('Logistica', 'Logistica y organizacion general'),
  ('Cocina/Snacks', 'Preparacion y distribucion de alimentos y snacks'),
  ('Apoyo de mesas', 'Acompanamiento y soporte operativo a mesas'),
  ('Líderes y colíderes', 'Lideres y colideres de mesas'),
  ('Santísimo / Oración', 'Acompanamiento espiritual y oracion'),
  ('Rosario', 'Organizacion y guia del rosario'),
  ('Música', 'Musica y ambientacion del retiro'),
  ('Palanquitas', 'Coordinacion de palanquitas'),
  ('Cartas', 'Gestion de cartas para caminantes'),
  ('Despertar de caminantes', 'Apoyo en la dinamica de despertar de caminantes'),
  ('Fotografía', 'Cobertura fotografica del retiro'),
  ('Sacerdotes', 'Coordinacion y apoyo a sacerdotes'),
  ('Salones', 'Preparacion y logistica de salones'),
  ('Lavado de manos', 'Coordinacion de la dinamica de lavado de manos'),
  ('Lavatorio de pies', 'Coordinacion de la dinamica de lavatorio de pies'),
  ('Sanación de recuerdos', 'Apoyo en la dinamica de sanacion de recuerdos'),
  ('Carta de pecados', 'Coordinacion de la dinamica carta de pecados'),
  ('Quema de pecados', 'Coordinacion de la dinamica de quema de pecados'),
  ('Imposición de cenizas', 'Coordinacion de la dinamica de imposicion de cenizas'),
  ('Resumen', 'Responsable de la dinamica de resumen'),
  ('Mantelitos', 'Preparacion y entrega de mantelitos'),
  ('Carta de Jesús', 'Coordinacion de la dinamica carta de Jesus'),
  ('Pared', 'Coordinacion de la dinamica de la pared'),
  ('Abrazos', 'Coordinacion de la dinamica de abrazos'),
  ('Entrega de biblias', 'Organizacion de entrega de biblias'),
  ('Campanero', 'Responsable de campana y tiempos'),
  ('Minuto a minuto', 'Seguimiento operativo del minuto a minuto'),
  ('Camino de Emaús (Explicación)', 'Responsable de explicacion Camino de Emaus'),
  ('El abrazo / La vela (Explicación)', 'Responsable de explicacion El abrazo y La vela'),
  ('La Rosa (Explicación)', 'Responsable de explicacion La Rosa'),
  ('Lema de Emáus (Explicación)', 'Responsable de explicacion del lema de Emaus'),
  ('Oración al Espíritu Santo (Oración)', 'Responsable de oracion al Espiritu Santo')
ON CONFLICT (nombre)
DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
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
