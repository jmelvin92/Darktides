-- Check what the finalize_order function actually does
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'finalize_order';

-- Look at the 6-parameter version source
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'finalize_order' 
  AND pg_get_function_identity_arguments(oid) LIKE '%p_payment_method%';

-- Test what status would be set for crypto
SELECT 
  CASE 
    WHEN 'crypto' = 'crypto' THEN 'pending'
    ELSE 'confirmed'
  END as crypto_should_be,
  CASE 
    WHEN 'venmo' = 'crypto' THEN 'pending'
    ELSE 'confirmed'
  END as venmo_should_be;