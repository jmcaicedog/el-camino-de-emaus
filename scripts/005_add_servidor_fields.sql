-- Add new fields to servidores table
ALTER TABLE servidores
ADD COLUMN empresa TEXT,
ADD COLUMN cargo TEXT,
ADD COLUMN talla_camisa TEXT,
ADD COLUMN nombre_contacto_emergencia_2 TEXT,
ADD COLUMN parentesco_contacto_2 TEXT,
ADD COLUMN celular_contacto_2 TEXT,
ADD COLUMN condicion_especial TEXT,
ADD COLUMN medicamentos TEXT,
ADD COLUMN restricciones_alimenticias TEXT,
ADD COLUMN parroco TEXT,
ADD COLUMN ronca_al_dormir BOOLEAN DEFAULT false;

-- Update monto_total default for servidores to 400000 if needed
ALTER TABLE servidores ALTER COLUMN monto_total SET DEFAULT 400000;
