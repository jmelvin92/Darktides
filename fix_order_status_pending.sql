-- Fix: Make all new orders default to 'pending' status instead of 'confirmed'
-- Orders should only become 'confirmed' after payment verification

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
  v_item RECORD;
  v_current_stock INTEGER;
  v_order_details TEXT;
BEGIN
  -- For each item in the cart
  IF p_cart_items IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
      -- Lock the product row and check stock (with SELECT FOR UPDATE to prevent race conditions)
      SELECT stock_quantity INTO v_current_stock
      FROM products
      WHERE id = (v_item.value->>'id')::TEXT
      FOR UPDATE;
      
      -- Check if we have enough stock
      IF v_current_stock IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Product not found: ' || (v_item.value->>'name')::TEXT;
        RETURN;
      END IF;
      
      IF v_current_stock < (v_item.value->>'quantity')::INTEGER THEN
        RETURN QUERY SELECT FALSE, 'Insufficient stock for: ' || (v_item.value->>'name')::TEXT;
        RETURN;
      END IF;
      
      -- Deduct from stock
      UPDATE products
      SET stock_quantity = stock_quantity - (v_item.value->>'quantity')::INTEGER
      WHERE id = (v_item.value->>'id')::TEXT;
      
      -- Log transaction
      INSERT INTO inventory_transactions (
        product_id, 
        transaction_type, 
        quantity, 
        order_id, 
        notes
      ) VALUES (
        (v_item.value->>'id')::TEXT,
        'sale',
        (v_item.value->>'quantity')::INTEGER,
        p_order_id,
        'Order finalized'
      );
    END LOOP;
  END IF;
  
  -- Create order record (ENHANCED with discount fields)
  -- IMPORTANT CHANGE: Set status to 'pending' instead of 'confirmed'
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
      status,            -- CHANGED: Now defaults to 'pending'
      payment_status,
      discount_code,
      discount_amount
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
      'pending',         -- CHANGED FROM 'confirmed' TO 'pending'
      'awaiting_payment',
      (p_totals->>'discount_code')::TEXT,
      (p_totals->>'discount_amount')::DECIMAL
    );
    
    -- Build order summary for response
    v_order_details := 'Order ' || p_order_id || ' created successfully';
  END IF;
  
  -- Increment discount code usage if provided
  IF p_totals IS NOT NULL AND p_totals->>'discount_code' IS NOT NULL THEN
    UPDATE discount_codes
    SET usage_count = usage_count + 1
    WHERE code = (p_totals->>'discount_code')::TEXT
      AND is_active = true;
  END IF;
  
  RETURN QUERY SELECT TRUE, COALESCE(v_order_details, 'Order completed successfully');
END;
$$;

-- Update the email trigger to only send emails when status changes TO 'confirmed'
-- (not when order is initially created as 'pending')
CREATE OR REPLACE FUNCTION notify_order_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status CHANGES TO 'confirmed'
  -- Not on initial insert with 'pending' status
  IF (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status != 'confirmed') THEN
    -- This will trigger the email via Edge Function
    -- The Edge Function call stays the same
    RAISE NOTICE 'Order % status changed to confirmed, triggering email', NEW.order_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS send_order_email_on_confirmed ON orders;

-- Create new trigger that only fires on UPDATE when status changes to 'confirmed'
CREATE TRIGGER send_order_email_on_confirmed
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status != 'confirmed')
  EXECUTE FUNCTION notify_order_confirmed();

-- Verify the changes
SELECT 'Orders will now be created with "pending" status by default' AS message;
SELECT 'Emails will only be sent when you manually change status to "confirmed" in admin' AS message2;