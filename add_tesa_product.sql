-- Add TESA 10MG product to the database

INSERT INTO products (
  id, 
  name, 
  short_name, 
  dosage, 
  price, 
  old_price, 
  sku, 
  description, 
  stock_quantity, 
  display_order
)
VALUES (
  'tesa-10', 
  'TESA 10mg', 
  'TESA', 
  '10 MG', 
  45.00,
  75.00,
  'DT-TESA-010', 
  'Tesamorelin is a synthetic growth hormone–releasing hormone (GHRH) analog that stimulates growth hormone secretion to reduce visceral fat and improve metabolic function. For research use only.', 
  10, 
  5 -- Will display after the other 4 products
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  dosage = EXCLUDED.dosage,
  price = EXCLUDED.price,
  old_price = EXCLUDED.old_price,
  sku = EXCLUDED.sku,
  description = EXCLUDED.description,
  stock_quantity = EXCLUDED.stock_quantity,
  display_order = EXCLUDED.display_order;