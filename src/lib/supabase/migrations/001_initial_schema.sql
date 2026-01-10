-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  dosage TEXT,
  price DECIMAL(10, 2) NOT NULL,
  old_price DECIMAL(10, 2),
  sku TEXT UNIQUE NOT NULL,
  description TEXT,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory reservations table
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  customer_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory transactions log
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'sale', 'restock', 'reserve', 'release', 'adjustment'
  quantity_change INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  order_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_reservations_session ON inventory_reservations(session_id);
CREATE INDEX idx_reservations_expires ON inventory_reservations(expires_at);
CREATE INDEX idx_transactions_product ON inventory_transactions(product_id);

-- Function to reserve inventory atomically
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_product_id TEXT,
  p_quantity INTEGER,
  p_session_id TEXT
) RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_available INTEGER;
  v_reservation_id UUID;
BEGIN
  -- Lock the product row
  SELECT stock_quantity - reserved_quantity INTO v_available
  FROM products
  WHERE id = p_product_id AND is_active = true
  FOR UPDATE;

  IF v_available IS NULL THEN
    RETURN QUERY SELECT false, 'Product not found'::TEXT;
    RETURN;
  END IF;

  IF v_available < p_quantity THEN
    RETURN QUERY SELECT false, 'Insufficient stock'::TEXT;
    RETURN;
  END IF;

  -- Update reserved quantity
  UPDATE products 
  SET reserved_quantity = reserved_quantity + p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id;

  -- Create reservation
  INSERT INTO inventory_reservations (session_id, product_id, quantity, expires_at)
  VALUES (p_session_id, p_product_id, p_quantity, NOW() + INTERVAL '30 minutes')
  RETURNING id INTO v_reservation_id;

  -- Log transaction
  INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, balance_after)
  SELECT id, 'reserve', p_quantity, stock_quantity - reserved_quantity
  FROM products WHERE id = p_product_id;

  RETURN QUERY SELECT true, v_reservation_id::TEXT;
END;
$$;

-- Function to release a reservation
CREATE OR REPLACE FUNCTION release_reservation(p_reservation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_product_id TEXT;
  v_quantity INTEGER;
BEGIN
  -- Get reservation details
  SELECT product_id, quantity INTO v_product_id, v_quantity
  FROM inventory_reservations
  WHERE id = p_reservation_id;

  IF v_product_id IS NOT NULL THEN
    -- Release the reserved quantity
    UPDATE products 
    SET reserved_quantity = reserved_quantity - v_quantity,
        updated_at = NOW()
    WHERE id = v_product_id;

    -- Delete the reservation
    DELETE FROM inventory_reservations WHERE id = p_reservation_id;

    -- Log transaction
    INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, balance_after)
    SELECT id, 'release', -v_quantity, stock_quantity - reserved_quantity
    FROM products WHERE id = v_product_id;
  END IF;
END;
$$;

-- Function to finalize an order
CREATE OR REPLACE FUNCTION finalize_order(
  p_order_id TEXT,
  p_session_id TEXT
) RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_reservation RECORD;
BEGIN
  -- Process all reservations for this session
  FOR v_reservation IN 
    SELECT * FROM inventory_reservations 
    WHERE session_id = p_session_id
  LOOP
    -- Deduct from stock
    UPDATE products 
    SET stock_quantity = stock_quantity - v_reservation.quantity,
        reserved_quantity = reserved_quantity - v_reservation.quantity,
        updated_at = NOW()
    WHERE id = v_reservation.product_id;

    -- Log transaction
    INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, balance_after, order_id)
    SELECT id, 'sale', -v_reservation.quantity, stock_quantity - reserved_quantity, p_order_id
    FROM products WHERE id = v_reservation.product_id;
  END LOOP;

  -- Clear all reservations for this session
  DELETE FROM inventory_reservations WHERE session_id = p_session_id;

  RETURN QUERY SELECT true, 'Order finalized'::TEXT;
END;
$$;

-- Function to cleanup expired reservations
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_reservation RECORD;
BEGIN
  FOR v_reservation IN 
    SELECT * FROM inventory_reservations 
    WHERE expires_at < NOW()
  LOOP
    PERFORM release_reservation(v_reservation.id);
  END LOOP;
END;
$$;

-- Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for products (read-only for public)
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Policies for reservations (session-based access)
CREATE POLICY "Users can view their own reservations" ON inventory_reservations
  FOR SELECT USING (true);

CREATE POLICY "Users can create reservations" ON inventory_reservations
  FOR INSERT WITH CHECK (true);

-- Insert initial products
INSERT INTO products (id, name, short_name, dosage, price, old_price, sku, description, stock_quantity, display_order)
VALUES 
  ('glp3-10', 'GLP-3 (RT) 10mg', 'GLP-3', '10 MG', 50.00, 75.00, 'DT-GLP3-010', 
   'GLP-3 is an investigational peptide and triple receptor agonist (GLP-1, GIP, and glucagon) studied for its potential role in metabolic regulation, including glucose balance, energy expenditure, and weight management pathways. For research use only.', 
   50, 1),
  ('glp3-20', 'GLP-3 (RT) 20mg', 'GLP-3', '20 MG', 99.00, 145.00, 'DT-GLP3-020', 
   'GLP-3 is an investigational peptide and triple receptor agonist (GLP-1, GIP, and glucagon) studied for its potential role in metabolic regulation, including glucose balance, energy expenditure, and weight management pathways. For research use only.', 
   30, 2),
  ('ghkcu-100', 'GHK-Cu 100MG', 'GHK-Cu', '100 MG', 30.00, 45.00, 'DT-GHKC-100', 
   'GHK-Cu is a copper peptide studied in research for its role in tissue repair, wound healing, and regenerative processes. For research use only.', 
   100, 3),
  ('motsc-10', 'MOTS-C 10 MG', 'MOTS-C', '10 MG', 30.00, 45.00, 'DT-MOTS-010', 
   'MOTS-C is a mitochondrial-derived peptide studied for its potential role in supporting metabolism, energy regulation, and overall cellular health. For research use only.', 
   75, 4)
ON CONFLICT (id) DO NOTHING;