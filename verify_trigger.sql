-- Check what triggers exist
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'orders'::regclass;

-- Check the trigger function
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname LIKE '%order%email%' 
   OR proname LIKE '%notify%order%';

-- Test: what would happen with a crypto order
SELECT 
  CASE 
    WHEN 'crypto' = 'crypto' THEN 'pending'
    ELSE 'confirmed'
  END as would_be_status,
  CASE 
    WHEN 'pending' = 'confirmed' THEN 'WOULD TRIGGER EMAIL'
    ELSE 'WOULD NOT TRIGGER EMAIL'
  END as email_behavior;