-- Apply this migration to fix finalize_order to work without reservations

-- Simplified finalize_order that works without reservations
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
BEGIN
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
      payment_status
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
      'confirmed',
      'pending'
    ) RETURNING id INTO v_order_uuid;
  END IF;
  
  RETURN QUERY SELECT true, COALESCE(v_order_uuid::TEXT, 'Order finalized')::TEXT;
END;
$$;

-- Also simplify reserve_inventory to just check availability
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_product_id TEXT, 
  p_quantity INTEGER, 
  p_session_id TEXT
) RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available INTEGER;
BEGIN
  -- Just check if product exists and has enough stock
  SELECT stock_quantity 
  INTO v_available
  FROM products 
  WHERE id = p_product_id;
  
  IF v_available IS NULL THEN
    RETURN QUERY SELECT false, 'Product not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_available < p_quantity THEN
    RETURN QUERY SELECT false, 'Insufficient inventory'::TEXT;
    RETURN;
  END IF;
  
  -- Return success without actually reserving anything
  RETURN QUERY SELECT true, 'Available'::TEXT;
END;
$$;