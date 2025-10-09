-- Add new fields to caminantes table
ALTER TABLE caminantes
ADD COLUMN es_sorpresa BOOLEAN DEFAULT false,
ADD COLUMN ronca_al_dormir BOOLEAN DEFAULT false,
ADD COLUMN condicion_especial TEXT,
ADD COLUMN talla_camisa TEXT,
ADD COLUMN sacramentos_recibidos TEXT[],
ADD COLUMN nombre_contacto_emergencia_2 TEXT,
ADD COLUMN parentesco_contacto_2 TEXT,
ADD COLUMN celular_contacto_2 TEXT,
ADD COLUMN quien_invito TEXT,
ADD COLUMN invitador_hizo_retiro BOOLEAN;

-- Update monto_total to 450000 (from the welcome text)
UPDATE caminantes SET monto_total = 450000 WHERE monto_total = 250000;
ALTER TABLE caminantes ALTER COLUMN monto_total SET DEFAULT 450000;
