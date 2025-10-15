-- Create admin_invites table for one-time admin signup tokens
-- Requires pgcrypto for gen_random_uuid()

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_invites (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NULL,
  created_at timestamptz DEFAULT now(),
  used boolean NOT NULL DEFAULT false,
  used_by uuid NULL,
  used_at timestamptz NULL
);

-- Optional index to look up unused tokens fast
CREATE INDEX IF NOT EXISTS idx_admin_invites_used ON admin_invites (used);
