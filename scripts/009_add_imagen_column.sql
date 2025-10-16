-- Idempotent migration: add `imagen` column to caminantes and servidores
-- Adds a TEXT column `imagen` nullable to store a public URL (Supabase Storage or external)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='caminantes' AND column_name='imagen'
  ) THEN
    ALTER TABLE caminantes ADD COLUMN imagen TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='servidores' AND column_name='imagen'
  ) THEN
    ALTER TABLE servidores ADD COLUMN imagen TEXT;
  END IF;
END$$;

-- Optionally create an index for faster lookups when filtering by presence
CREATE INDEX IF NOT EXISTS idx_caminantes_imagen ON caminantes (imagen);
CREATE INDEX IF NOT EXISTS idx_servidores_imagen ON servidores (imagen);

-- Note: run this in Supabase SQL editor or via migration tooling for your DB.
