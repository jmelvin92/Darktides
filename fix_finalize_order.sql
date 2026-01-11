-- Fix the finalize_order function - the UPDATE statement needs a WHERE clause
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
  v_reservation RECORD;
  v_order_uuid UUID;
BEGIN
  -- First, clean up any expired reservations
  DELETE FROM inventory_reservations WHERE expires_at <= NOW();
  
  -- Update reserved quantities for expired reservations - FIX: Add WHERE clause
  UPDATE products 
  SET reserved_quantity = (
    SELECT COALESCE(SUM(quantity), 0)
    FROM inventory_reservations 
    WHERE product_id = products.id AND expires_at > NOW()
  )
  WHERE id IN (
    SELECT DISTINCT product_id 
    FROM inventory_reservations 
    WHERE expires_at <= NOW()
  );
  
  -- Check if we have valid reservations for this session
  IF NOT EXISTS (
    SELECT 1 FROM inventory_reservations 
    WHERE session_id = p_session_id AND expires_at > NOW()
  ) THEN
    RETURN QUERY SELECT false, 'No active reservations found'::TEXT;
    RETURN;
  END IF;
  
  -- Process reservations and deduct from inventory
  FOR v_reservation IN 
    SELECT product_id, quantity
    FROM inventory_reservations 
    WHERE session_id = p_session_id AND expires_at > NOW()
  LOOP
    -- Deduct from stock
    UPDATE products 
    SET stock_quantity = stock_quantity - v_reservation.quantity,
        reserved_quantity = reserved_quantity - v_reservation.quantity,
        updated_at = NOW()
    WHERE id = v_reservation.product_id;
    
    -- Log transaction
    INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, balance_after)
    SELECT id, 'sale', -v_reservation.quantity, stock_quantity
    FROM products WHERE id = v_reservation.product_id;
  END LOOP;
  
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
  
  -- Remove processed reservations
  DELETE FROM inventory_reservations 
  WHERE session_id = p_session_id;
  
  RETURN QUERY SELECT true, COALESCE(v_order_uuid::TEXT, 'Order finalized')::TEXT;
END;
$$;