-- Database trigger to send order emails
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for confirmed orders
  IF NEW.status = 'confirmed' THEN
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

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_new_order_email ON orders;
CREATE TRIGGER trigger_new_order_email
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();

-- Enable the http extension for making requests
CREATE EXTENSION IF NOT EXISTS http;