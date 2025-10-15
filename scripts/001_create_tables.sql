-- Simplified script to avoid authentication issues
-- Drop existing objects if they exist
DROP POLICY IF EXISTS "Admins can view all caminantes" ON caminantes;
DROP POLICY IF EXISTS "Admins can insert caminantes" ON caminantes;
DROP POLICY IF EXISTS "Admins can update caminantes" ON caminantes;
DROP POLICY IF EXISTS "Admins can delete caminantes" ON caminantes;
DROP POLICY IF EXISTS "Servidores can view their mesa caminantes" ON caminantes;
DROP POLICY IF EXISTS "Servidores can update tracking for their mesa" ON caminantes;
DROP POLICY IF EXISTS "Admins can view all servidores" ON servidores;
DROP POLICY IF EXISTS "Admins can insert servidores" ON servidores;
DROP POLICY IF EXISTS "Admins can update servidores" ON servidores;
DROP POLICY IF EXISTS "Admins can delete servidores" ON servidores;
DROP POLICY IF EXISTS "Servidores can view own data" ON servidores;
DROP POLICY IF EXISTS "Admins can manage mesas" ON mesas;
DROP POLICY IF EXISTS "Servidores can view their mesa" ON mesas;
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;

DROP TRIGGER IF EXISTS update_caminantes_updated_at ON caminantes;
DROP TRIGGER IF EXISTS update_servidores_updated_at ON servidores;
DROP TRIGGER IF EXISTS update_mesas_updated_at ON mesas;

DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS servidores CASCADE;
DROP TABLE IF EXISTS caminantes CASCADE;
DROP TABLE IF EXISTS mesas CASCADE;

DROP TYPE IF EXISTS tipo_servidor CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'servidor_lider', 'servidor_colider');
CREATE TYPE tipo_servidor AS ENUM ('lider', 'colider');

-- Mesas table (groups)
CREATE TABLE mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL UNIQUE,
  nombre TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Caminantes table (participants)
CREATE TABLE caminantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo TEXT NOT NULL,
  cedula TEXT NOT NULL UNIQUE,
  fecha_nacimiento DATE NOT NULL,
  edad INTEGER NOT NULL,
  celular TEXT NOT NULL,
  correo TEXT NOT NULL,
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  estado_civil TEXT NOT NULL,
  profesion TEXT NOT NULL,
  empresa TEXT,
  cargo TEXT,
  nombre_contacto_emergencia TEXT NOT NULL,
  parentesco_contacto TEXT NOT NULL,
  celular_contacto TEXT NOT NULL,
  eps TEXT NOT NULL,
  tipo_sangre TEXT NOT NULL,
  medicamentos TEXT,
  restricciones_alimenticias TEXT,
  parroquia TEXT NOT NULL,
  parroco TEXT NOT NULL,
  monto_pagado DECIMAL(10, 2) DEFAULT 0,
  monto_total DECIMAL(10, 2) NOT NULL DEFAULT 250000,
  cartas_recibidas INTEGER DEFAULT 0,
  fotos_recibidas INTEGER DEFAULT 0,
  mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Servidores table (volunteers/staff)
CREATE TABLE servidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,
  nombre_completo TEXT NOT NULL,
  cedula TEXT NOT NULL UNIQUE,
  fecha_nacimiento DATE NOT NULL,
  edad INTEGER NOT NULL,
  celular TEXT NOT NULL,
  correo TEXT NOT NULL,
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  estado_civil TEXT NOT NULL,
  profesion TEXT NOT NULL,
  nombre_contacto_emergencia TEXT NOT NULL,
  parentesco_contacto TEXT NOT NULL,
  celular_contacto TEXT NOT NULL,
  eps TEXT NOT NULL,
  tipo_sangre TEXT NOT NULL,
  parroquia TEXT NOT NULL,
  retiros_anteriores INTEGER DEFAULT 0,
  experiencia_servicio TEXT,
  tipo_servidor tipo_servidor,
  monto_pagado DECIMAL(10, 2) DEFAULT 0,
  monto_total DECIMAL(10, 2) NOT NULL DEFAULT 400000,
  mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_caminantes_mesa ON caminantes(mesa_id);
CREATE INDEX idx_caminantes_cedula ON caminantes(cedula);
CREATE INDEX idx_servidores_mesa ON servidores(mesa_id);
CREATE INDEX idx_servidores_auth_user ON servidores(auth_user_id);
CREATE INDEX idx_servidores_cedula ON servidores(cedula);
CREATE INDEX idx_mesas_numero ON mesas(numero);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_caminantes_updated_at
  BEFORE UPDATE ON caminantes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servidores_updated_at
  BEFORE UPDATE ON servidores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mesas_updated_at
  BEFORE UPDATE ON mesas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (but don't add policies yet - we'll do that after testing)
ALTER TABLE caminantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Temporarily allow all operations (REMOVE IN PRODUCTION!)
CREATE POLICY "Allow all for now" ON caminantes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON servidores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON mesas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON admin_users FOR ALL USING (true) WITH CHECK (true);
