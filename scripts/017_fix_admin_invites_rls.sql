-- Fix RLS policies for admin_invites table
-- Allow admins to create and read invites

-- Enable RLS if not already enabled
ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can insert invites" ON admin_invites;
DROP POLICY IF EXISTS "Admins can read all invites" ON admin_invites;
DROP POLICY IF EXISTS "Anyone can read unused invites for signup" ON admin_invites;
DROP POLICY IF EXISTS "System can update used invites" ON admin_invites;

-- Allow admins to create invites
CREATE POLICY "Admins can insert invites"
ON admin_invites
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Allow admins to read all invites
CREATE POLICY "Admins can read all invites"
ON admin_invites
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Allow anyone to read unused invites (needed for signup validation)
CREATE POLICY "Anyone can read unused invites for signup"
ON admin_invites
FOR SELECT
TO authenticated
USING (used = false);

-- Allow authenticated users to update invites when using them
CREATE POLICY "System can update used invites"
ON admin_invites
FOR UPDATE
TO authenticated
USING (used = false)
WITH CHECK (true);
