# DarkTides Research - Claude Development Guide

## Project Overview
This is a React/TypeScript website for DarkTides Research, a peptide research company. The site features a sophisticated inventory management system built with Supabase as the backend.

## Current Features Implemented

### 1. Enhanced Catalog Display (COMPLETED - January 2025)
**Status**: ✅ Production-ready
**Features**:
- **Grid/List View Toggle** - Users can switch between views, preference saved in localStorage
- **Product Search** - Real-time filtering by name, SKU, dosage, and description
- **Mobile Optimization** - Grid cards with tap-to-expand on mobile devices
- **Simplified Navigation** - Consolidated to Home and Catalog tabs only

#### Key Updates:
- Created `components/VialGraphic.tsx` - Reusable product vial visualization
- Enhanced `components/Store.tsx` with `ProductGridCard` component
- Search functionality filters products in real-time
- View preference persists across sessions

### 2. Inventory Management System (COMPLETED)
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
├── Store.tsx                       # Main store page with grid/list view and search
├── Checkout.tsx                    # Checkout flow (CRITICAL FOR INVENTORY)
├── VialGraphic.tsx                 # Reusable vial component for product display
└── Navigation.tsx                  # Simplified nav with Home/Catalog tabs

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

### 3. Email Notification System (COMPLETED)
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

### 4. Key Business Logic

#### Checkout Flow (CRITICAL - DO NOT BREAK):
1. **Add to Cart**: `handleAdd()` in Store.tsx → calls `checkAndReserve()` → checks stock availability only
2. **Payment Method Selection**: Customer chooses Venmo or Coinbase (crypto)
3. **Order Processing**: 
   - **Venmo**: `finalizeOrder()` with 5 params → status='confirmed' → email sent immediately
   - **Crypto**: `finalizeOrder()` with 6 params (payment_method='crypto') → status='pending' → no email yet
4. **Payment Complete**: 
   - **Venmo**: `handleVenmoConfirm()` → order already confirmed
   - **Crypto**: Redirect from Coinbase → `confirm_crypto_order()` → status='confirmed' → email sent

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
- `npm run dev` - Development server (http://localhost:5173)
- `npm run build` - Production build to /dist folder
- `npm run deploy` - Deploy to GitHub Pages (builds first)
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

### 5. Web-Based Admin Panel (COMPLETED)
**Status**: ✅ Production-ready
**Access**: `/admin` route - Supabase authentication (email/password)
**URL**: `darktideslab.com/admin`

#### Key Features:
- **Order Management** - View all orders, mark as shipped/completed
- **Discount Code Management** - Add, edit, disable affiliate codes
- **Inventory Management** - Update stock levels, add new products
- **Analytics Dashboard** - Sales metrics, popular products, revenue tracking
- **Real-time Updates** - Live data from Supabase

#### Core Files:
```
src/components/admin/
├── AdminLogin.tsx           # Supabase authentication screen
├── AdminPanel.tsx           # Main admin interface with tabs
├── AdminDashboard.tsx       # Analytics overview
├── AdminOrders.tsx          # Order management
├── AdminProducts.tsx        # Inventory management
├── AdminDiscounts.tsx       # Discount code management
└── ProtectedRoute.tsx       # Route protection wrapper

src/contexts/
└── AuthContext.tsx          # Supabase auth context
```

#### Authentication:
- **Supabase Auth** - Email/password login for admin users
- Admin users must be granted access in Supabase (is_admin flag)
- Session persists based on "Remember Me" checkbox
- Protected routes redirect to login if not authenticated
- No PIN required (was initially 2468 but removed per user preference)

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

## Recently Implemented Features

### Feature #6: Peptide Dosage Calculator (COMPLETED - January 2025)
**Status**: ✅ Production-ready
**Access**: `/calculator` tab on main site
**URL**: `darktideslab.com/calculator`

#### Key Features:
- **Three Calculation Modes**:
  - **Reconstitution Mode**: Calculates bacteriostatic water volume needed for 10-unit doses
  - **Peptide Mode**: Standard dose calculator with syringe unit conversion
  - **Blend Mode**: For dual-peptide vials, calculates yield of both compounds
- **Interactive Syringe Visualizer**: Shows exact draw point on virtual syringe
- **Preset System**: Quick-select dropdown with DarkTides catalog items and common research peptides
- **Multiple Syringe Support**: U-100, U-50, U-40, U-30 insulin syringes
- **Safety Features**: Input validation with min/max limits, helpful tooltips, aseptic technique reminders
- **Mobile Optimized**: Touch-friendly controls, responsive layout, no zoom on input focus

#### Core Files:
```
components/Calculator.tsx     # Main calculator component with all logic
components/Navigation.tsx     # Updated to include Calculator tab
src/components/MainSite.tsx  # Added calculator to view routing
src/index.css               # Added neon glow effects and animations
```

#### Technical Details:
- Uses React hooks for state management (useState, useMemo)
- Real-time calculations update as user types
- Preset dropdown maintains selected name for better UX
- Glass morphism UI consistent with site theme
- Supports both MG and MCG dose units with automatic conversion
- Animated chevron on dropdown, visual feedback on interactions

#### Presets Include:
- **DarkTides Catalog**: GLP-3, GHK-Cu, MOTS-C, TESA, CJC-1295/Ipamorelin, KPV, MT-1, NAD+, 5-Amino-1MQ
- **Common Peptides**: BPC-157, TB-500, Semax, Selank

### Feature #7: Cryptocurrency Payment Support via Coinbase Commerce (COMPLETED - January 2025)
**Status**: ✅ Production-ready
**Integration**: Coinbase Commerce API

#### Key Features:
- **Bitcoin/Ethereum/USDC payments** - Customers can pay with major cryptocurrencies
- **Professional payment method selector** - Radio button UI with Venmo and Coinbase options
- **Streamlined checkout flow** - Direct redirect to Coinbase after selection
- **Proper order status handling** - Crypto orders start with status='pending' to prevent premature emails
- **Email notifications after payment** - Business owner notified only after successful crypto payment

#### Technical Implementation:
- **6-parameter finalize_order function** - Supports payment_method parameter (venmo/crypto)
- **Coinbase Edge Function** - `supabase/functions/create-coinbase-charge/index.ts`
- **Webhook handler** - `supabase/functions/coinbase-webhook/index.ts` (for future payment confirmations)
- **Order confirmation page** - Handles redirect from Coinbase with order parameter

#### Critical Fixes Applied:
1. **Missing database column fix** - Added `last_used_at` to discount_codes table (was causing silent order failures)
2. **Order ID consistency** - Fixed finalize_order to return order_number instead of UUID
3. **Payment method routing** - Crypto orders now correctly use 6-parameter version with payment_method='crypto'
4. **Email timing** - Emails only sent after payment completion, not on checkout initiation

#### Database Changes:
```sql
-- Added columns to orders table
ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'venmo';
ALTER TABLE orders ADD COLUMN coinbase_charge_code TEXT;
ALTER TABLE orders ADD COLUMN crypto_payment_details JSONB;

-- Fixed discount_codes table
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- New function for confirming crypto orders
CREATE FUNCTION confirm_crypto_order(p_order_number TEXT) ...
```

#### Environment Variables Required:
```env
COINBASE_COMMERCE_API_KEY=your_key_here  # In Supabase Edge Function secrets
```

## Future Features Planned

### Feature #8: [To be documented when implemented]  
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
- ~~Order creation failing for crypto~~ - RESOLVED (missing database column and function signature issues fixed)
- Admin tool requires manual stock adjustments (or direct SQL)
- No automated low-stock alerts yet
- Browser caching can be aggressive - users may need hard refresh (Cmd+Shift+R) after deployments
- GitHub Pages CDN can take 5-10 minutes to propagate changes globally

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

## Deployment Information

### GitHub Pages Deployment
**Live Site**: darktideslab.com  
**Admin Panel**: darktideslab.com/admin

#### Deployment Process:
```bash
npm run build    # Build production files
npm run deploy   # Deploy to GitHub Pages
```

#### GitHub Pages Configuration:
- Uses `gh-pages` branch for deployment
- Includes 404.html redirect for SPA routing
- Client-side routing handled via redirect scripts
- Environment variables must be set in build environment

#### Required Files for GitHub Pages:
- `public/404.html` - Handles SPA routing redirects
- `vercel.json` - For Vercel deployment (alternative)
- `public/_redirects` - For Netlify deployment (alternative)

## Contact Information
**Project**: DarkTides Research Website  
**Tech Stack**: React, TypeScript, Vite, Supabase, Tailwind CSS (CDN)  
**Domain**: darktideslab.com  
**Repository**: github.com/jmelvin92/Darktides

---

**Last Updated**: January 2025  
**Claude Context**: This file ensures continuity across chat sessions and provides critical context for future development.