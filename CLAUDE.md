# DarkTides Research - Claude Development Guide

## Project Overview
This is a React/TypeScript website for DarkTides Research, a peptide research company. The site features a sophisticated inventory management system built with Supabase as the backend.

## Current Features Implemented

### 1. Inventory Management System (COMPLETED)
**Status**: ✅ Production-ready
**Backend**: Supabase PostgreSQL with real-time subscriptions

#### Key Components:
- **Real-time stock tracking** - prevents overselling
- **Cart reservation system** - holds inventory for 30 minutes
- **Automatic stock deduction** on order completion
- **Out-of-stock handling** - shows banner, disables buttons (products stay visible)
- **Admin tools** for inventory management

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
- `inventory_reservations` - Temporary cart holds (30min expiry)
- `orders` - Completed orders
- `inventory_transactions` - Full audit log

#### Database Functions (Automatic):
- `reserve_inventory()` - Atomic stock reservation
- `release_reservation()` - Release expired/cancelled reservations
- `finalize_order()` - Complete purchase, deduct stock
- `cleanup_expired_reservations()` - Auto-cleanup

### 2. Key Business Logic

#### Checkout Flow (CRITICAL - DO NOT BREAK):
1. **Add to Cart**: `handleAdd()` in Store.tsx → calls `checkAndReserve()` → reserves stock
2. **Checkout Validation**: `handleInitiatePayment()` in Checkout.tsx → validates all items
3. **Payment Complete**: `handleVenmoConfirm()` in Checkout.tsx → calls `finalizeOrder()` → permanently deducts stock

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

## Future Features Planned

### Feature #2: [To be documented when implemented]
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
- Reservation expiry (30min) is handled by periodic cleanup, not real-time
- Admin tool requires manual stock adjustments
- No automated low-stock alerts yet

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

## Contact Information
**Project**: DarkTides Research Website  
**Tech Stack**: React, TypeScript, Vite, Supabase  
**Domain**: [To be deployed]

---

**Last Updated**: January 2025  
**Claude Context**: This file ensures continuity across chat sessions and provides critical context for future development.