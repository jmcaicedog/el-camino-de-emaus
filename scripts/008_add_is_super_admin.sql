-- Add is_super column to admin_users and mark a specific user as super admin
-- Idempotent: safe to run multiple times

BEGIN;

-- Add column if not exists
ALTER TABLE IF EXISTS admin_users
ADD COLUMN IF NOT EXISTS is_super BOOLEAN DEFAULT FALSE;

-- Try to find the user id by email in common places and set is_super = true
-- This attempts auth.users (Supabase auth), profiles table (if used), and servidores table (correo)
DO $$
DECLARE
  target_email TEXT := 'jcaicedev@gmail.com';
  found_id UUID;
BEGIN
  -- Try auth.users (Supabase auth schema)
  BEGIN
    SELECT id INTO found_id FROM auth.users WHERE email = target_email LIMIT 1;
  EXCEPTION WHEN others THEN
    found_id := NULL;
  END;

  -- Fallback to profiles table
  IF found_id IS NULL THEN
    BEGIN
      SELECT id INTO found_id FROM profiles WHERE email = target_email LIMIT 1;
    EXCEPTION WHEN others THEN
      found_id := NULL;
    END;
  END IF;

  -- Fallback to servidores table (correo column)
  IF found_id IS NULL THEN
    BEGIN
      SELECT id INTO found_id FROM servidores WHERE correo = target_email LIMIT 1;
    EXCEPTION WHEN others THEN
      found_id := NULL;
    END;
  END IF;

  IF found_id IS NOT NULL THEN
    UPDATE admin_users SET is_super = TRUE WHERE id = found_id;
    RAISE NOTICE 'Marked admin_users.is_super = TRUE for id %', found_id;
  ELSE
    RAISE NOTICE 'No admin_users row found for email % (no matching id in auth.users/profiles/servidores)', target_email;
  END IF;
END$$;

COMMIT;

-- Notes:
-- - After running this script, verify in your Supabase Table Editor that admin_users.is_super is true
--   for the expected user. If the user is not present in admin_users, you may need to insert an admin_users
--   record for that user (using the auth user id) before setting is_super.
