# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Project name: "DarkTides Research"
   - Database Password: (save this securely)
   - Region: Choose closest to your location
5. Click "Create new project"

## 2. Get Your API Keys

1. Once project is created, go to Settings → API
2. Copy these values:
   - Project URL (looks like: https://xxxxx.supabase.co)
   - Anon/Public key (safe to use in browser)

## 3. Configure Environment Variables

1. Open `.env.local` in your project
2. Replace the placeholder values:
```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Run Database Migration

1. Go to Supabase Dashboard → SQL Editor
2. Click "New query"
3. Copy the entire contents of `src/lib/supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" to execute the migration

## 5. Verify Setup

1. Go to Table Editor in Supabase Dashboard
2. You should see these tables:
   - products (with 4 initial products)
   - inventory_reservations
   - orders
   - inventory_transactions

## 6. Test the Application

1. Run the development server:
```bash
npm run dev
```

2. Navigate to the Store page
3. Products should load from Supabase
4. Try adding items to cart - inventory will be silently validated

## 7. Managing Products

Use the admin CLI tool to manage products:

```bash
npm run admin
```

This will launch an interactive menu where you can:
- Add new products
- Update stock quantities
- Toggle product visibility
- View current inventory

## Important Notes

- The system automatically prevents overselling
- Cart reservations expire after 30 minutes
- All inventory checks happen silently (no UI changes)
- Products with 0 stock won't appear on the store page

## Database Functions

The migration creates several database functions:
- `reserve_inventory`: Atomically reserves stock when adding to cart
- `release_reservation`: Releases reserved stock
- `finalize_order`: Converts reservations to actual sales
- `cleanup_expired_reservations`: Automatically cleans up old reservations

## Security

- Row Level Security (RLS) is enabled on all tables
- Public can only read product information
- All inventory modifications require proper session handling
- Admin functions would require additional authentication (not implemented yet)

## Troubleshooting

If products don't load:
1. Check browser console for errors
2. Verify `.env.local` has correct values
3. Ensure database migration ran successfully
4. Check Supabase dashboard for any API errors

If inventory validation fails:
1. Check that products have stock_quantity > 0
2. Verify database functions were created
3. Check browser console for specific error messages