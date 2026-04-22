-- Bootstrap principal del esquema de base de datos
-- Objetivo: dejar la estructura final lista para el proyecto.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'servidor_lider', 'servidor_colider');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_servidor') THEN
    CREATE TYPE tipo_servidor AS ENUM ('lider', 'colider');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL UNIQUE,
  nombre TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  nombre_contacto_emergencia TEXT NOT NULL,
  parentesco_contacto TEXT NOT NULL,
  celular_contacto TEXT NOT NULL,
  nombre_contacto_emergencia_2 TEXT,
  parentesco_contacto_2 TEXT,
  celular_contacto_2 TEXT,
  es_sorpresa BOOLEAN NOT NULL DEFAULT false,
  ronca_al_dormir BOOLEAN NOT NULL DEFAULT false,
  condicion_especial TEXT,
  talla_camisa TEXT,
  sacramentos_recibidos TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  quien_invito TEXT,
  invitador_hizo_retiro BOOLEAN,
  eps TEXT NOT NULL,
  tipo_sangre TEXT NOT NULL,
  medicamentos TEXT,
  restricciones_alimenticias TEXT,
  observaciones TEXT,
  parroquia TEXT NOT NULL,
  parroco TEXT NOT NULL,
  monto_pagado NUMERIC(10, 2) NOT NULL DEFAULT 0,
  monto_total NUMERIC(10, 2) NOT NULL DEFAULT 490000,
  imagen TEXT,
  cartas_recibidas INTEGER NOT NULL DEFAULT 0,
  fotos_recibidas INTEGER NOT NULL DEFAULT 0,
  caminantes_contactados BOOLEAN NOT NULL DEFAULT FALSE,
  familiares_contactados BOOLEAN NOT NULL DEFAULT FALSE,
  mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS servidores (
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
  empresa TEXT,
  cargo TEXT,
  talla_camisa TEXT,
  colores_camisa TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  nombre_contacto_emergencia TEXT NOT NULL,
  parentesco_contacto TEXT NOT NULL,
  celular_contacto TEXT NOT NULL,
  nombre_contacto_emergencia_2 TEXT,
  parentesco_contacto_2 TEXT,
  celular_contacto_2 TEXT,
  condicion_especial TEXT,
  medicamentos TEXT,
  restricciones_alimenticias TEXT,
  parroco TEXT,
  ronca_al_dormir BOOLEAN NOT NULL DEFAULT false,
  eps TEXT NOT NULL,
  tipo_sangre TEXT NOT NULL,
  parroquia TEXT NOT NULL,
  retiros_anteriores INTEGER NOT NULL DEFAULT 0,
  experiencia_servicio TEXT,
  tipo_servidor tipo_servidor,
  monto_pagado NUMERIC(10, 2) NOT NULL DEFAULT 0,
  monto_total NUMERIC(10, 2) NOT NULL DEFAULT 400000,
  imagen TEXT,
  mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'admin',
  is_super BOOLEAN NOT NULL DEFAULT false,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS servidor_equipo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES servidores(id) ON DELETE CASCADE,
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (servidor_id, equipo_id)
);

CREATE TABLE IF NOT EXISTS lista_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo TEXT NOT NULL,
  celular TEXT NOT NULL,
  correo TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retiro_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  retiro_datetime TIMESTAMPTZ NOT NULL DEFAULT '2026-04-10 16:00:00-05',
  logo_url TEXT,
  mesas_count INTEGER NOT NULL DEFAULT 12,
  caminantes_por_mesa INTEGER NOT NULL DEFAULT 7,
  max_caminantes INTEGER NOT NULL DEFAULT 65,
  costo_servidor NUMERIC(10, 2) NOT NULL DEFAULT 400000,
  costo_caminante NUMERIC(10, 2) NOT NULL DEFAULT 490000,
  countdown_enabled BOOLEAN NOT NULL DEFAULT true,
  caminante_form_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mesas_numero ON mesas(numero);

CREATE INDEX IF NOT EXISTS idx_caminantes_mesa ON caminantes(mesa_id);
CREATE INDEX IF NOT EXISTS idx_caminantes_cedula ON caminantes(cedula);
CREATE INDEX IF NOT EXISTS idx_caminantes_contactados ON caminantes(caminantes_contactados);
CREATE INDEX IF NOT EXISTS idx_familiares_contactados ON caminantes(familiares_contactados);

CREATE INDEX IF NOT EXISTS idx_servidores_mesa ON servidores(mesa_id);
CREATE INDEX IF NOT EXISTS idx_servidores_auth_user ON servidores(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_servidores_cedula ON servidores(cedula);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

CREATE INDEX IF NOT EXISTS idx_servidor_equipo_servidor ON servidor_equipo(servidor_id);
CREATE INDEX IF NOT EXISTS idx_servidor_equipo_equipo ON servidor_equipo(equipo_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lista_espera_correo_unique ON lista_espera (lower(correo));
CREATE INDEX IF NOT EXISTS idx_lista_espera_created_at ON lista_espera (created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mesas_updated_at ON mesas;
CREATE TRIGGER update_mesas_updated_at
BEFORE UPDATE ON mesas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_caminantes_updated_at ON caminantes;
CREATE TRIGGER update_caminantes_updated_at
BEFORE UPDATE ON caminantes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_servidores_updated_at ON servidores;
CREATE TRIGGER update_servidores_updated_at
BEFORE UPDATE ON servidores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_equipos_updated_at ON equipos;
CREATE TRIGGER update_equipos_updated_at
BEFORE UPDATE ON equipos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lista_espera_updated_at ON lista_espera;
CREATE TRIGGER update_lista_espera_updated_at
BEFORE UPDATE ON lista_espera
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_retiro_settings_updated_at ON retiro_settings;
CREATE TRIGGER update_retiro_settings_updated_at
BEFORE UPDATE ON retiro_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION sync_lideres_colideres_equipo()
RETURNS TRIGGER AS $$
DECLARE
  lideres_equipo_id UUID;
BEGIN
  IF NEW.mesa_id IS NULL OR NEW.tipo_servidor NOT IN ('lider', 'colider') THEN
    RETURN NEW;
  END IF;

  SELECT id INTO lideres_equipo_id
  FROM equipos
  WHERE nombre = 'Líderes y colíderes'
  LIMIT 1;

  IF lideres_equipo_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO servidor_equipo (servidor_id, equipo_id)
  VALUES (NEW.id, lideres_equipo_id)
  ON CONFLICT (servidor_id, equipo_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_lideres_colideres_equipo ON servidores;
CREATE TRIGGER trg_sync_lideres_colideres_equipo
AFTER INSERT OR UPDATE OF mesa_id, tipo_servidor
ON servidores
FOR EACH ROW
EXECUTE FUNCTION sync_lideres_colideres_equipo();

ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE caminantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servidor_equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_espera ENABLE ROW LEVEL SECURITY;
ALTER TABLE retiro_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mesas_select_authenticated ON mesas;
DROP POLICY IF EXISTS mesas_manage_admins ON mesas;
CREATE POLICY mesas_select_authenticated
ON mesas FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid())
  OR EXISTS (SELECT 1 FROM servidores s WHERE s.auth_user_id = auth.uid())
);
CREATE POLICY mesas_manage_admins
ON mesas FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()));

DROP POLICY IF EXISTS caminantes_select_admins_or_same_mesa ON caminantes;
DROP POLICY IF EXISTS caminantes_insert_admins ON caminantes;
DROP POLICY IF EXISTS caminantes_update_admins_or_same_mesa ON caminantes;
DROP POLICY IF EXISTS caminantes_delete_admins ON caminantes;
CREATE POLICY caminantes_select_admins_or_same_mesa
ON caminantes FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid())
  OR EXISTS (
    SELECT 1
    FROM servidores s
    WHERE s.auth_user_id = auth.uid()
      AND s.mesa_id = caminantes.mesa_id
      AND s.mesa_id IS NOT NULL
  )
);
CREATE POLICY caminantes_insert_admins
ON caminantes FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()));
CREATE POLICY caminantes_update_admins_or_same_mesa
ON caminantes FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid())
  OR EXISTS (
    SELECT 1
    FROM servidores s
    WHERE s.auth_user_id = auth.uid()
      AND s.mesa_id = caminantes.mesa_id
      AND s.mesa_id IS NOT NULL
  )
)
WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid())
  OR EXISTS (
    SELECT 1
    FROM servidores s
    WHERE s.auth_user_id = auth.uid()
      AND s.mesa_id = caminantes.mesa_id
      AND s.mesa_id IS NOT NULL
  )
);
CREATE POLICY caminantes_delete_admins
ON caminantes FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()));

DROP POLICY IF EXISTS servidores_select_admins_or_self ON servidores;
DROP POLICY IF EXISTS servidores_insert_admins ON servidores;
DROP POLICY IF EXISTS servidores_update_admins ON servidores;
DROP POLICY IF EXISTS servidores_delete_admins ON servidores;
CREATE POLICY servidores_select_admins_or_self
ON servidores FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid())
  OR auth_user_id = auth.uid()
);
CREATE POLICY servidores_insert_admins
ON servidores FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()));
CREATE POLICY servidores_update_admins
ON servidores FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()));
CREATE POLICY servidores_delete_admins
ON servidores FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()));

DROP POLICY IF EXISTS admin_users_select_admins ON admin_users;
DROP POLICY IF EXISTS admin_users_manage_superadmins ON admin_users;

CREATE OR REPLACE FUNCTION public.is_super_admin(_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = _uid
      AND is_super = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;

CREATE POLICY admin_users_select_admins
ON admin_users FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY admin_users_manage_superadmins
ON admin_users FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS equipos_select_authenticated ON equipos;
DROP POLICY IF EXISTS equipos_manage_admins ON equipos;
CREATE POLICY equipos_select_authenticated
ON equipos FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid())
  OR EXISTS (SELECT 1 FROM servidores s WHERE s.auth_user_id = auth.uid())
);
CREATE POLICY equipos_manage_admins
ON equipos FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()));

DROP POLICY IF EXISTS servidor_equipo_select_authenticated ON servidor_equipo;
DROP POLICY IF EXISTS servidor_equipo_manage_admins ON servidor_equipo;
CREATE POLICY servidor_equipo_select_authenticated
ON servidor_equipo FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid())
  OR EXISTS (SELECT 1 FROM servidores s WHERE s.auth_user_id = auth.uid())
);
CREATE POLICY servidor_equipo_manage_admins
ON servidor_equipo FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()));

DROP POLICY IF EXISTS lista_espera_select_admins ON lista_espera;
DROP POLICY IF EXISTS lista_espera_insert_admins ON lista_espera;
DROP POLICY IF EXISTS lista_espera_delete_admins ON lista_espera;
CREATE POLICY lista_espera_select_admins
ON lista_espera FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()));
CREATE POLICY lista_espera_insert_admins
ON lista_espera FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()));
CREATE POLICY lista_espera_delete_admins
ON lista_espera FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid()));

DROP POLICY IF EXISTS retiro_settings_public_select ON retiro_settings;
DROP POLICY IF EXISTS retiro_settings_superadmin_update ON retiro_settings;
CREATE POLICY retiro_settings_public_select
ON retiro_settings FOR SELECT
USING (true);
CREATE POLICY retiro_settings_superadmin_update
ON retiro_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid() AND a.is_super = true))
WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.id = auth.uid() AND a.is_super = true));
