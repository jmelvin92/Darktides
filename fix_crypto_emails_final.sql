-- FINAL FIX: Make crypto orders work exactly like Venmo orders
-- Instead of inserting as 'pending' and updating later, insert as 'confirmed' immediately

-- Drop the existing functions
DROP FUNCTION IF EXISTS finalize_order(TEXT, TEXT, JSONB, JSONB, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS finalize_order(TEXT, TEXT, JSONB, JSONB, JSONB) CASCADE;

-- Create the updated 6-parameter version
CREATE OR REPLACE FUNCTION finalize_order(
  p_order_id TEXT,
  p_session_id TEXT,
  p_customer_data JSONB,
  p_cart_items JSONB,
  p_totals JSONB,
  p_payment_method TEXT
) RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id TEXT;
  v_quantity INTEGER;
  v_order_uuid UUID;
  v_available_stock INTEGER;
BEGIN
  -- Start transaction
  BEGIN
    -- Create order record if customer data is provided
    IF p_customer_data IS NOT NULL AND p_cart_items IS NOT NULL AND p_totals IS NOT NULL THEN
      
      -- Process each cart item
      FOR v_product_id, v_quantity IN
        SELECT (item->>'id')::TEXT, (item->>'quantity')::INTEGER
        FROM jsonb_array_elements(p_cart_items) AS item
      LOOP
        -- Lock the product row and check stock
        SELECT stock_quantity INTO v_available_stock
        FROM products
        WHERE id = v_product_id
        FOR UPDATE;
        
        IF v_available_stock IS NULL THEN
          RAISE EXCEPTION 'Product % not found', v_product_id;
        END IF;
        
        IF v_available_stock < v_quantity THEN
          RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
        END IF;
        
        -- Deduct from stock
        UPDATE products 
        SET stock_quantity = stock_quantity - v_quantity,
            updated_at = NOW()
        WHERE id = v_product_id;
        
        -- Log transaction
        INSERT INTO inventory_transactions (
          product_id, 
          transaction_type, 
          quantity_change, 
          balance_after, 
          order_id,
          metadata
        )
        SELECT 
          id, 
          'sale', 
          -v_quantity, 
          stock_quantity,
          p_order_id,
          jsonb_build_object('payment_method', p_payment_method)
        FROM products 
        WHERE id = v_product_id;
      END LOOP;
      
      -- THE FIX: Always insert orders as 'confirmed' regardless of payment method
      -- This ensures the email trigger fires for both Venmo AND Crypto
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
        discount_code,
        discount_amount,
        items,
        session_id,
        status,
        payment_status,
        payment_method
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
        (p_totals->>'discount_code')::TEXT,
        (p_totals->>'discount_amount')::DECIMAL,
        p_cart_items,
        p_session_id,
        'confirmed', -- ALWAYS confirmed, for both Venmo and Crypto
        CASE 
          WHEN p_payment_method = 'crypto' THEN 'pending_crypto'
          ELSE 'pending'
        END,
        p_payment_method
      ) RETURNING id INTO v_order_uuid;
      
      -- Update discount code usage if applicable
      IF (p_totals->>'discount_code') IS NOT NULL THEN
        UPDATE discount_codes 
        SET usage_count = usage_count + 1,
            last_used_at = NOW()
        WHERE code = (p_totals->>'discount_code')::TEXT
          AND is_active = true;
      END IF;
    END IF;
    
    RETURN QUERY SELECT true, p_order_id::TEXT;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback on any error
      RAISE NOTICE 'Error in finalize_order: %', SQLERRM;
      RETURN QUERY SELECT false, SQLERRM::TEXT;
  END;
END;
$$;

-- Create the 5-parameter version that calls the 6-parameter version
CREATE OR REPLACE FUNCTION finalize_order(
  p_order_id TEXT,
  p_session_id TEXT,
  p_customer_data JSONB,
  p_cart_items JSONB,
  p_totals JSONB
) RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the 6-parameter version with default payment method
  RETURN QUERY 
  SELECT * FROM finalize_order(
    p_order_id,
    p_session_id,
    p_customer_data,
    p_cart_items,
    p_totals,
    'venmo'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION finalize_order(TEXT, TEXT, JSONB, JSONB, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION finalize_order(TEXT, TEXT, JSONB, JSONB, JSONB) TO anon, authenticated;