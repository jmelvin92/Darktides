# DarkTides Research - Claude Development Guide

## Project Overview
This is a React/TypeScript website for DarkTides Research, a peptide research company. The site features a sophisticated inventory management system built with Supabase as the backend.

## Current Features Implemented

### 1. Inventory Management System (COMPLETED)
**Status**: ✅ Production-ready (Simplified - Reservations Disabled)
**Backend**: Supabase PostgreSQL with real-time subscriptions

#### Key Components:
- **Real-time stock tracking** - prevents overselling
- **Direct stock checking** - no reservations, checks stock_quantity only
- **Atomic order processing** - row locking prevents race conditions during checkout
- **Out-of-stock handling** - shows banner, disables buttons (products stay visible)
- **Admin tools** for inventory management

#### Recent Changes (January 2025):
- **DISABLED reservation system** to simplify inventory management
- Stock now checked directly against `stock_quantity` only
- No more `reserved_quantity` considerations
- `reserve_inventory()` now just checks availability without reserving
- `finalize_order()` directly deducts from stock with row locking

#### Core Files:
```
src/lib/
├── supabase/
│   ├── client.ts                    # Supabase connection
│   ├── database.types.ts           # TypeScript types
│   └── migrations/001_initial_schema.sql  # Database schema
├── inventory/
│   └── InventoryService.ts         # Core inventory logic
└── services/
    └── ProductService.ts           # Product data management

src/hooks/
├── useProducts.ts                  # React hook for products
└── useInventory.ts                 # React hook for inventory

components/
├── Store.tsx                       # Main store page (CRITICAL FOR CHECKOUT)
└── Checkout.tsx                    # Checkout flow (CRITICAL FOR INVENTORY)

src/admin/
└── productManager.ts               # CLI admin tool
```

#### Database Schema:
- `products` - Product catalog with stock tracking
- `inventory_reservations` - ⚠️ DEPRECATED (not used since reservations disabled)
- `orders` - Completed orders
- `inventory_transactions` - Full audit log

#### Database Functions (Simplified):
- `reserve_inventory()` - ✅ Just checks stock availability (no actual reserving)
- `finalize_order()` - ✅ Complete purchase, deduct stock with row locking
- ~~`release_reservation()`~~ - ⚠️ DEPRECATED (reservations disabled)
- ~~`cleanup_expired_reservations()`~~ - ⚠️ DEPRECATED (reservations disabled)

### 2. Email Notification System (COMPLETED)
**Status**: ✅ Production-ready
**Backend**: Supabase Edge Functions + Resend API

#### Key Features:
- **Business owner notifications** - receives email for every confirmed order
- **Order details included** - customer info, shipping address, product details
- **Automated trigger** - fires when order status = 'confirmed'
- **Resend integration** - uses 'onboarding@resend.dev' sender address

#### Core Files:
```
supabase/functions/send-order-email/index.ts  # Edge Function for emails
src/lib/supabase/migrations/002_orders_and_email.sql  # Enhanced orders table
```

#### Email Content Includes:
- Customer name, email, phone, shipping address
- Complete product list with quantities and prices
- Order total and subtotal
- Order ID for tracking
- Order notes if provided

#### Payment Instructions:
- **Venmo username**: @Darktides (NOT @DarkTidesResearch)
- **Payment notes**: Customers must include their name + random emoji
- **Processing**: Manual verification before fulfillment

### 3. Key Business Logic

#### Checkout Flow (CRITICAL - DO NOT BREAK):
1. **Add to Cart**: `handleAdd()` in Store.tsx → calls `checkAndReserve()` → checks stock availability only
2. **Checkout Validation**: `handleInitiatePayment()` in Checkout.tsx → validates all items  
3. **Payment Complete**: `handleVenmoConfirm()` in Checkout.tsx → calls `finalizeOrder()` → deducts stock with row locking

#### Out-of-Stock Behavior:
- Products with `stock_quantity = 0` stay visible
- Show "Out of Stock" banner overlay on product image  
- Disable quantity buttons and "Add to Cart" button
- Button text changes to "Out of Stock"

#### Real-time Updates:
- All users see live stock changes via Supabase subscriptions
- Products automatically show/hide out-of-stock state
- No page refresh needed

### 3. Environment Setup

#### Required Environment Variables (.env.local):
```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ[long-jwt-token]
```

#### NPM Scripts:
- `npm run dev` - Development server
- `npm run build` - Production build  
- `npm run admin` - CLI inventory management tool

#### Supabase Setup:
1. Project created: DarkTides Production
2. Database migrated with: `src/lib/supabase/migrations/001_initial_schema.sql`
3. Row Level Security (RLS) enabled
4. Real-time enabled for products table

## CRITICAL CODE SECTIONS (DO NOT MODIFY WITHOUT CARE)

### 1. Checkout Order Finalization (Checkout.tsx:72-85)
```typescript
const handleVenmoConfirm = async () => {
  // Generate order ID
  const orderId = `DT-${Math.random().toString(36).substring(7).toUpperCase()}`;
  
  // Finalize the order (deduct from inventory)
  const result = await finalizeOrder(orderId);
  
  if (result.success) {
    onClearCart();
    setStep('complete');
  } else {
    setValidationError('Unable to complete order. Please try again.');
  }
};
```
**⚠️ WARNING**: This function permanently deducts inventory. Any changes to checkout flow MUST call `finalizeOrder()` or inventory will not be updated.

### 2. Cart Reservation (Store.tsx:36-49)
```typescript
const handleAdd = async () => {
  if (isOutOfStock) return;
  
  const result = await checkAndReserve(product.id, quantity);
  
  if (result.success) {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  } else {
    setUnavailable(true);
    setTimeout(() => setUnavailable(false), 3000);
  }
};
```
**⚠️ WARNING**: This reserves inventory. Any "Add to Cart" functionality MUST use `checkAndReserve()`.

### 3. Out-of-Stock Detection (Store.tsx:34)
```typescript
const isOutOfStock = product.stockQuantity === 0;
```
**⚠️ WARNING**: This relies on `stockQuantity` field. Product interface must include this field.

## Adding New Products
**Process**: Add directly to Supabase database using SQL

#### Example - TESA 10MG Product:
```sql
INSERT INTO products (
  id, name, short_name, dosage, price, old_price, 
  sku, description, stock_quantity, display_order
) VALUES (
  'tesa-10', 'TESA 10mg', 'TESA', '10 MG', 45.00, 75.00,
  'DT-TESA-010', 
  'Tesamorelin is a synthetic growth hormone–releasing hormone (GHRH) analog...',
  10, 5
);
```

#### Required SQL Files to Apply:
1. `apply_migration.sql` - Fix finalize_order function (CRITICAL - apply first)
2. `add_tesa_product.sql` - Add TESA product

### 4. Web-Based Admin Panel (COMPLETED)
**Status**: ✅ Production-ready
**Access**: `/admin` route with PIN authentication (PIN: 2468)

#### Key Features:
- **Order Management** - View all orders, mark as shipped/completed
- **Discount Code Management** - Add, edit, disable affiliate codes
- **Inventory Management** - Update stock levels, add new products
- **Analytics Dashboard** - Sales metrics, popular products, revenue tracking
- **Real-time Updates** - Live data from Supabase

#### Core Files:
```
src/pages/Admin/
├── AdminLogin.tsx           # PIN authentication screen
├── AdminDashboard.tsx       # Main admin interface
├── components/
│   ├── OrdersTab.tsx       # Order management
│   ├── InventoryTab.tsx    # Stock management
│   ├── DiscountTab.tsx     # Discount code management
│   └── AnalyticsTab.tsx    # Sales analytics
```

#### Security:
- PIN-based authentication (PIN: 2468)
- Session persists in localStorage
- Protected route redirects to login if not authenticated
- No sensitive operations exposed to client

#### Admin Panel Sections:
1. **Orders Tab**:
   - List all orders with customer details
   - Filter by status (pending, confirmed, shipped, completed)
   - Mark orders as shipped/completed
   - View order details and items

2. **Inventory Tab**:
   - Real-time stock levels for all products
   - Quick stock adjustment buttons
   - Add new products
   - Toggle product visibility

3. **Discount Codes Tab**:
   - Create new discount codes
   - View usage statistics
   - Enable/disable codes
   - Edit discount values

4. **Analytics Tab**:
   - Total revenue
   - Orders by status
   - Popular products
   - Monthly trends

## Future Features Planned

### Feature #5: [To be documented when implemented]  
**Status**: 📋 Not yet started

## Development Guidelines

### Adding New Features:
1. Always check if inventory is affected
2. If touching checkout flow, ensure `finalizeOrder()` is called
3. Test with real Supabase data, not just fallback
4. Update this CLAUDE.md file

### Modifying Checkout:
1. **NEVER** remove `finalizeOrder()` call
2. **ALWAYS** maintain order ID generation
3. **TEST** with actual inventory items
4. Check `inventory_transactions` table after testing

### Modifying Product Display:
1. Ensure `stockQuantity` field is preserved
2. Test out-of-stock banner functionality  
3. Verify real-time updates still work

### Admin Tasks:
- Use `npm run admin` for inventory management:
  1. Add New Product
  2. Update Stock Quantity  
  3. Edit Product Details (name, price, description)
  4. Toggle Product Active Status (hide/show)
  5. View Inventory
  6. Delete Product (Permanent)
- Check Supabase dashboard for transaction logs
- Monitor `inventory_reservations` for stuck reservations

## Testing Checklist

### Before Any Checkout Changes:
- [ ] Add item to cart (check reservation created)
- [ ] Complete full checkout flow  
- [ ] Verify stock deducted in Supabase
- [ ] Check transaction logged in `inventory_transactions`
- [ ] Test with multiple users simultaneously

### Before Product Display Changes:
- [ ] Set product stock to 0 in Supabase
- [ ] Verify "Out of Stock" banner appears
- [ ] Verify buttons disabled
- [ ] Set stock back to > 0
- [ ] Verify banner disappears instantly

## Known Issues & Limitations
- ~~Reservation expiry~~ - RESOLVED (reservations disabled for simplicity)
- Admin tool requires manual stock adjustments (or direct SQL)
- No automated low-stock alerts yet
- **CRITICAL**: Must apply `apply_migration.sql` before testing checkout

## Security Notes
- Uses Supabase Row Level Security (RLS)
- API keys are public-facing (anon key only)
- No sensitive data exposed to client
- All stock modifications go through database functions

## Performance Notes
- Real-time subscriptions scale to ~200 concurrent users on free tier
- Database functions provide atomic operations
- Client-side caching via ProductService
- Optimistic UI updates for better UX

---

## Discount Code Management

### When user says "add discount code", ask for:
1. **Code name** (e.g., SARAH20, FITNESS15)
2. **Affiliate/Description** (e.g., Instagram - @sarahfitness)
3. **Discount type** (percentage or fixed dollar amount)
4. **Discount value** (e.g., 20 for 20% off, or 10 for $10 off)

### Then provide this SQL:
```sql
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES ('[CODE]', '[DESCRIPTION]', '[TYPE]', [VALUE]);
```

### Example:
- Code: PEPTIDE20
- Affiliate: Instagram - @peptideexpert
- Type: percentage
- Value: 20

**SQL Output:**
```sql
INSERT INTO discount_codes (code, description, discount_type, discount_value)
VALUES ('PEPTIDE20', 'Instagram - @peptideexpert', 'percentage', 20);
```

### Other useful commands:
```sql
-- View all codes
SELECT * FROM discount_codes ORDER BY created_at DESC;

-- Disable a code
UPDATE discount_codes SET is_active = false WHERE code = 'CODENAME';

-- Check usage
SELECT code, description, usage_count FROM discount_codes WHERE code = 'CODENAME';
```

## Contact Information
**Project**: DarkTides Research Website  
**Tech Stack**: React, TypeScript, Vite, Supabase  
**Domain**: [To be deployed]

---

**Last Updated**: January 2025  
**Claude Context**: This file ensures continuity across chat sessions and provides critical context for future development.