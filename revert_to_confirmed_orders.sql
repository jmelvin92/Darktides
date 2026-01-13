-- REVERT: Go back to orders being 'confirmed' on creation (the working version)
-- This restores the original behavior where orders are confirmed immediately

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
  
  -- Create order record with 'confirmed' status (REVERTED TO ORIGINAL)
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
      status,            -- BACK TO 'confirmed'
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
      'confirmed',         -- REVERTED BACK TO 'confirmed'
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

-- Remove any triggers that were modified
DROP TRIGGER IF EXISTS send_order_email_on_confirmed ON orders;
DROP TRIGGER IF EXISTS send_order_email_on_insert ON orders;
DROP TRIGGER IF EXISTS send_order_email_on_update ON orders;

-- Restore the original trigger if it's missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_send_order_email'
  ) THEN
    -- Recreate the original trigger that sends email on confirmed orders
    CREATE TRIGGER trigger_send_order_email
      AFTER INSERT OR UPDATE ON orders
      FOR EACH ROW
      WHEN (NEW.status = 'confirmed')
      EXECUTE FUNCTION net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-order-email',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := row_to_json(NEW)::jsonb
      );
  END IF;
END $$;

SELECT 'Reverted to original behavior: orders are created as confirmed and emails send immediately' AS result;