-- Agregar campos booleanos de contacto a tabla caminantes

ALTER TABLE caminantes ADD COLUMN IF NOT EXISTS caminantes_contactados BOOLEAN DEFAULT FALSE;
ALTER TABLE caminantes ADD COLUMN IF NOT EXISTS familiares_contactados BOOLEAN DEFAULT FALSE;

-- Crear índices para hacer más eficientes las consultas
CREATE INDEX IF NOT EXISTS idx_caminantes_contactados ON caminantes(caminantes_contactados);
CREATE INDEX IF NOT EXISTS idx_familiares_contactados ON caminantes(familiares_contactados);
