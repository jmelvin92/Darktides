-- Debug script to check orders table schema and triggers

-- 1. Check the orders table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 2. Check for any triggers on the orders table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'orders';

-- 3. Check recent orders to see the pattern
SELECT id, order_number, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check if there's any function or trigger modifying order_number
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc ILIKE '%order_number%';