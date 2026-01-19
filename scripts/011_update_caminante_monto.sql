-- Actualizar monto_total de caminantes de 450000 a 490000
UPDATE caminantes SET monto_total = 490000 WHERE monto_total = 450000;

-- Actualizar el valor por defecto
ALTER TABLE caminantes ALTER COLUMN monto_total SET DEFAULT 490000;
