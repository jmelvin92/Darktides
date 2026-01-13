-- Fix: Make all new orders default to 'pending' status AND still send email immediately
-- The email notifies you of the pending order awaiting payment verification

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
  
  -- Create order record with 'pending' status
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
      status,            -- Set to 'pending' for new orders
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
      'pending',         -- CHANGED TO 'pending'
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

-- Update the email trigger to send emails for BOTH 'pending' and 'confirmed' orders
-- This way you get notified immediately when an order is placed
DROP TRIGGER IF EXISTS send_order_email_on_insert ON orders;
DROP TRIGGER IF EXISTS send_order_email_on_confirmed ON orders;
DROP FUNCTION IF EXISTS notify_order_confirmed();
DROP FUNCTION IF EXISTS notify_new_order();

-- Create function to trigger email notification
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Send email for new orders (pending) and when confirmed
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status = 'pending') THEN
    -- The Edge Function will be called automatically
    RAISE NOTICE 'Order % notification triggered (status: %)', NEW.order_number, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT (new pending orders)
CREATE TRIGGER send_order_email_on_insert
  AFTER INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_new_order();

-- Create trigger for UPDATE (when status changes to confirmed)  
CREATE TRIGGER send_order_email_on_update
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status = 'pending')
  EXECUTE FUNCTION notify_new_order();

-- Verify the changes
SELECT 'Orders will now be created with "pending" status' AS message;
SELECT 'Emails will be sent immediately when order is placed (pending)' AS message2;
SELECT 'You can update to "confirmed" in admin panel for your tracking' AS message3;