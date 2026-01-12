-- ============================================================
-- DISCOUNT CODE TEMPLATES FOR DARKTIDES RESEARCH
-- ============================================================
-- Use these templates to add new discount codes for affiliates
-- Copy, modify, and run in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TEMPLATE 1: ADD NEW AFFILIATE (PERCENTAGE DISCOUNT)
-- ============================================================
INSERT INTO discount_codes (
  code,           -- Unique code (will be auto-uppercased)
  description,    -- Affiliate name & platform for tracking
  discount_type,  -- 'percentage' or 'fixed'
  discount_value  -- Percentage amount (e.g., 20 for 20% off)
) VALUES (
  'CODENAME',     -- Replace: e.g., 'FITNESS20'
  'Platform - Affiliate Name',  -- Replace: e.g., 'Instagram - @fitnessguru'
  'percentage',   -- Keep as 'percentage' for % discounts
  20             -- Replace: discount percentage (20 = 20% off)
);

-- ============================================================
-- TEMPLATE 2: ADD NEW AFFILIATE (FIXED DOLLAR DISCOUNT)
-- ============================================================
INSERT INTO discount_codes (
  code,           -- Unique code (will be auto-uppercased)
  description,    -- Affiliate name & platform for tracking
  discount_type,  -- 'percentage' or 'fixed'
  discount_value  -- Dollar amount (e.g., 10 for $10 off)
) VALUES (
  'CODENAME',     -- Replace: e.g., 'SAVE10'
  'Platform - Affiliate Name',  -- Replace: e.g., 'YouTube - @healthchannel'
  'fixed',        -- Keep as 'fixed' for dollar discounts
  10             -- Replace: dollar amount off (10 = $10 off)
);

-- ============================================================
-- REAL EXAMPLES - READY TO USE
-- ============================================================

-- Example 1: Instagram Influencer (20% off)
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES ('SARAH20', 'Instagram - @sarahfitness', 'percentage', 20);

-- Example 2: YouTube Partner (15% off)
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES ('MIKE15', 'YouTube - HealthWithMike', 'percentage', 15);

-- Example 3: TikTok Creator (25% off)
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES ('TIKTOK25', 'TikTok - @peptideguru', 'percentage', 25);

-- Example 4: Blog Partner ($10 off)
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES ('BLOG10', 'Blog - ResearchReviews.com', 'fixed', 10);

-- Example 5: Launch Promotion (30% off)
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES ('LAUNCH30', 'Launch Special - General', 'percentage', 30);

-- ============================================================
-- BATCH ADD MULTIPLE AFFILIATES AT ONCE
-- ============================================================
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES 
  ('AFFILIATE1', 'Instagram - @influencer1', 'percentage', 20),
  ('AFFILIATE2', 'YouTube - Channel2', 'percentage', 15),
  ('AFFILIATE3', 'TikTok - @creator3', 'percentage', 25),
  ('AFFILIATE4', 'Blog - Site4.com', 'fixed', 10),
  ('AFFILIATE5', 'Twitter - @user5', 'percentage', 10);

-- ============================================================
-- MANAGEMENT COMMANDS
-- ============================================================

-- VIEW ALL ACTIVE CODES
SELECT 
  code,
  description,
  discount_type,
  discount_value || CASE WHEN discount_type = 'percentage' THEN '%' ELSE '$' END as discount,
  usage_count,
  is_active
FROM discount_codes
WHERE is_active = true
ORDER BY created_at DESC;

-- DISABLE A CODE (keeps history)
UPDATE discount_codes 
SET is_active = false 
WHERE code = 'CODENAME';  -- Replace CODENAME

-- ENABLE A CODE
UPDATE discount_codes 
SET is_active = true 
WHERE code = 'CODENAME';  -- Replace CODENAME

-- DELETE A CODE PERMANENTLY (not recommended - better to disable)
DELETE FROM discount_codes 
WHERE code = 'CODENAME';  -- Replace CODENAME

-- ============================================================
-- AFFILIATE PERFORMANCE TRACKING
-- ============================================================

-- CHECK PERFORMANCE OF SPECIFIC AFFILIATE
SELECT 
  o.discount_code,
  dc.description as affiliate,
  COUNT(*) as total_orders,
  SUM(o.total) as total_revenue,
  SUM(o.discount_amount) as discounts_given,
  ROUND(AVG(o.total), 2) as avg_order_value
FROM orders o
JOIN discount_codes dc ON UPPER(dc.code) = UPPER(o.discount_code)
WHERE UPPER(o.discount_code) = 'CODENAME'  -- Replace CODENAME
  AND o.status = 'confirmed'
GROUP BY o.discount_code, dc.description;

-- MONTHLY AFFILIATE COMMISSIONS (10% commission example)
SELECT 
  dc.code,
  dc.description as affiliate,
  COUNT(o.id) as orders_this_month,
  SUM(o.total) as revenue_this_month,
  ROUND(SUM(o.total) * 0.10, 2) as commission_owed_10_percent
FROM orders o
JOIN discount_codes dc ON UPPER(dc.code) = UPPER(o.discount_code)
WHERE o.created_at >= date_trunc('month', CURRENT_DATE)
  AND o.status = 'confirmed'
GROUP BY dc.code, dc.description
ORDER BY commission_owed_10_percent DESC;

-- ============================================================
-- QUICK REFERENCE
-- ============================================================
/*
DISCOUNT TYPES:
- 'percentage': Takes a percentage off the subtotal (e.g., 20 = 20% off)
- 'fixed': Takes a fixed dollar amount off (e.g., 10 = $10 off)

NAMING CONVENTIONS FOR CODES:
- Use affiliate's name/brand: SARAH20, MIKE15
- Use platform + number: INSTA20, YOUTUBE15, TIKTOK25
- Use campaign names: LAUNCH30, SUMMER20, BLACKFRIDAY50

DESCRIPTION FORMAT:
- Include platform and handle: 'Instagram - @username'
- Include website: 'Blog - sitename.com'
- Include campaign: 'Launch Special - General'

COMMISSION TRACKING:
- The description field is what appears in your reports
- Make it clear who the affiliate is for easy commission calculation
- Example: 'Instagram - Sarah Johnson (@sarahfit)'
*/