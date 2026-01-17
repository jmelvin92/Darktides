-- Check if the 6-parameter finalize_order function exists
SELECT 
  proname AS function_name,
  pronargs AS num_args,
  pg_get_function_identity_arguments(oid) AS arguments
FROM pg_proc
WHERE proname = 'finalize_order'
ORDER BY pronargs;

-- If the 6-parameter version doesn't exist, you need to run:
-- supabase db push
-- OR manually run the migration file 006_add_payment_method.sql in Supabase SQL editor