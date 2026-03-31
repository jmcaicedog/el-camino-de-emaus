-- Agrega configuración de cantidad de caminantes por mesa

ALTER TABLE IF EXISTS retiro_settings
ADD COLUMN IF NOT EXISTS caminantes_por_mesa INTEGER NOT NULL DEFAULT 7;
