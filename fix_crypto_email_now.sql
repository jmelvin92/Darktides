-- IMMEDIATE FIX: Fix email notifications for crypto payments
-- Apply this directly in Supabase SQL Editor

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS trigger_new_order_email ON orders;

-- Create the improved trigger function
CREATE OR REPLACE FUNCTION notify_order_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger when:
  -- 1. INSERT with status='confirmed' (Venmo orders)
  -- 2. UPDATE from any non-confirmed to 'confirmed' (Crypto orders after payment)
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') OR
     (TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN
    
    -- Log the trigger firing
    RAISE LOG 'Email trigger fired for order %: operation=%, old_status=%, new_status=%', 
              NEW.order_number, TG_OP, 
              CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE 'N/A' END,
              NEW.status;
    
    -- Call the edge function
    PERFORM
      net.http_post(
        url := 'https://svdvgpfmwyztcsjmjjea.supabase.co/functions/v1/send-order-email',
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
CREATE TRIGGER trigger_new_order_email
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_confirmed();

-- Grant permissions
GRANT EXECUTE ON FUNCTION notify_order_confirmed() TO anon, authenticated;

-- Test query to verify the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_new_order_email';