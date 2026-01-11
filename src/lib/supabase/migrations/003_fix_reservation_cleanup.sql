-- Fix reservation cleanup to properly clear expired reservations
-- This migration fixes the issue where reserved quantities never clear

-- Function to properly cleanup expired reservations
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cleaned_count INTEGER := 0;
  v_reservation RECORD;
BEGIN
  -- Loop through all expired reservations
  FOR v_reservation IN 
    SELECT id, product_id, quantity 
    FROM inventory_reservations 
    WHERE expires_at <= NOW()
  LOOP
    -- Update the product's reserved quantity
    UPDATE products 
    SET reserved_quantity = GREATEST(0, reserved_quantity - v_reservation.quantity),
        updated_at = NOW()
    WHERE id = v_reservation.product_id;
    
    -- Log the cleanup
    INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, balance_after)
    SELECT id, 'cleanup', 0, stock_quantity
    FROM products WHERE id = v_reservation.product_id;
    
    v_cleaned_count := v_cleaned_count + 1;
  END LOOP;
  
  -- Delete all expired reservations
  DELETE FROM inventory_reservations WHERE expires_at <= NOW();
  
  -- Recalculate reserved quantities for all products that had reservations
  UPDATE products 
  SET reserved_quantity = COALESCE((
    SELECT SUM(quantity)
    FROM inventory_reservations 
    WHERE product_id = products.id AND expires_at > NOW()
  ), 0)
  WHERE id IN (
    SELECT DISTINCT product_id 
    FROM inventory_reservations
  );
  
  RETURN v_cleaned_count;
END;
$$;

-- Fix the finalize_order function with proper WHERE clause
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
  v_cleanup_count INTEGER;
BEGIN
  -- First, clean up any expired reservations
  v_cleanup_count := cleanup_expired_reservations();
  
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
    -- Deduct from stock and reserved
    UPDATE products 
    SET stock_quantity = stock_quantity - v_reservation.quantity,
        reserved_quantity = GREATEST(0, reserved_quantity - v_reservation.quantity),
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

-- Update reserve_inventory to cleanup expired reservations first
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
  v_reserved INTEGER;
  v_reservation_id UUID;
  v_cleanup_count INTEGER;
BEGIN
  -- Clean up expired reservations first
  v_cleanup_count := cleanup_expired_reservations();
  
  -- Check if product exists and has enough inventory
  SELECT stock_quantity, reserved_quantity 
  INTO v_available, v_reserved
  FROM products 
  WHERE id = p_product_id
  FOR UPDATE; -- Lock the row for update
  
  IF v_available IS NULL THEN
    RETURN QUERY SELECT false, 'Product not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_available - v_reserved < p_quantity THEN
    RETURN QUERY SELECT false, 'Insufficient inventory'::TEXT;
    RETURN;
  END IF;
  
  -- Check for existing reservation for this product/session
  SELECT id INTO v_reservation_id
  FROM inventory_reservations
  WHERE product_id = p_product_id AND session_id = p_session_id AND expires_at > NOW();
  
  IF v_reservation_id IS NOT NULL THEN
    -- Update existing reservation
    UPDATE inventory_reservations 
    SET quantity = p_quantity, 
        expires_at = NOW() + INTERVAL '10 minutes',
        updated_at = NOW()
    WHERE id = v_reservation_id;
  ELSE
    -- Create new reservation (10 minutes)
    INSERT INTO inventory_reservations (product_id, session_id, quantity, expires_at)
    VALUES (p_product_id, p_session_id, p_quantity, NOW() + INTERVAL '10 minutes')
    RETURNING id INTO v_reservation_id;
  END IF;
  
  -- Update product reserved quantity
  UPDATE products 
  SET reserved_quantity = COALESCE((
    SELECT SUM(quantity) 
    FROM inventory_reservations 
    WHERE product_id = p_product_id AND expires_at > NOW()
  ), 0),
  updated_at = NOW()
  WHERE id = p_product_id;
  
  -- Log transaction
  INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, balance_after)
  SELECT id, 'reserve', p_quantity, stock_quantity - reserved_quantity
  FROM products WHERE id = p_product_id;
  
  RETURN QUERY SELECT true, v_reservation_id::TEXT;
END;
$$;

-- Create a function that can be called periodically to cleanup
-- This can be called via cron job, Edge Function, or manually
CREATE OR REPLACE FUNCTION public_cleanup_expired_reservations()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  v_count := cleanup_expired_reservations();
  RETURN json_build_object(
    'success', true,
    'cleaned_count', v_count,
    'timestamp', NOW()
  );
END;
$$;

-- Grant execute permission to anon role so it can be called from the frontend
GRANT EXECUTE ON FUNCTION public_cleanup_expired_reservations() TO anon;