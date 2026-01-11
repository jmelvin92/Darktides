-- Fix email trigger using pg_net extension instead of net schema
-- First ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Updated trigger function using pg_net
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  supabase_url text;
  service_key text;
BEGIN
  -- Only trigger for confirmed orders
  IF NEW.status = 'confirmed' THEN
    -- Get project URL and service key (you'll need to set these)
    supabase_url := 'https://mfrfmiamaczcpkamqsqr.supabase.co';
    service_key := current_setting('app.settings.service_role_key', true);
    
    -- If service key is not set, use a fallback method
    IF service_key IS NULL OR service_key = '' THEN
      -- Use supabase_url from environment or hardcode your URL
      SELECT net.http_post(
        url := supabase_url || '/functions/v1/send-order-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || coalesce(current_setting('app.supabase.service_role_key', true), 'your_service_key_here')
        ),
        body := jsonb_build_object(
          'record', to_jsonb(NEW)
        )
      ) INTO request_id;
    ELSE
      -- Use configured service key
      SELECT net.http_post(
        url := supabase_url || '/functions/v1/send-order-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object(
          'record', to_jsonb(NEW)
        )
      ) INTO request_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_new_order_email ON orders;
CREATE TRIGGER trigger_new_order_email
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();