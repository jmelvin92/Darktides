-- Fix RLS policies for products table
-- Allow admin users to manage products

-- Enable RLS if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies if any
DROP POLICY IF EXISTS "Admin users can view all products" ON products;
DROP POLICY IF EXISTS "Admin users can update products" ON products;
DROP POLICY IF EXISTS "Admin users can insert products" ON products;
DROP POLICY IF EXISTS "Admin users can delete products" ON products;
DROP POLICY IF EXISTS "Public users can view active products" ON products;

-- Allow public users to view active products (needed for the store)
CREATE POLICY "Public users can view active products" ON products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Allow admin users to view all products (including inactive)
CREATE POLICY "Admin users can view all products" ON products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Allow admin users to update products
CREATE POLICY "Admin users can update products" ON products
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

-- Allow admin users to insert new products
CREATE POLICY "Admin users can insert products" ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Allow admin users to delete products
CREATE POLICY "Admin users can delete products" ON products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'products';