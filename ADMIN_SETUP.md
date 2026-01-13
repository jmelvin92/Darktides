# Admin Panel Setup Instructions

## Overview
The admin panel is now available at `/admin` on your site. It's completely separate from the main site and requires authentication.

## Current Status
✅ **Development Branch**: `admin-panel`
✅ **React Router**: Installed and configured
✅ **Admin Components**: Built and ready
✅ **Authentication**: Supabase Auth integrated

## Setup Steps

### 1. Apply Database Migration
Run this SQL in your Supabase dashboard to create the admin_users table:
```sql
-- File: src/lib/supabase/migrations/003_admin_users.sql
-- Run this entire file in Supabase SQL editor
```

### 2. Create Admin User
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Invite User" or "Create User"
3. Enter your admin email and password
4. Copy the user ID that's generated

### 3. Grant Admin Access
Run this SQL with your user ID:
```sql
INSERT INTO admin_users (user_id, email) 
VALUES ('YOUR-USER-ID-HERE', 'your-email@example.com');
```

### 4. Test Locally
```bash
npm run dev
```
- Visit `http://localhost:5173/admin`
- Log in with your admin credentials

## Admin Panel Features

### Dashboard (`/admin`)
- Overview statistics
- Recent orders
- Low stock alerts
- Revenue tracking

### Products Management (`/admin/products`)
- View all products with live stock
- Edit stock quantities in real-time
- Toggle product active/inactive
- Add/edit/delete products
- Low stock indicators

### Orders Management (`/admin/orders`)
- View all orders with details
- Filter by status (pending, confirmed, shipped)
- Update order status
- View full order details in modal
- Export orders to CSV

### Discount Codes (`/admin/discounts`)
- Create new discount codes
- Edit existing codes
- Track usage statistics
- Toggle active/inactive
- Copy codes to clipboard
- Affiliate tracking

## Security Features
- Protected routes (redirect to login if not authenticated)
- Supabase Auth with session management
- Admin role checking via admin_users table
- No links to admin from main site
- Separate authentication context

## Mobile Responsive
- Collapsible sidebar on mobile
- Touch-friendly interface
- Responsive tables

## Testing Checklist
- [ ] Main site still works at `/`
- [ ] Admin login works at `/admin/login`
- [ ] Protected routes redirect when not logged in
- [ ] Dashboard loads with real data
- [ ] Products can be edited
- [ ] Orders display correctly
- [ ] Discount codes can be created/edited
- [ ] Sign out works properly
- [ ] Mobile layout works

## Deployment Notes
When ready to deploy:
1. Merge `admin-panel` branch to `main`
2. Deploy to production
3. Apply database migration in production Supabase
4. Create production admin users

## Troubleshooting

### Can't log in
- Ensure user exists in Supabase Auth
- Ensure user ID is in admin_users table
- Check browser console for errors

### Pages not loading
- Check that all components are imported correctly
- Verify Supabase connection in .env.local
- Check browser console for errors

### Real-time updates not working
- Ensure Supabase real-time is enabled for tables
- Check network tab for WebSocket connections

## Next Steps
- Add more detailed product editing forms
- Implement order fulfillment workflow
- Add email notifications for admins
- Create analytics/reporting features
- Add bulk operations for products
- Implement admin activity logging