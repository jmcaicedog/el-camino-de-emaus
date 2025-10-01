-- Reordered table creation to avoid circular dependencies - mesas first
-- Create enum types for roles and payment status
CREATE TYPE user_role AS ENUM ('admin', 'servidor_lider', 'servidor_colider');
CREATE TYPE tipo_servidor AS ENUM ('lider', 'colider');

-- Mesas table (groups) - CREATE FIRST to avoid foreign key errors
CREATE TABLE IF NOT EXISTS mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL UNIQUE,
  nombre TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Caminantes table (participants)
CREATE TABLE IF NOT EXISTS caminantes (
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
  
  -- Emergency contact
  nombre_contacto_emergencia TEXT NOT NULL,
  parentesco_contacto TEXT NOT NULL,
  celular_contacto TEXT NOT NULL,
  
  -- Medical info
  eps TEXT NOT NULL,
  tipo_sangre TEXT NOT NULL,
  medicamentos TEXT,
  restricciones_alimenticias TEXT,
  
  -- Spiritual info
  parroquia TEXT NOT NULL,
  parroco TEXT NOT NULL,
  
  -- Payment info
  monto_pagado DECIMAL(10, 2) DEFAULT 0,
  monto_total DECIMAL(10, 2) NOT NULL DEFAULT 250000,
  
  -- Tracking (managed by servers)
  cartas_recibidas INTEGER DEFAULT 0,
  fotos_recibidas INTEGER DEFAULT 0,
  
  -- Mesa assignment
  mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Servidores table (volunteers/staff)
CREATE TABLE IF NOT EXISTS servidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  
  -- Emergency contact
  nombre_contacto_emergencia TEXT NOT NULL,
  parentesco_contacto TEXT NOT NULL,
  celular_contacto TEXT NOT NULL,
  
  -- Medical info
  eps TEXT NOT NULL,
  tipo_sangre TEXT NOT NULL,
  
  -- Spiritual info
  parroquia TEXT NOT NULL,
  
  -- Server specific
  retiros_anteriores INTEGER DEFAULT 0,
  experiencia_servicio TEXT,
  
  -- Role (lider or colider)
  tipo_servidor tipo_servidor,
  
  -- Payment info
  monto_pagado DECIMAL(10, 2) DEFAULT 0,
  monto_total DECIMAL(10, 2) NOT NULL DEFAULT 150000,
  
  -- Mesa assignment
  mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table (references auth.users)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE caminantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for caminantes
-- Admins can do everything
CREATE POLICY "Admins can view all caminantes"
  ON caminantes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert caminantes"
  ON caminantes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update caminantes"
  ON caminantes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete caminantes"
  ON caminantes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Servidores can view caminantes in their mesa
CREATE POLICY "Servidores can view their mesa caminantes"
  ON caminantes FOR SELECT
  USING (
    mesa_id IN (
      SELECT mesa_id FROM servidores
      WHERE servidores.auth_user_id = auth.uid()
    )
  );

-- Servidores can update tracking fields for their mesa
CREATE POLICY "Servidores can update tracking for their mesa"
  ON caminantes FOR UPDATE
  USING (
    mesa_id IN (
      SELECT mesa_id FROM servidores
      WHERE servidores.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for servidores
CREATE POLICY "Admins can view all servidores"
  ON servidores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert servidores"
  ON servidores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update servidores"
  ON servidores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete servidores"
  ON servidores FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Servidores can view their own data
CREATE POLICY "Servidores can view own data"
  ON servidores FOR SELECT
  USING (auth_user_id = auth.uid());

-- RLS Policies for mesas
CREATE POLICY "Admins can manage mesas"
  ON mesas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Servidores can view their mesa"
  ON mesas FOR SELECT
  USING (
    id IN (
      SELECT mesa_id FROM servidores
      WHERE servidores.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for admin_users
CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Create indexes for better performance
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

-- Create triggers for updated_at
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
