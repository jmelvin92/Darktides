-- Fix email trigger with actual service role key
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
    -- Set project URL and service key
    supabase_url := 'https://mfrfmiamaczcpkamqsqr.supabase.co';
    service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mcmZtaWFtYWN6Y3BrYW1xc3FyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3MTIzMiwiZXhwIjoyMDgzNjQ3MjMyfQ.HXOPrLPXEcdZBa5QSABr38OPWfDCYZcoUyA6UM6Ih2E';
    
    -- Call the Edge Function
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_new_order_email ON orders;
CREATE TRIGGER trigger_new_order_email
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();