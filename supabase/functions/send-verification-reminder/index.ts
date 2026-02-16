import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_number, payment_method, total } = await req.json()

    if (!order_number || !payment_method || total == null) {
      throw new Error('Missing required fields: order_number, payment_method, total')
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const notificationEmail = Deno.env.get('NOTIFICATION_EMAIL')

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }
    if (!notificationEmail) {
      throw new Error('NOTIFICATION_EMAIL not configured')
    }

    const methodLabel = payment_method === 'crypto' ? 'Coinbase' : 'Venmo'

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Payment — ${order_number}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">

  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 700;">⚡ Verify Payment</h1>
    <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">New order needs payment verification</p>
  </div>

  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

    <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 16px; font-weight: 600; color: #92400e;">
        Check your ${methodLabel} for this payment
      </p>
    </div>

    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="font-weight: 600; color: #374151;">Order:</span>
        <span style="font-family: monospace; background: #38bdf8; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${order_number}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="font-weight: 600; color: #374151;">Amount:</span>
        <span style="font-weight: 700; color: #059669; font-size: 20px;">$${Number(total).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: 600; color: #374151;">Method:</span>
        <span style="background: ${payment_method === 'crypto' ? '#10b981' : '#38bdf8'}; color: white; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; font-weight: bold; text-transform: uppercase;">
          ${payment_method === 'crypto' ? 'CRYPTO' : 'VENMO'}
        </span>
      </div>
    </div>

    <div style="background: #dcfce7; border: 1px solid #22c55e; padding: 15px; border-radius: 8px; text-align: center;">
      <p style="margin: 0; color: #166534; font-size: 14px;">
        Once verified, confirm this order in the <strong>Admin Panel</strong> to deduct inventory and send the full order email.
      </p>
    </div>

  </div>

  <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
    <p>DarkTides Research | Admin Reminder</p>
  </div>

</body>
</html>
    `

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DarkTides Research <onboarding@resend.dev>',
        to: [notificationEmail],
        subject: `⚡ Verify Payment — ${order_number} ($${Number(total).toFixed(2)} via ${methodLabel})`,
        html,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      console.error('Reminder email error:', error)
      throw new Error(`Failed to send reminder email: ${error}`)
    }

    const result = await emailResponse.json()
    console.log('Verification reminder sent:', result)

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
