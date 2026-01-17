-- Clean rebuild of finalize_order functions
-- Run this entire file at once

-- First drop everything
DROP FUNCTION IF EXISTS finalize_order(text,text) CASCADE;
DROP FUNCTION IF EXISTS finalize_order(text,text,jsonb,jsonb,jsonb) CASCADE;
DROP FUNCTION IF EXISTS finalize_order(text,text,jsonb,jsonb,jsonb,text) CASCADE;
DROP FUNCTION IF EXISTS confirm_crypto_order(text) CASCADE;

-- Create 6 parameter version
CREATE FUNCTION finalize_order(
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
  BEGIN
    IF p_customer_data IS NOT NULL AND p_cart_items IS NOT NULL AND p_totals IS NOT NULL THEN
      
      FOR v_product_id, v_quantity IN
        SELECT (item->>'id')::TEXT, (item->>'quantity')::INTEGER
        FROM jsonb_array_elements(p_cart_items) AS item
      LOOP
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
        
        UPDATE products 
        SET stock_quantity = stock_quantity - v_quantity,
            updated_at = NOW()
        WHERE id = v_product_id;
        
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
        CASE 
          WHEN p_payment_method = 'crypto' THEN 'pending'
          ELSE 'confirmed'
        END,
        CASE 
          WHEN p_payment_method = 'crypto' THEN 'pending_crypto'
          ELSE 'pending'
        END,
        p_payment_method
      ) RETURNING id INTO v_order_uuid;
      
      IF (p_totals->>'discount_code') IS NOT NULL THEN
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'discount_codes' 
          AND column_name = 'last_used_at'
        ) THEN
          UPDATE discount_codes 
          SET usage_count = usage_count + 1,
              last_used_at = NOW()
          WHERE code = (p_totals->>'discount_code')::TEXT
            AND is_active = true;
        ELSE
          UPDATE discount_codes 
          SET usage_count = usage_count + 1
          WHERE code = (p_totals->>'discount_code')::TEXT
            AND is_active = true;
        END IF;
      END IF;
    END IF;
    
    RETURN QUERY SELECT true, p_order_id::TEXT;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error in finalize_order: %', SQLERRM;
      RETURN QUERY SELECT false, SQLERRM::TEXT;
  END;
END;
$$;

-- Create 5 parameter version
CREATE FUNCTION finalize_order(
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION finalize_order(TEXT, TEXT, JSONB, JSONB, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION finalize_order(TEXT, TEXT, JSONB, JSONB, JSONB) TO anon, authenticated;

-- Create confirm crypto order function
CREATE FUNCTION confirm_crypto_order(p_order_number TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE orders 
  SET status = 'confirmed',
      payment_status = 'completed',
      updated_at = NOW()
  WHERE order_number = p_order_number 
    AND payment_method = 'crypto'
    AND status = 'pending';
    
  IF FOUND THEN
    RETURN QUERY SELECT true, 'Order confirmed'::TEXT;
  ELSE
    RETURN QUERY SELECT false, 'Order not found, not a crypto order, or already confirmed'::TEXT;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_crypto_order(TEXT) TO anon, authenticated;