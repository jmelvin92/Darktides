-- Alternative approach: Call the edge function directly using Supabase's built-in functionality
-- This is more reliable than using the http extension

-- Drop the old trigger first
DROP TRIGGER IF EXISTS trigger_new_order_email ON orders;

-- Create a new trigger that uses Supabase's edge function invocation
CREATE OR REPLACE FUNCTION notify_new_order_v2()
RETURNS TRIGGER AS $$
DECLARE
  payload json;
BEGIN
  -- Only trigger for confirmed orders
  IF NEW.status = 'confirmed' THEN
    -- Build the payload
    payload := json_build_object(
      'record', row_to_json(NEW)
    );
    
    -- Use Supabase's built-in edge function invocation
    -- This is more reliable than http extension
    INSERT INTO supabase_functions.queue (
      function_name,
      payload,
      scheduled_at
    ) VALUES (
      'send-order-email',
      payload,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new trigger
CREATE TRIGGER trigger_new_order_email
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order_v2();

-- Alternative: If the above doesn't work, we can use pg_notify to send a notification
-- and have a separate process listen for it
CREATE OR REPLACE FUNCTION notify_new_order_via_notify()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for confirmed orders
  IF NEW.status = 'confirmed' THEN
    -- Send notification with order data
    PERFORM pg_notify(
      'new_order',
      json_build_object(
        'order_number', NEW.order_number,
        'payment_method', NEW.payment_method,
        'customer_email', NEW.customer_email,
        'total', NEW.total
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;