-- Fix email trigger to send emails for crypto orders immediately
-- The current trigger only sends emails for orders with status='confirmed'
-- Both Venmo and Crypto orders are created with status='confirmed', so this should work
-- But we need to ensure the trigger fires for ALL confirmed orders, regardless of payment_method

-- First, let's update the trigger function to handle both payment types
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger for all confirmed orders (both Venmo and Crypto)
  -- Crypto orders are created with status='confirmed' and payment_status='pending_crypto'
  -- Venmo orders are created with status='confirmed' and payment_status='pending'
  IF NEW.status = 'confirmed' THEN
    -- Log for debugging
    RAISE NOTICE 'Email trigger firing for order % with payment method %', NEW.order_number, NEW.payment_method;
    
    -- Call the Edge Function via HTTP request
    PERFORM
      net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-order-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_key')
        ),
        body := jsonb_build_object(
          'record', to_jsonb(NEW)
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS trigger_new_order_email ON orders;
CREATE TRIGGER trigger_new_order_email
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();

-- Verification query to check the trigger exists
SELECT 
  tgname as trigger_name,
  tgtype,
  proname as function_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE tgrelid = 'orders'::regclass
  AND tgname = 'trigger_new_order_email';