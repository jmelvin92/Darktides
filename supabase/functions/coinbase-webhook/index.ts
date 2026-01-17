import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookEvent {
  id: string;
  type: string;
  data: {
    code: string;
    name: string;
    payments: Array<{
      network: string;
      transaction_id: string;
      status: string;
      value: {
        amount: string;
        currency: string;
      };
    }>;
    timeline: Array<{
      status: string;
      time: string;
    }>;
    metadata: {
      order_number: string;
      customer_email: string;
      customer_name: string;
    };
  };
}

// Verify webhook signature from Coinbase
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  const computedSignature = hmac.digest('hex')
  return computedSignature === signature
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('COINBASE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured')
    }

    // Get signature from headers
    const signature = req.headers.get('X-CC-Webhook-Signature')
    if (!signature) {
      throw new Error('No signature provided')
    }

    // Get raw body for signature verification
    const rawBody = await req.text()
    
    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return new Response('Unauthorized', { status: 401 })
    }

    // Parse the webhook event
    const event: WebhookEvent = JSON.parse(rawBody).event

    console.log(`Received webhook event: ${event.type} for charge ${event.data.code}`)

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event.type) {
      case 'charge:confirmed':
      case 'charge:resolved': {
        // Payment confirmed - update order status
        const paymentDetails = {
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          payments: event.data.payments,
          timeline: event.data.timeline
        }

        // Update order status in database
        const { data, error } = await supabase.rpc('confirm_crypto_payment', {
          p_charge_code: event.data.code,
          p_payment_details: paymentDetails
        })

        if (error) {
          console.error('Error updating order:', error)
          throw error
        }

        if (data && data[0]?.success) {
          const orderNumber = data[0].message
          console.log(`Order ${orderNumber} payment confirmed`)

          // Get order details for email
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', orderNumber)
            .single()

          if (!orderError && orderData) {
            // Trigger email notification
            const emailData = {
              record: {
                ...orderData,
                payment_confirmation: {
                  method: 'crypto',
                  network: event.data.payments[0]?.network || 'Unknown',
                  transaction_id: event.data.payments[0]?.transaction_id || 'N/A',
                  confirmed_at: new Date().toISOString()
                }
              }
            }

            // Call the send-order-email function
            await supabase.functions.invoke('send-order-email', {
              body: emailData
            })
          }
        }
        break
      }

      case 'charge:pending': {
        // Payment detected but not confirmed yet
        const paymentDetails = {
          status: 'pending',
          pending_at: new Date().toISOString(),
          payments: event.data.payments
        }

        await supabase
          .from('orders')
          .update({ 
            payment_status: 'pending_confirmation',
            crypto_payment_details: paymentDetails 
          })
          .eq('coinbase_charge_code', event.data.code)

        console.log(`Payment pending for charge ${event.data.code}`)
        break
      }

      case 'charge:failed':
      case 'charge:expired': {
        // Payment failed or expired
        const paymentDetails = {
          status: event.type === 'charge:failed' ? 'failed' : 'expired',
          failed_at: new Date().toISOString(),
          timeline: event.data.timeline
        }

        await supabase
          .from('orders')
          .update({ 
            payment_status: event.type === 'charge:failed' ? 'failed' : 'expired',
            crypto_payment_details: paymentDetails
          })
          .eq('coinbase_charge_code', event.data.code)

        console.log(`Charge ${event.type} for ${event.data.code}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})