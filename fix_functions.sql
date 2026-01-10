-- Fix reserve_inventory function with proper permissions
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
  v_reservation_id UUID;
BEGIN
  -- Lock the product row
  SELECT stock_quantity - COALESCE(reserved_quantity, 0) INTO v_available
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
  SET reserved_quantity = COALESCE(reserved_quantity, 0) + p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id;
  
  -- Create reservation
  INSERT INTO inventory_reservations (session_id, product_id, quantity, expires_at)
  VALUES (p_session_id, p_product_id, p_quantity, NOW() + INTERVAL '30 minutes')
  RETURNING id INTO v_reservation_id;
  
  -- Log transaction
  INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, balance_after)
  SELECT id, 'reserve', p_quantity, stock_quantity - COALESCE(reserved_quantity, 0)
  FROM products WHERE id = p_product_id;
  
  RETURN QUERY SELECT true, v_reservation_id::TEXT;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reserve_inventory TO anon, authenticated;

-- Fix finalize_order function with proper permissions
CREATE OR REPLACE FUNCTION finalize_order(
  p_order_id TEXT,
  p_session_id TEXT
) RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation RECORD;
BEGIN
  -- Get all reservations for this session
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
  
  -- Remove all reservations for this session
  DELETE FROM inventory_reservations WHERE session_id = p_session_id;
  
  RETURN QUERY SELECT true, 'Order finalized'::TEXT;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION finalize_order TO anon, authenticated;