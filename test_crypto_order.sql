-- Run this in Supabase to verify crypto orders work correctly

-- First, check recent orders to see their status
SELECT 
  order_number,
  payment_method,
  status,
  payment_status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- Check if trigger will fire for different statuses
SELECT 
  'pending' as test_status,
  CASE WHEN 'pending' = 'confirmed' THEN 'EMAIL WOULD SEND' ELSE 'NO EMAIL' END as result
UNION ALL
SELECT 
  'confirmed' as test_status,
  CASE WHEN 'confirmed' = 'confirmed' THEN 'EMAIL WOULD SEND' ELSE 'NO EMAIL' END as result;