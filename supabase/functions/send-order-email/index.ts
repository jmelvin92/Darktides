import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderData {
  id: string;
  order_number: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  order_notes: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  discount_code?: string;
  discount_amount?: number;
  payment_method?: string;
  coinbase_charge_code?: string;
  items: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
  }>;
  created_at: string;
  payment_confirmation?: {
    method: string;
    network?: string;
    transaction_id?: string;
    confirmed_at?: string;
  };
}

function generateBusinessEmailHTML(order: OrderData): string {
  const itemsHTML = order.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 0; color: #374151; font-weight: 500;">${item.name}</td>
      <td style="padding: 12px 0; color: #6b7280; text-align: center;">${item.sku}</td>
      <td style="padding: 12px 0; color: #6b7280; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 0; color: #374151; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 12px 0; color: #374151; font-weight: 600; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const orderDate = new Date(order.created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order - ${order.order_number}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <!-- DarkTides Logo SVG -->
    <div style="margin: 0 auto 15px; width: 60px; height: 60px;">
      <svg viewBox="0 0 100 100" fill="none" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%;">
        <circle cx="50" cy="50" r="45" />
        <path d="M25 45 C 40 35, 50 35, 60 45 S 80 45, 80 40" />
        <path d="M25 60 C 40 50, 50 50, 60 60 S 80 60, 80 55" />
        <path d="M35 75 C 45 70, 55 70, 65 75" />
      </svg>
    </div>
    <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">🧪 DarkTides Research</h1>
    <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">New Order Received</p>
  </div>

  <!-- Content -->
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Order Summary -->
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px; font-size: 20px; color: #1e293b;">📋 Order Summary</h2>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #374151;">Order Number:</span>
        <span style="font-family: 'Monaco', 'Menlo', monospace; background: #38bdf8; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${order.order_number}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #374151;">Order Date:</span>
        <span style="color: #6b7280;">${orderDate}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #374151;">Order Total:</span>
        <span style="font-weight: 700; color: #059669; font-size: 18px;">$${order.total.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #374151;">Payment Method:</span>
        <span style="background: ${order.payment_method === 'crypto' || order.payment_confirmation?.method === 'crypto' ? '#10b981' : '#38bdf8'}; color: white; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; font-weight: bold; text-transform: uppercase;">
          ${order.payment_method === 'crypto' || order.payment_confirmation?.method === 'crypto' ? '₿ CRYPTO' : 'VENMO'}
        </span>
      </div>
      ${order.payment_confirmation?.method === 'crypto' ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #374151;">Crypto Network:</span>
        <span style="color: #6b7280; font-family: monospace; font-size: 12px;">${order.payment_confirmation.network || 'Unknown'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #374151;">Transaction ID:</span>
        <span style="color: #6b7280; font-family: monospace; font-size: 10px; word-break: break-all;">${order.payment_confirmation.transaction_id || 'N/A'}</span>
      </div>` : ''}
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: 600; color: #374151;">Affiliate/Discount:</span>
        <span style="background: #fbbf24; color: #451a03; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; font-weight: bold;">
          ${order.discount_code || 'NONE'}
        </span>
      </div>
    </div>

    <!-- Customer Information -->
    <div style="margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px; font-size: 20px; color: #1e293b;">👤 Customer Information</h2>
      <div style="background: #fafafa; padding: 20px; border-radius: 8px; border-left: 4px solid #38bdf8;">
        <div style="margin-bottom: 12px;">
          <strong style="color: #374151;">Name:</strong> ${order.customer_first_name} ${order.customer_last_name}
        </div>
        <div style="margin-bottom: 12px;">
          <strong style="color: #374151;">Email:</strong> 
          <a href="mailto:${order.customer_email}" style="color: #2563eb; text-decoration: none;">${order.customer_email}</a>
        </div>
        ${order.customer_phone ? `<div style="margin-bottom: 12px;">
          <strong style="color: #374151;">Phone:</strong> 
          <a href="tel:${order.customer_phone}" style="color: #2563eb; text-decoration: none;">${order.customer_phone}</a>
        </div>` : ''}
        <div>
          <strong style="color: #374151;">Shipping Address:</strong><br>
          <span style="color: #6b7280;">
            ${order.shipping_address}<br>
            ${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}
          </span>
        </div>
      </div>
    </div>

    <!-- Order Items -->
    <div style="margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px; font-size: 20px; color: #1e293b;">📦 Order Items</h2>
      <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Product</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">SKU</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Qty</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Unit Price</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>

    <!-- Order Totals -->
    <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-bottom: 30px;">
      <div style="max-width: 300px; margin-left: auto;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280;">Subtotal:</span>
          <span style="color: #374151;">$${order.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280;">Shipping:</span>
          <span style="color: #374151;">$${order.shipping_cost.toFixed(2)}</span>
        </div>
        ${order.discount_amount && order.discount_amount > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #22c55e; font-weight: bold;">Discount (${order.discount_code || 'APPLIED'}):</span>
          <span style="color: #22c55e; font-weight: bold;">-$${order.discount_amount.toFixed(2)}</span>
        </div>` : ''}
        ${order.discount_code ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; background: #fef3c7; padding: 8px; border-radius: 4px;">
          <span style="color: #92400e; font-weight: bold;">🏷️ Affiliate Code Used:</span>
          <span style="color: #92400e; font-weight: bold; font-family: monospace;">${order.discount_code}</span>
        </div>` : ''}
        <div style="display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 12px;">
          <span style="font-weight: 700; color: #1f2937; font-size: 18px;">Total:</span>
          <span style="font-weight: 700; color: #059669; font-size: 18px;">$${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    ${order.order_notes ? `
    <!-- Order Notes -->
    <div style="margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px; font-size: 20px; color: #1e293b;">📝 Order Notes</h2>
      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px;">
        <p style="margin: 0; color: #92400e; font-style: italic;">"${order.order_notes}"</p>
      </div>
    </div>
    ` : ''}

    <!-- Next Steps -->
    <div style="background: #dcfce7; border: 1px solid #22c55e; padding: 20px; border-radius: 8px; text-align: center;">
      <h3 style="margin: 0 0 10px; color: #166534;">✅ Ready for Fulfillment</h3>
      <p style="margin: 0; color: #166534;">
        ${order.payment_method === 'crypto' || order.payment_confirmation?.method === 'crypto' 
          ? 'Crypto payment confirmed! This order is ready to be packed and shipped.'
          : 'This order is ready to be packed and shipped. Customer payment confirmation pending via Venmo.'}
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
    <p>DarkTides Research | Precision Peptide Research from the Depths</p>
  </div>

</body>
</html>
  `;
}

function generateCustomerEmailHTML(order: OrderData): string {
  const itemsHTML = order.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 0; color: #374151; font-weight: 500;">${item.name}</td>
      <td style="padding: 12px 0; color: #6b7280; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 0; color: #374151; font-weight: 600; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const orderDate = new Date(order.created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${order.order_number}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">🧪 DarkTides Research</h1>
    <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Order Confirmation</p>
  </div>

  <!-- Content -->
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Thank You Message -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px; font-size: 24px; color: #1e293b;">Thank you for your order!</h2>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">We've received your order and will process it shortly.</p>
    </div>

    <!-- Order Summary -->
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; color: #1e293b;">📋 Order Details</h3>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #374151;">Order Number:</span>
        <span style="font-family: 'Monaco', 'Menlo', monospace; background: #38bdf8; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${order.order_number}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #374151;">Order Date:</span>
        <span style="color: #6b7280;">${orderDate}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: 600; color: #374151;">Total:</span>
        <span style="font-weight: 700; color: #059669; font-size: 18px;">$${order.total.toFixed(2)}</span>
      </div>
    </div>

    <!-- Shipping Information -->
    <div style="margin-bottom: 30px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; color: #1e293b;">📦 Shipping Information</h3>
      <div style="background: #fafafa; padding: 20px; border-radius: 8px; border-left: 4px solid #38bdf8;">
        <div style="color: #374151;">
          <strong>${order.customer_first_name} ${order.customer_last_name}</strong><br>
          ${order.shipping_address}<br>
          ${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}
        </div>
      </div>
    </div>

    <!-- Order Items -->
    <div style="margin-bottom: 30px;">
      <h3 style="margin: 0 0 15px; font-size: 18px; color: #1e293b;">🧪 Your Order</h3>
      <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Product</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Qty</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>

    <!-- Order Totals -->
    <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-bottom: 30px;">
      <div style="max-width: 250px; margin-left: auto;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280;">Subtotal:</span>
          <span style="color: #374151;">$${order.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #6b7280;">Shipping:</span>
          <span style="color: #374151;">$${order.shipping_cost.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 12px;">
          <span style="font-weight: 700; color: #1f2937; font-size: 16px;">Total:</span>
          <span style="font-weight: 700; color: #059669; font-size: 16px;">$${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Payment Info -->
    <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <h3 style="margin: 0 0 10px; color: #92400e; font-size: 16px;">💳 Payment Information</h3>
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        Your order will be processed once we confirm your Venmo payment. Please ensure you included your order number <strong>${order.order_number}</strong> in the payment notes.
      </p>
    </div>

    <!-- Next Steps -->
    <div style="background: #dcfce7; border: 1px solid #22c55e; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
      <h3 style="margin: 0 0 10px; color: #166534;">✅ What's Next?</h3>
      <p style="margin: 0; color: #166534; font-size: 14px;">We'll confirm your payment and prepare your order for shipping. You'll receive updates on your order status via email.</p>
    </div>

    <!-- Important Notice -->
    <div style="background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0; color: #dc2626; font-size: 12px; text-align: center; font-weight: 600;">
        ⚠️ FOR RESEARCH USE ONLY - These products are not intended for human consumption
      </p>
    </div>

    <!-- Contact Info -->
    <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Questions about your order?</p>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Contact us with your order number ${order.order_number}</p>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
    <p>DarkTides Research | Precision Peptide Research from the Depths</p>
    <p>This email was sent regarding order ${order.order_number}</p>
  </div>

</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()
    const order: OrderData = record

    console.log(`Processing order: ${order.order_number}`)

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const notificationEmail = Deno.env.get('NOTIFICATION_EMAIL')

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    if (!notificationEmail) {
      throw new Error('NOTIFICATION_EMAIL not configured')
    }

    // Send business notification email - TO YOU (business owner)
    const businessEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DarkTides Research <onboarding@resend.dev>',
        to: [notificationEmail], // This goes TO YOU (business owner)
        subject: `🔥🔥 - NEW ORDER RECEIVED ${order.order_number} - $${order.total.toFixed(2)} 🔥🔥`,
        html: generateBusinessEmailHTML(order),
      }),
    })

    if (!businessEmailResponse.ok) {
      const error = await businessEmailResponse.text()
      console.error('Business email error:', error)
      throw new Error(`Failed to send business email: ${error}`)
    }

    const businessResult = await businessEmailResponse.json()
    console.log('Business email sent successfully:', businessResult)

    // Customer emails removed - only business notifications for now

    return new Response(
      JSON.stringify({ 
        success: true, 
        businessEmailId: businessResult.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})