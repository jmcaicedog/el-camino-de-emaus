-- Create 12 mesas (tables/groups)
INSERT INTO mesas (numero, nombre) VALUES
  (1, 'Mesa 1'),
  (2, 'Mesa 2'),
  (3, 'Mesa 3'),
  (4, 'Mesa 4'),
  (5, 'Mesa 5'),
  (6, 'Mesa 6'),
  (7, 'Mesa 7'),
  (8, 'Mesa 8'),
  (9, 'Mesa 9'),
  (10, 'Mesa 10'),
  (11, 'Mesa 11'),
  (12, 'Mesa 12')
ON CONFLICT (numero) DO NOTHING;
