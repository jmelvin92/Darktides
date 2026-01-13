-- Fix RLS policies for orders table
-- Allow admin users to manage orders

-- Enable RLS if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin users can view all orders" ON orders;
DROP POLICY IF EXISTS "Admin users can update orders" ON orders;
DROP POLICY IF EXISTS "Admin users can delete orders" ON orders;

-- Allow admin users to view all orders
CREATE POLICY "Admin users can view all orders" ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Allow admin users to update orders (e.g., change status)
CREATE POLICY "Admin users can update orders" ON orders
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

-- Allow admin users to delete orders if needed
CREATE POLICY "Admin users can delete orders" ON orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Allow public/anon users to INSERT orders (needed for checkout)
CREATE POLICY "Public users can create orders" ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'orders';