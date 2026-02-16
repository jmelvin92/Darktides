-- Migration 014: Split order creation from order confirmation
--
-- Problem: finalize_order() deducts inventory at checkout time (before payment is verified),
-- causing abandoned carts to reduce stock and premature order emails.
--
-- Solution:
--   1. finalize_order() now ONLY creates the order record (status='pending', no stock deduction)
--   2. New confirm_order() function handles inventory deduction + status='confirmed'
--   3. Admin confirms orders in the panel after verifying payment

-- =============================================================================
-- 1. Replace finalize_order() — remove inventory deduction
-- =============================================================================

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
  v_order_uuid UUID;
BEGIN
  BEGIN
    IF p_customer_data IS NOT NULL AND p_cart_items IS NOT NULL AND p_totals IS NOT NULL THEN

      -- Create the order with status='pending' — NO inventory deduction
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
        'pending',  -- ALL orders start as pending regardless of payment method
        CASE
          WHEN p_payment_method = 'crypto' THEN 'pending_crypto'
          ELSE 'pending'
        END,
        p_payment_method
      ) RETURNING id INTO v_order_uuid;

      -- Update discount code usage if applicable
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

-- 5-parameter overload delegates to 6-parameter version
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

GRANT EXECUTE ON FUNCTION finalize_order(TEXT, TEXT, JSONB, JSONB, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION finalize_order(TEXT, TEXT, JSONB, JSONB, JSONB) TO anon, authenticated;

-- =============================================================================
-- 2. New confirm_order() — deducts inventory atomically, called from admin panel
-- =============================================================================

CREATE OR REPLACE FUNCTION confirm_order(p_order_number TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order_status TEXT;
  v_items JSONB;
  v_product_id TEXT;
  v_quantity INTEGER;
  v_available_stock INTEGER;
BEGIN
  BEGIN
    -- Look up the order and lock it
    SELECT id, status, items
    INTO v_order_id, v_order_status, v_items
    FROM orders
    WHERE order_number = p_order_number
    FOR UPDATE;

    IF v_order_id IS NULL THEN
      RETURN QUERY SELECT false, ('Order not found: ' || p_order_number)::TEXT;
      RETURN;
    END IF;

    IF v_order_status = 'confirmed' THEN
      RETURN QUERY SELECT false, 'Order is already confirmed'::TEXT;
      RETURN;
    END IF;

    -- Loop through items, lock each product row, check stock, deduct
    FOR v_product_id, v_quantity IN
      SELECT (item->>'id')::TEXT, (item->>'quantity')::INTEGER
      FROM jsonb_array_elements(v_items) AS item
    LOOP
      -- Lock the product row
      SELECT stock_quantity INTO v_available_stock
      FROM products
      WHERE id = v_product_id
      FOR UPDATE;

      IF v_available_stock IS NULL THEN
        RAISE EXCEPTION 'Product % not found', v_product_id;
      END IF;

      IF v_available_stock < v_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product % (available: %, requested: %)', v_product_id, v_available_stock, v_quantity;
      END IF;

      -- Deduct stock
      UPDATE products
      SET stock_quantity = stock_quantity - v_quantity,
          updated_at = NOW()
      WHERE id = v_product_id;

      -- Log inventory transaction
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
        p_order_number,
        jsonb_build_object('confirmed_by', 'admin')
      FROM products
      WHERE id = v_product_id;
    END LOOP;

    -- Update order status to confirmed
    UPDATE orders
    SET status = 'confirmed',
        payment_status = 'completed',
        updated_at = NOW()
    WHERE id = v_order_id;

    RETURN QUERY SELECT true, 'Order confirmed and inventory deducted'::TEXT;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error in confirm_order: %', SQLERRM;
      RETURN QUERY SELECT false, SQLERRM::TEXT;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_order(TEXT) TO anon, authenticated;

-- =============================================================================
-- 3. Keep confirm_crypto_payment() for webhook payment tracking (no status change)
-- =============================================================================
-- The existing confirm_crypto_payment() is still useful for tracking crypto payment_status,
-- but we no longer want it to change order status to 'confirmed'.
-- The admin will do that via confirm_order().

CREATE OR REPLACE FUNCTION confirm_crypto_payment(
  p_charge_code TEXT,
  p_payment_details JSONB
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_number TEXT;
BEGIN
  -- Only update payment tracking fields, NOT order status
  UPDATE orders
  SET payment_status = 'crypto_paid',
      crypto_payment_details = p_payment_details,
      updated_at = NOW()
  WHERE coinbase_charge_code = p_charge_code
  RETURNING order_number INTO v_order_number;

  IF FOUND THEN
    RETURN QUERY SELECT true, v_order_number::TEXT;
  ELSE
    RETURN QUERY SELECT false, 'Order not found for charge code'::TEXT;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_crypto_payment(TEXT, JSONB) TO anon, authenticated;
