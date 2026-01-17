-- Check if the order was created
SELECT 
  order_number,
  customer_email,
  payment_method,
  payment_status,
  status,
  total,
  created_at
FROM orders
WHERE order_number LIKE 'DT-3583R7'
ORDER BY created_at DESC;

-- If the order exists, the issue is with fetching it immediately after creation
-- This could be due to Row Level Security (RLS) policies