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
  items: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
  }>;
  created_at: string;
}

function generateEmailHTML(order: OrderData): string {
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
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: 600; color: #374151;">Order Total:</span>
        <span style="font-weight: 700; color: #059669; font-size: 18px;">$${order.total.toFixed(2)}</span>
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
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #6b7280;">Shipping:</span>
          <span style="color: #374151;">$${order.shipping_cost.toFixed(2)}</span>
        </div>
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
      <p style="margin: 0; color: #166534;">This order is ready to be packed and shipped. Customer payment confirmation pending via Venmo.</p>
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

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DarkTides Research <orders@darktideslab.com>',
        to: [notificationEmail],
        subject: `🧪 New Order ${order.order_number} - $${order.total.toFixed(2)}`,
        html: generateEmailHTML(order),
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      console.error('Resend API error:', error)
      throw new Error(`Failed to send email: ${error}`)
    }

    const result = await emailResponse.json()
    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
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