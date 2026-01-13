-- Fix RLS policies for discount_codes table
-- Allow admin users to manage discount codes

-- First, check if RLS is enabled (it probably is)
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin users can view discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Admin users can create discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Admin users can update discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Admin users can delete discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Public users can view active discount codes" ON discount_codes;

-- Allow authenticated admin users to do everything
CREATE POLICY "Admin users can view discount codes" ON discount_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can create discount codes" ON discount_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can update discount codes" ON discount_codes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can delete discount codes" ON discount_codes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Allow public (anon) users to check if a discount code exists and is active
-- This is needed for the checkout process
CREATE POLICY "Public users can view active discount codes" ON discount_codes
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'discount_codes';