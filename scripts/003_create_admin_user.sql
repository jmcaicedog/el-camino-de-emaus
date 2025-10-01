-- Create admin user
-- Note: You need to create the user in Supabase Auth first, then run this script
-- Or use the sign-up page and then manually add them to admin_users table

-- For testing, you can create an admin user with these credentials:
-- Email: admin@emaus.com
-- Password: Admin123!

-- After creating the user in Supabase Auth, insert into admin_users:
-- Replace 'USER_ID_HERE' with the actual UUID from auth.users

-- Example insert (you'll need to get the actual user ID after signup):
-- INSERT INTO admin_users (id, nombre_completo, role)
-- VALUES ('USER_ID_FROM_AUTH', 'Administrador Principal', 'admin');

-- For now, this script will help you identify if you need to add an admin
DO $$
BEGIN
  RAISE NOTICE 'To create an admin user:';
  RAISE NOTICE '1. Go to /auth/login and click "Sign Up"';
  RAISE NOTICE '2. Use email: admin@emaus.com and password: Admin123!';
  RAISE NOTICE '3. After signup, run this query with the user ID:';
  RAISE NOTICE 'INSERT INTO admin_users (id, nombre_completo, role) VALUES (''USER_ID'', ''Administrador Principal'', ''admin'');';
END $$;
