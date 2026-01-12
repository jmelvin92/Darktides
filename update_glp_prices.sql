-- Update GLP-1 prices in the database
-- GLP-1 10mg: $40 (was $50)
-- GLP-1 20mg: $80 (was $99)

UPDATE products 
SET price = 40.00
WHERE id = 'glp3-10';

UPDATE products 
SET price = 80.00
WHERE id = 'glp3-20';

-- Verify the updates
SELECT id, name, price, old_price 
FROM products 
WHERE id IN ('glp3-10', 'glp3-20');