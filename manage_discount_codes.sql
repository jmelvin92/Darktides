-- ========================================
-- DISCOUNT CODE MANAGEMENT QUERIES
-- For DarkTides Research Affiliate System
-- ========================================

-- ----------------------------------------
-- 1. ADD NEW AFFILIATE DISCOUNT CODES
-- ----------------------------------------

-- Add a percentage-based discount (20% off)
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES ('FITNESS20', 'Instagram - FitnessGuru Sarah', 'percentage', 20);

-- Add a fixed amount discount ($15 off)
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES ('SAVE15', 'YouTube - HealthChannel Mike', 'fixed', 15);

-- Add multiple affiliate codes at once
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES 
  ('PEPTIDE25', 'TikTok - PeptideExpert', 'percentage', 25),
  ('RESEARCH10', 'Blog - ResearchReviews', 'percentage', 10),
  ('LAUNCH30', 'Launch Special - General', 'percentage', 30);

-- ----------------------------------------
-- 2. VIEW ACTIVE DISCOUNT CODES
-- ----------------------------------------

-- See all active codes with usage stats
SELECT 
  code,
  description as affiliate,
  discount_type,
  discount_value,
  usage_count,
  created_at
FROM discount_codes 
WHERE is_active = true
ORDER BY usage_count DESC;

-- ----------------------------------------
-- 3. AFFILIATE PERFORMANCE REPORTS
-- ----------------------------------------

-- Monthly affiliate performance report (current month)
SELECT 
  o.discount_code,
  dc.description as affiliate_name,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.subtotal) as gross_revenue,
  SUM(o.discount_amount) as total_discounts_given,
  SUM(o.total) as net_revenue,
  ROUND(AVG(o.total), 2) as avg_order_value
FROM orders o
LEFT JOIN discount_codes dc ON UPPER(dc.code) = UPPER(o.discount_code)
WHERE o.discount_code IS NOT NULL 
  AND o.created_at >= date_trunc('month', CURRENT_DATE)
  AND o.status = 'confirmed'
GROUP BY o.discount_code, dc.description
ORDER BY net_revenue DESC;

-- All-time affiliate performance
SELECT 
  o.discount_code,
  dc.description as affiliate_name,
  COUNT(DISTINCT o.id) as lifetime_orders,
  SUM(o.total) as lifetime_revenue,
  MIN(o.created_at) as first_sale,
  MAX(o.created_at) as last_sale
FROM orders o
LEFT JOIN discount_codes dc ON UPPER(dc.code) = UPPER(o.discount_code)
WHERE o.discount_code IS NOT NULL 
  AND o.status = 'confirmed'
GROUP BY o.discount_code, dc.description
ORDER BY lifetime_revenue DESC;

-- ----------------------------------------
-- 4. CALCULATE COMMISSIONS
-- ----------------------------------------

-- Calculate 10% commission for affiliates (current month)
SELECT 
  dc.code,
  dc.description as affiliate_name,
  COUNT(o.id) as orders,
  SUM(o.total) as total_sales,
  ROUND(SUM(o.total) * 0.10, 2) as commission_owed_10_percent
FROM orders o
JOIN discount_codes dc ON UPPER(dc.code) = UPPER(o.discount_code)
WHERE o.created_at >= date_trunc('month', CURRENT_DATE)
  AND o.status = 'confirmed'
GROUP BY dc.code, dc.description
ORDER BY commission_owed_10_percent DESC;

-- ----------------------------------------
-- 5. MANAGE DISCOUNT CODES
-- ----------------------------------------

-- Disable a discount code
UPDATE discount_codes 
SET is_active = false 
WHERE code = 'OLDCODE';

-- Re-enable a discount code
UPDATE discount_codes 
SET is_active = true 
WHERE code = 'OLDCODE';

-- Update discount value
UPDATE discount_codes 
SET discount_value = 25 
WHERE code = 'PEPTIDE25';

-- Delete a code permanently (use with caution)
DELETE FROM discount_codes 
WHERE code = 'TESTCODE';

-- ----------------------------------------
-- 6. ANALYTICS QUERIES
-- ----------------------------------------

-- Top performing discount codes by usage
SELECT 
  code,
  description,
  usage_count,
  discount_type,
  discount_value
FROM discount_codes
ORDER BY usage_count DESC
LIMIT 10;

-- Average discount given per order
SELECT 
  AVG(discount_amount) as avg_discount,
  COUNT(*) as orders_with_discount,
  SUM(discount_amount) as total_discounts_given
FROM orders
WHERE discount_code IS NOT NULL
  AND discount_amount > 0;

-- Conversion rate by discount code (orders per code use)
SELECT 
  discount_code,
  COUNT(*) as successful_orders,
  SUM(total) as revenue,
  ROUND(AVG(total), 2) as avg_order_value
FROM orders
WHERE discount_code IS NOT NULL
GROUP BY discount_code
ORDER BY successful_orders DESC;

-- ----------------------------------------
-- 7. USEFUL MAINTENANCE QUERIES
-- ----------------------------------------

-- Reset usage count for a code (if needed)
UPDATE discount_codes 
SET usage_count = 0 
WHERE code = 'RESETCODE';

-- Find duplicate codes (shouldn't happen due to UNIQUE constraint)
SELECT code, COUNT(*) 
FROM discount_codes 
GROUP BY code 
HAVING COUNT(*) > 1;

-- View recent orders with discount codes
SELECT 
  order_number,
  customer_first_name || ' ' || customer_last_name as customer,
  discount_code,
  discount_amount,
  total,
  created_at
FROM orders
WHERE discount_code IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;