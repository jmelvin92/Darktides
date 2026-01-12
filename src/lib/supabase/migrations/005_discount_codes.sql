-- Discount Codes System for Affiliate Tracking
-- Creates discount codes table and updates orders table for tracking

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT, -- Affiliate name/campaign identifier
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add discount tracking to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);

-- Function to validate and calculate discount
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code TEXT,
  p_subtotal DECIMAL
) RETURNS TABLE(
  valid BOOLEAN,
  discount_type TEXT,
  discount_value DECIMAL,
  discount_amount DECIMAL,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_discount RECORD;
  v_amount DECIMAL;
BEGIN
  -- Clean the input code (uppercase, trim)
  p_code := UPPER(TRIM(p_code));
  
  -- Look up the discount code
  SELECT * INTO v_discount
  FROM discount_codes
  WHERE UPPER(code) = p_code
    AND is_active = true
  LIMIT 1;
  
  -- Check if code exists and is active
  IF v_discount.id IS NULL THEN
    RETURN QUERY SELECT 
      false,
      NULL::TEXT,
      NULL::DECIMAL,
      NULL::DECIMAL,
      'Invalid or expired discount code'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate discount amount
  IF v_discount.discount_type = 'percentage' THEN
    v_amount := ROUND(p_subtotal * (v_discount.discount_value / 100), 2);
  ELSE -- fixed
    v_amount := LEAST(v_discount.discount_value, p_subtotal); -- Can't discount more than subtotal
  END IF;
  
  -- Return success with discount details
  RETURN QUERY SELECT 
    true,
    v_discount.discount_type,
    v_discount.discount_value,
    v_amount,
    'Discount applied successfully'::TEXT;
END;
$$;

-- Update finalize_order to handle discounts
CREATE OR REPLACE FUNCTION finalize_order(
  p_order_id TEXT,
  p_session_id TEXT,
  p_customer_data JSONB,
  p_cart_items JSONB,
  p_totals JSONB
) RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_product RECORD;
  v_item JSONB;
  v_discount_code TEXT;
  v_discount_amount DECIMAL;
BEGIN
  -- Extract discount info from totals if present
  v_discount_code := p_totals->>'discount_code';
  v_discount_amount := COALESCE((p_totals->>'discount_amount')::DECIMAL, 0);
  
  -- Process each cart item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    -- Lock the product row and check stock
    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item->>'id')::TEXT
    FOR UPDATE;
    
    IF v_product.id IS NULL THEN
      RETURN QUERY SELECT false, 'Product not found: ' || (v_item->>'id')::TEXT;
      RETURN;
    END IF;
    
    IF v_product.stock_quantity < (v_item->>'quantity')::INTEGER THEN
      RETURN QUERY SELECT false, 'Insufficient stock for: ' || v_product.name;
      RETURN;
    END IF;
    
    -- Deduct from stock
    UPDATE products 
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER,
        updated_at = NOW()
    WHERE id = v_product.id;
    
    -- Log transaction
    INSERT INTO inventory_transactions (
      product_id, 
      transaction_type, 
      quantity_change, 
      balance_after, 
      order_id,
      metadata
    )
    VALUES (
      v_product.id,
      'sale',
      -(v_item->>'quantity')::INTEGER,
      v_product.stock_quantity - (v_item->>'quantity')::INTEGER,
      p_order_id,
      jsonb_build_object(
        'session_id', p_session_id,
        'unit_price', (v_item->>'price')::DECIMAL
      )
    );
  END LOOP;
  
  -- Create the order record with discount info
  INSERT INTO orders (
    order_number,
    customer_first_name,
    customer_last_name,
    customer_email,
    customer_phone,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip,
    order_notes,
    items,
    subtotal,
    shipping_cost,
    total,
    discount_code,
    discount_amount,
    status
  ) VALUES (
    p_order_id,
    p_customer_data->>'firstName',
    p_customer_data->>'lastName',
    p_customer_data->>'email',
    p_customer_data->>'phone',
    p_customer_data->>'address',
    p_customer_data->>'city',
    p_customer_data->>'state',
    p_customer_data->>'zip',
    p_customer_data->>'orderNotes',
    p_cart_items,
    (p_totals->>'subtotal')::DECIMAL,
    (p_totals->>'shipping')::DECIMAL,
    (p_totals->>'total')::DECIMAL,
    v_discount_code,
    v_discount_amount,
    'confirmed'
  );
  
  -- Increment usage count for discount code if used
  IF v_discount_code IS NOT NULL THEN
    UPDATE discount_codes
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE UPPER(code) = UPPER(v_discount_code);
  END IF;
  
  RETURN QUERY SELECT true, 'Order completed successfully'::TEXT;
END;
$$;

-- RLS Policies for discount_codes
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Allow public to validate codes (read-only)
CREATE POLICY "Public can validate discount codes" ON discount_codes
  FOR SELECT USING (is_active = true);

-- Insert some example discount codes (commented out - run manually as needed)
/*
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES 
  ('LAUNCH20', 'Launch Promotion', 'percentage', 20),
  ('SAVE10', 'General Discount', 'fixed', 10),
  ('PEPTIDE15', 'Peptide Special', 'percentage', 15);
*/

-- Useful queries for managing affiliates (save these for reference)
/*
-- View all active codes
SELECT code, description, discount_type, discount_value, usage_count 
FROM discount_codes 
WHERE is_active = true
ORDER BY created_at DESC;

-- Get monthly affiliate report
SELECT 
  o.discount_code,
  dc.description as affiliate,
  COUNT(*) as total_orders,
  SUM(o.total) as total_revenue,
  SUM(o.discount_amount) as total_discounts
FROM orders o
LEFT JOIN discount_codes dc ON UPPER(dc.code) = UPPER(o.discount_code)
WHERE o.discount_code IS NOT NULL 
  AND o.created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY o.discount_code, dc.description
ORDER BY total_revenue DESC;

-- Disable a code
UPDATE discount_codes SET is_active = false WHERE code = 'OLDCODE';

-- Add new affiliate code
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES ('AFFILIATE1', 'Instagram - John Doe', 'percentage', 20);
*/