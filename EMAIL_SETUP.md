# Email Notification Setup Guide

## Overview
This system automatically sends email notifications when orders are completed, containing all order details for fulfillment.

## Setup Steps

### 1. Database Setup
Run these SQL scripts in your Supabase SQL Editor:

1. **002_orders_and_email.sql** - Creates orders table and updates finalize_order function
2. **003_email_trigger.sql** - Creates database trigger to call Edge Function

### 2. Resend Account Setup
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain `darktideslab.com` in Resend
3. Get your API key from the dashboard

### 3. Supabase Edge Function Setup
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref YOUR_PROJECT_ID`
4. Deploy function: `supabase functions deploy send-order-email`

### 4. Environment Variables
Add these secrets to your Supabase project:

```bash
# In Supabase Dashboard → Settings → API → Project Settings
RESEND_API_KEY=re_xxxxx_your_resend_api_key
NOTIFICATION_EMAIL=your-email@example.com
```

### 5. Test the System
1. Complete a test order on your website
2. Check your email for the order notification
3. Verify all order details are correct

## Email Template Features
- **Professional Design**: Branded DarkTides Research template
- **Complete Order Info**: Customer details, shipping address, phone
- **Product Details**: Table with SKU, quantity, pricing
- **Order Totals**: Subtotal, shipping, total
- **Order Notes**: Any special customer instructions
- **Mobile Responsive**: Looks great on all devices

## Troubleshooting
- Check Supabase Functions logs if emails aren't sending
- Verify Resend domain verification is complete
- Ensure environment variables are set correctly
- Check that database triggers are active

## Email Content
You'll receive professional emails containing:
- Order number (e.g., DT-ABC123)
- Customer contact information
- Complete shipping address
- Itemized product list with SKUs
- Order totals and special instructions
- Timestamp and order status