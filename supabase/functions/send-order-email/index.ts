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
    <tr>
      <td style="padding: 12px 0; color: #c8d6e5; border-bottom: 1px solid #222f3e;">${item.name}</td>
      <td style="padding: 12px 0; color: #c8d6e5; text-align: center; border-bottom: 1px solid #222f3e;">${item.quantity}</td>
      <td style="padding: 12px 0; color: #c8d6e5; text-align: right; border-bottom: 1px solid #222f3e;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const orderDate = new Date(order.created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0a0f1a;">
  <div style="max-width: 560px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <div style="background: #0f172a; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
      <img src="https://darktideslab.com/logo.png" alt="DarkTides" width="60" height="60" style="display: block; margin: 0 auto 12px;" />
      <div style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.12em; text-transform: uppercase;">DARKTIDES</div>
      <div style="font-size: 10px; color: #576574; letter-spacing: 0.3em; text-transform: uppercase; margin-top: 2px;">RESEARCH</div>
    </div>

    <!-- Body -->
    <div style="background: #141c2b; padding: 32px;">

      <div style="text-align: center; margin-bottom: 28px;">
        <div style="font-size: 20px; font-weight: 600; color: #ffffff;">Order Confirmed</div>
        <div style="font-size: 13px; color: #576574; margin-top: 6px;">${orderDate}</div>
      </div>

      <!-- Order Number -->
      <div style="background: #0f172a; border: 1px solid #222f3e; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 11px; color: #576574; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Order Number</div>
        <div style="font-family: 'Monaco', 'Menlo', 'Courier New', monospace; font-size: 20px; font-weight: 700; color: #38bdf8;">${order.order_number}</div>
      </div>

      <!-- Items -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr>
            <th style="padding: 8px 0; text-align: left; font-size: 11px; color: #576574; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #222f3e;">Item</th>
            <th style="padding: 8px 0; text-align: center; font-size: 11px; color: #576574; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #222f3e;">Qty</th>
            <th style="padding: 8px 0; text-align: right; font-size: 11px; color: #576574; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #222f3e;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- Totals -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 4px 0; color: #576574; font-size: 13px;">Subtotal</td>
          <td style="padding: 4px 0; color: #c8d6e5; font-size: 13px; text-align: right;">$${order.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #576574; font-size: 13px;">Shipping</td>
          <td style="padding: 4px 0; color: #c8d6e5; font-size: 13px; text-align: right;">${order.shipping_cost > 0 ? '$' + order.shipping_cost.toFixed(2) : 'Free'}</td>
        </tr>${order.discount_amount && order.discount_amount > 0 ? `
        <tr>
          <td style="padding: 4px 0; color: #10b981; font-size: 13px;">Discount (${order.discount_code})</td>
          <td style="padding: 4px 0; color: #10b981; font-size: 13px; text-align: right;">-$${order.discount_amount.toFixed(2)}</td>
        </tr>` : ''}
        <tr>
          <td colspan="2" style="padding: 8px 0 0;"><div style="border-top: 1px solid #222f3e;"></div></td>
        </tr>
        <tr>
          <td style="padding: 8px 0 0; color: #ffffff; font-size: 16px; font-weight: 700;">Total</td>
          <td style="padding: 8px 0 0; color: #ffffff; font-size: 16px; font-weight: 700; text-align: right;">$${order.total.toFixed(2)}</td>
        </tr>
      </table>

      <!-- Shipping -->
      <div style="background: #0f172a; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px;">
        <div style="font-size: 11px; color: #576574; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Shipping to</div>
        <div style="color: #c8d6e5; font-size: 14px;">${order.customer_first_name} ${order.customer_last_name}</div>
        <div style="color: #576574; font-size: 13px; margin-top: 2px;">${order.shipping_address}</div>
        <div style="color: #576574; font-size: 13px;">${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}</div>
      </div>

      <!-- Research Disclaimer -->
      <div style="font-size: 10px; color: #576574; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; padding: 16px 0; border-top: 1px solid #222f3e;">
        For research use only - Not intended for human consumption
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #0f172a; padding: 16px 32px; border-radius: 0 0 8px 8px; text-align: center;">
      <div style="font-size: 11px; color: #576574;">darktideslab.com</div>
    </div>

  </div>
</body>
</html>
  `;
}

function generateShippingEmailHTML(order: OrderData, trackingUrl?: string): string {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 12px 0; color: #c8d6e5; border-bottom: 1px solid #222f3e;">${item.name}</td>
      <td style="padding: 12px 0; color: #c8d6e5; text-align: center; border-bottom: 1px solid #222f3e;">${item.quantity}</td>
    </tr>
  `).join('');

  const trackingSection = trackingUrl ? `
      <!-- Track Button -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${trackingUrl}" target="_blank" style="display: inline-block; background: #38bdf8; color: #0f172a; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 6px; letter-spacing: 0.05em; text-transform: uppercase;">Track Your Package</a>
      </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0a0f1a;">
  <div style="max-width: 560px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <div style="background: #0f172a; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
      <img src="https://darktideslab.com/logo.png" alt="DarkTides" width="60" height="60" style="display: block; margin: 0 auto 12px;" />
      <div style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.12em; text-transform: uppercase;">DARKTIDES</div>
      <div style="font-size: 10px; color: #576574; letter-spacing: 0.3em; text-transform: uppercase; margin-top: 2px;">RESEARCH</div>
    </div>

    <!-- Body -->
    <div style="background: #141c2b; padding: 32px;">

      <div style="text-align: center; margin-bottom: 28px;">
        <div style="font-size: 28px; margin-bottom: 8px;">📦</div>
        <div style="font-size: 20px; font-weight: 600; color: #ffffff;">Your Order Has Shipped</div>
        <div style="font-size: 13px; color: #576574; margin-top: 6px;">Good news — your order is on its way!</div>
      </div>

      <!-- Order Number -->
      <div style="background: #0f172a; border: 1px solid #222f3e; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 11px; color: #576574; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Order Number</div>
        <div style="font-family: 'Monaco', 'Menlo', 'Courier New', monospace; font-size: 20px; font-weight: 700; color: #38bdf8;">${order.order_number}</div>
      </div>

      ${trackingSection}

      <!-- Items -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 11px; color: #576574; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Items Shipped</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px 0; text-align: left; font-size: 11px; color: #576574; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #222f3e;">Item</th>
              <th style="padding: 8px 0; text-align: center; font-size: 11px; color: #576574; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #222f3e;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>

      <!-- Shipping -->
      <div style="background: #0f172a; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px;">
        <div style="font-size: 11px; color: #576574; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Shipping to</div>
        <div style="color: #c8d6e5; font-size: 14px;">${order.customer_first_name} ${order.customer_last_name}</div>
        <div style="color: #576574; font-size: 13px; margin-top: 2px;">${order.shipping_address}</div>
        <div style="color: #576574; font-size: 13px;">${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}</div>
      </div>

      <!-- Research Disclaimer -->
      <div style="font-size: 10px; color: #576574; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; padding: 16px 0; border-top: 1px solid #222f3e;">
        For research use only - Not intended for human consumption
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #0f172a; padding: 16px 32px; border-radius: 0 0 8px 8px; text-align: center;">
      <div style="font-size: 11px; color: #576574;">darktideslab.com</div>
    </div>

  </div>
</body>
</html>
  `;
}

function generateCancellationEmailHTML(order: OrderData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0a0f1a;">
  <div style="max-width: 560px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <div style="background: #0f172a; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
      <img src="https://darktideslab.com/logo.png" alt="DarkTides" width="60" height="60" style="display: block; margin: 0 auto 12px;" />
      <div style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.12em; text-transform: uppercase;">DARKTIDES</div>
      <div style="font-size: 10px; color: #576574; letter-spacing: 0.3em; text-transform: uppercase; margin-top: 2px;">RESEARCH</div>
    </div>

    <!-- Body -->
    <div style="background: #141c2b; padding: 32px;">

      <div style="text-align: center; margin-bottom: 28px;">
        <div style="font-size: 20px; font-weight: 600; color: #ffffff;">Order Cancelled</div>
      </div>

      <!-- Order Number -->
      <div style="background: #0f172a; border: 1px solid #222f3e; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 11px; color: #576574; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Order Number</div>
        <div style="font-family: 'Monaco', 'Menlo', 'Courier New', monospace; font-size: 20px; font-weight: 700; color: #38bdf8;">${order.order_number}</div>
      </div>

      <!-- Message -->
      <div style="background: #0f172a; border: 1px solid #222f3e; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #c8d6e5; font-size: 14px; line-height: 1.6; margin: 0;">
          Your order has been cancelled due to no payment received.
        </p>
        <p style="color: #c8d6e5; font-size: 14px; line-height: 1.6; margin: 16px 0 0;">
          Reply to this email if you have any further questions or need assistance with the checkout process.
        </p>
      </div>

      <!-- Research Disclaimer -->
      <div style="font-size: 10px; color: #576574; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; padding: 16px 0; border-top: 1px solid #222f3e;">
        For research use only - Not intended for human consumption
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #0f172a; padding: 16px 32px; border-radius: 0 0 8px 8px; text-align: center;">
      <div style="font-size: 11px; color: #576574;">darktideslab.com</div>
    </div>

  </div>
</body>
</html>
  `;
}

async function sendBrevoTransactionalEmail(order: OrderData): Promise<{ success: boolean; messageId?: string }> {
  const brevoApiKey = Deno.env.get('BREVO_API_KEY')
  if (!brevoApiKey) {
    console.warn('BREVO_API_KEY not configured, skipping customer email')
    return { success: false }
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'DarkTides Research', email: 'orders@darktideslab.com' },
      to: [{ email: order.customer_email, name: `${order.customer_first_name} ${order.customer_last_name}` }],
      subject: `Order Confirmed - ${order.order_number} | DarkTides Research`,
      replyTo: { email: 'darktidesresearch@protonmail.com', name: 'DarkTides Research' },
      htmlContent: generateCustomerEmailHTML(order),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Brevo transactional email error:', errorText)
    return { success: false }
  }

  const result = await response.json()
  console.log('Brevo customer email sent:', result)
  return { success: true, messageId: result.messageId }
}

async function addBrevoContact(order: OrderData): Promise<boolean> {
  const brevoApiKey = Deno.env.get('BREVO_API_KEY')
  const brevoListId = Deno.env.get('BREVO_LIST_ID')
  if (!brevoApiKey || !brevoListId) {
    console.warn('BREVO_API_KEY or BREVO_LIST_ID not configured, skipping contact add')
    return false
  }

  const listId = parseInt(brevoListId, 10)

  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'api-key': brevoApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: order.customer_email,
      attributes: {
        FIRSTNAME: order.customer_first_name,
        LASTNAME: order.customer_last_name,
        CITY: order.shipping_city,
        STATE: order.shipping_state,
      },
      listIds: [listId],
      updateEnabled: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Brevo add contact error:', errorText)
    return false
  }

  console.log('Brevo contact added/updated:', order.customer_email)
  return true
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const emailType = body.type || 'confirmation' // 'confirmation' (default) or 'shipped'
    let order: OrderData
    let trackingUrl: string | undefined

    if (body.record) {
      // Direct record passed (legacy / DB trigger style)
      order = body.record
    } else if (body.order_number) {
      // Only order_number passed — look up from DB using service role key
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, serviceRoleKey)

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', body.order_number)
        .single()

      if (error || !data) {
        throw new Error(`Order not found: ${body.order_number} — ${error?.message || 'no data'}`)
      }

      order = data as OrderData
      trackingUrl = data.tracking_url
    } else {
      throw new Error('Must provide either record or order_number')
    }

    console.log(`Processing order: ${order.order_number}, type: ${emailType}`)

    // ── SHIPPED EMAIL ──────────────────────────────────────────
    if (emailType === 'shipped') {
      const brevoApiKey = Deno.env.get('BREVO_API_KEY')
      if (!brevoApiKey) {
        throw new Error('BREVO_API_KEY not configured')
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'DarkTides Research', email: 'orders@darktideslab.com' },
          to: [{ email: order.customer_email, name: `${order.customer_first_name} ${order.customer_last_name}` }],
          subject: `Your Order Has Shipped - ${order.order_number} | DarkTides Research`,
          replyTo: { email: 'darktidesresearch@protonmail.com', name: 'DarkTides Research' },
          htmlContent: generateShippingEmailHTML(order, trackingUrl),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Brevo shipping email error:', errorText)
        throw new Error(`Failed to send shipping email: ${errorText}`)
      }

      const result = await response.json()
      console.log('Shipping email sent:', result)

      return new Response(
        JSON.stringify({ success: true, type: 'shipped', messageId: result.messageId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // ── CANCELLED EMAIL ──────────────────────────────────────────
    if (emailType === 'cancelled') {
      const brevoApiKey = Deno.env.get('BREVO_API_KEY')
      if (!brevoApiKey) {
        throw new Error('BREVO_API_KEY not configured')
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'DarkTides Research', email: 'orders@darktideslab.com' },
          to: [{ email: order.customer_email, name: `${order.customer_first_name} ${order.customer_last_name}` }],
          subject: `Order Cancelled - ${order.order_number} | DarkTides Research`,
          replyTo: { email: 'darktidesresearch@protonmail.com', name: 'DarkTides Research' },
          htmlContent: generateCancellationEmailHTML(order),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Brevo cancellation email error:', errorText)
        throw new Error(`Failed to send cancellation email: ${errorText}`)
      }

      const result = await response.json()
      console.log('Cancellation email sent:', result)

      return new Response(
        JSON.stringify({ success: true, type: 'cancelled', messageId: result.messageId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // ── CONFIRMATION EMAIL (default) ───────────────────────────
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

    // Send customer confirmation email via Brevo + add to contact list
    let customerEmail = { success: false, messageId: undefined as string | undefined }
    let contactAdded = false

    try {
      const [emailResult, contactResult] = await Promise.all([
        sendBrevoTransactionalEmail(order),
        addBrevoContact(order),
      ])
      customerEmail = emailResult
      contactAdded = contactResult
      console.log(`Brevo results — email: ${emailResult.success}, contact: ${contactResult}`)
    } catch (brevoError) {
      console.error('Brevo error (non-fatal, business email already sent):', brevoError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        businessEmailId: businessResult.id,
        customerEmail: customerEmail.success,
        customerEmailMessageId: customerEmail.messageId,
        contactAdded,
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