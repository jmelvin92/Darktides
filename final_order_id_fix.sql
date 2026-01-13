-- FINAL FIX: Force order_number to use exact frontend ID
-- This completely replaces the finalize_order function to guarantee consistency

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
  -- Extract discount information
  IF p_totals IS NOT NULL THEN
    v_discount_code := p_totals->>'discount_code';
    v_discount_amount := COALESCE((p_totals->>'discount_amount')::DECIMAL, 0);
  END IF;
  
  -- Process inventory
  IF p_cart_items IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
      v_product_id := v_item->>'id';
      v_quantity := (v_item->>'quantity')::INTEGER;
      
      SELECT stock_quantity INTO v_available
      FROM products WHERE id = v_product_id FOR UPDATE;
      
      IF v_available IS NULL OR v_available < v_quantity THEN
        RETURN QUERY SELECT false, 'Insufficient inventory'::TEXT;
        RETURN;
      END IF;
      
      UPDATE products 
      SET stock_quantity = stock_quantity - v_quantity,
          updated_at = NOW()
      WHERE id = v_product_id;
      
      INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, balance_after)
      SELECT id, 'sale', -v_quantity, stock_quantity
      FROM products WHERE id = v_product_id;
    END LOOP;
  END IF;
  
  -- Create order with EXACT frontend order ID
  IF p_customer_data IS NOT NULL THEN
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
      discount_code,
      discount_amount
    ) VALUES (
      p_order_id,  -- EXACT MATCH: Frontend ID = Database ID = Email ID
      p_customer_data->>'firstName',
      p_customer_data->>'lastName',
      p_customer_data->>'email',
      p_customer_data->>'phone',
      p_customer_data->>'address',
      p_customer_data->>'city',
      p_customer_data->>'state',
      p_customer_data->>'zip',
      p_customer_data->>'orderNotes',
      (p_totals->>'subtotal')::DECIMAL,
      (p_totals->>'shipping')::DECIMAL,
      (p_totals->>'total')::DECIMAL,
      p_cart_items,
      p_session_id,
      'confirmed',
      'pending',
      v_discount_code,
      v_discount_amount
    ) RETURNING id INTO v_order_uuid;
    
    -- Update discount usage
    IF v_discount_code IS NOT NULL THEN
      UPDATE discount_codes
      SET usage_count = usage_count + 1
      WHERE UPPER(code) = UPPER(v_discount_code);
    END IF;
  END IF;
  
  RETURN QUERY SELECT true, 'Order created'::TEXT;
END;
$$;