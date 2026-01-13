-- URGENT FIX: Order ID mismatch between customer and email
-- This ensures the order_number field correctly uses the passed p_order_id

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
  -- Extract discount information from totals if provided
  IF p_totals IS NOT NULL THEN
    v_discount_code := p_totals->>'discount_code';
    v_discount_amount := COALESCE((p_totals->>'discount_amount')::DECIMAL, 0);
  END IF;
  
  -- Process each cart item if provided
  IF p_cart_items IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
      v_product_id := v_item->>'id';
      v_quantity := (v_item->>'quantity')::INTEGER;
      
      -- Check stock availability with row lock
      SELECT stock_quantity INTO v_available
      FROM products 
      WHERE id = v_product_id
      FOR UPDATE;
      
      IF v_available IS NULL THEN
        RETURN QUERY SELECT false, ('Product not found: ' || v_product_id)::TEXT;
        RETURN;
      END IF;
      
      IF v_available < v_quantity THEN
        RETURN QUERY SELECT false, ('Insufficient inventory for ' || v_product_id)::TEXT;
        RETURN;
      END IF;
      
      -- Deduct from stock
      UPDATE products 
      SET stock_quantity = stock_quantity - v_quantity,
          updated_at = NOW()
      WHERE id = v_product_id;
      
      -- Log transaction
      INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, balance_after)
      SELECT id, 'sale', -v_quantity, stock_quantity
      FROM products WHERE id = v_product_id;
    END LOOP;
  END IF;
  
  -- Create order record if customer data is provided
  IF p_customer_data IS NOT NULL AND p_cart_items IS NOT NULL AND p_totals IS NOT NULL THEN
    INSERT INTO orders (
      order_number,           -- THIS MUST USE p_order_id
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
      discount_code,
      discount_amount
    ) VALUES (
      p_order_id,             -- CRITICAL: Use the exact order ID from frontend
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
      'confirmed',            -- This triggers the email
      'pending',
      v_discount_code,
      v_discount_amount
    ) RETURNING id INTO v_order_uuid;
    
    -- Increment usage count for discount code if used
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION finalize_order TO anon, authenticated;