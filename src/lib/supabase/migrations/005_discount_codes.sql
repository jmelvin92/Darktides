-- SAFE Discount Codes System Migration
-- Preserves all existing functionality including email triggers
-- =====================================================

-- 1. Create discount_codes table (safe - new table)
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

-- 2. Add discount columns to orders table (safe - only adds columns)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- 3. Create indexes (safe - new indexes)
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);

-- 4. Create discount validation function (safe - new function)
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

-- 5. DROP old finalize_order function with exact signature match
DROP FUNCTION IF EXISTS finalize_order(TEXT, TEXT, JSONB, JSONB, JSONB);

-- 6. Create ENHANCED finalize_order that preserves ALL existing functionality
CREATE OR REPLACE FUNCTION finalize_order(
  p_order_id TEXT,
  p_session_id TEXT,
  p_customer_data JSONB DEFAULT NULL,
  p_cart_items JSONB DEFAULT NULL,
  p_totals JSONB DEFAULT NULL
) RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_uuid UUID;
  v_item JSONB;
  v_product_id TEXT;
  v_quantity INTEGER;
  v_available INTEGER;
  v_discount_code TEXT;
  v_discount_amount DECIMAL;
BEGIN
  -- Extract discount info from totals if present
  v_discount_code := p_totals->>'discount_code';
  v_discount_amount := COALESCE((p_totals->>'discount_amount')::DECIMAL, 0);
  
  -- Process each cart item (UNCHANGED LOGIC)
  IF p_cart_items IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
      v_product_id := v_item->>'id';
      v_quantity := (v_item->>'quantity')::INTEGER;
      
      -- Check stock availability with row lock (UNCHANGED)
      SELECT stock_quantity INTO v_available
      FROM products 
      WHERE id = v_product_id
      FOR UPDATE;
      
      IF v_available < v_quantity THEN
        RETURN QUERY SELECT false, 'Insufficient inventory for ' || v_product_id::TEXT;
        RETURN;
      END IF;
      
      -- Deduct from stock (UNCHANGED)
      UPDATE products 
      SET stock_quantity = stock_quantity - v_quantity,
          updated_at = NOW()
      WHERE id = v_product_id;
      
      -- Log transaction (UNCHANGED)
      INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, balance_after)
      SELECT id, 'sale', -v_quantity, stock_quantity
      FROM products WHERE id = v_product_id;
    END LOOP;
  END IF;
  
  -- Create order record (ENHANCED with discount fields)
  -- This will trigger the email automatically via the existing trigger
  IF p_customer_data IS NOT NULL AND p_cart_items IS NOT NULL AND p_totals IS NOT NULL THEN
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
      subtotal,
      shipping_cost,
      total,
      items,
      session_id,
      status,
      payment_status,
      discount_code,      -- NEW: Add discount code
      discount_amount     -- NEW: Add discount amount
    ) VALUES (
      p_order_id,
      (p_customer_data->>'firstName')::TEXT,
      (p_customer_data->>'lastName')::TEXT,
      (p_customer_data->>'email')::TEXT,
      (p_customer_data->>'phone')::TEXT,
      (p_customer_data->>'address')::TEXT,
      (p_customer_data->>'city')::TEXT,
      (p_customer_data->>'state')::TEXT,
      (p_customer_data->>'zip')::TEXT,
      (p_customer_data->>'orderNotes')::TEXT,
      (p_totals->>'subtotal')::DECIMAL,
      (p_totals->>'shipping')::DECIMAL,
      (p_totals->>'total')::DECIMAL,
      p_cart_items,
      p_session_id,
      'confirmed',        -- This triggers the email
      'pending',
      v_discount_code,    -- NEW: Store discount code
      v_discount_amount   -- NEW: Store discount amount
    ) RETURNING id INTO v_order_uuid;
    
    -- Increment usage count for discount code if used (NEW)
    IF v_discount_code IS NOT NULL THEN
      UPDATE discount_codes
      SET usage_count = usage_count + 1,
          updated_at = NOW()
      WHERE UPPER(code) = UPPER(v_discount_code);
    END IF;
  END IF;
  
  RETURN QUERY SELECT true, COALESCE(v_order_uuid::TEXT, 'Order finalized')::TEXT;
END;
$$;

-- 7. Enable RLS for discount_codes (safe - new table)
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- 8. Create policy for public validation (safe - new policy)
CREATE POLICY "Public can validate discount codes" ON discount_codes
  FOR SELECT USING (is_active = true);

-- 9. Grant necessary permissions (safe - preserves existing functionality)
GRANT EXECUTE ON FUNCTION validate_discount_code TO anon, authenticated;
GRANT EXECUTE ON FUNCTION finalize_order TO anon, authenticated;

-- =====================================================
-- TEST DATA (commented out - run manually if needed)
-- =====================================================
/*
-- Add some test discount codes
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES 
  ('LAUNCH20', 'Launch Promotion', 'percentage', 20),
  ('SAVE10', 'General Discount', 'fixed', 10);

-- View active codes
SELECT code, description, discount_type, discount_value, usage_count 
FROM discount_codes 
WHERE is_active = true;
*/

-- =====================================================
-- VERIFICATION QUERY - Run this to confirm email trigger is intact
-- =====================================================
/*
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid::regclass::text = 'orders'
  AND tgname = 'trigger_new_order_email';
*/