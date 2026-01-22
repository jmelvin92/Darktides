-- Fix email notifications for crypto payments
-- The issue: Email trigger only fires on INSERT, but crypto orders are
-- INSERTed as 'pending' and UPDATEd to 'confirmed' after payment
-- Solution: Make the trigger fire on both INSERT and UPDATE

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS trigger_new_order_email ON orders;

-- Create an improved trigger function that handles both INSERT and UPDATE
CREATE OR REPLACE FUNCTION notify_order_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT: trigger if status is 'confirmed' (Venmo orders)
  -- For UPDATE: trigger if status changed from non-confirmed to 'confirmed' (Crypto orders)
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') OR
     (TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN
    
    -- Log for debugging
    RAISE NOTICE 'Email trigger fired for order %: operation=%, old_status=%, new_status=%', 
                 NEW.order_number, TG_OP, 
                 CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE 'N/A' END,
                 NEW.status;
    
    -- Call the edge function to send email
    PERFORM
      net.http_post(
        url := 'https://' || current_setting('app.supabase_functions_url') || '/send-order-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
        ),
        body := jsonb_build_object(
          'record', row_to_json(NEW)
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new trigger that fires on both INSERT and UPDATE
CREATE TRIGGER trigger_order_confirmed_email
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_confirmed();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_order_confirmed() TO authenticated, anon;

-- Add helpful comment
COMMENT ON TRIGGER trigger_order_confirmed_email ON orders IS 
  'Sends email notification when order is confirmed, either on initial insert (Venmo) or after update (Crypto)';