import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChargeRequest {
  orderNumber: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request data
    const requestData: ChargeRequest = await req.json()
    
    // Get API key from environment
    const apiKey = Deno.env.get('COINBASE_COMMERCE_API_KEY')
    if (!apiKey) {
      throw new Error('Coinbase Commerce API key not configured')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Prepare charge data for Coinbase
    const chargeData = {
      name: `Order ${requestData.orderNumber}`,
      description: `DarkTides Research - Order ${requestData.orderNumber}`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: requestData.amount.toFixed(2),
        currency: 'USD'
      },
      metadata: {
        order_number: requestData.orderNumber,
        customer_email: requestData.customerEmail,
        customer_name: requestData.customerName
      },
      redirect_url: `https://darktideslab.com/order-complete?order=${requestData.orderNumber}`,
      cancel_url: `https://darktideslab.com/checkout`
    }

    console.log('Creating Coinbase charge for order:', requestData.orderNumber)

    // Create charge via Coinbase Commerce API
    const response = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': apiKey,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(chargeData)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Coinbase API error:', error)
      throw new Error(`Coinbase API error: ${response.status}`)
    }

    const chargeResponse = await response.json()
    const charge = chargeResponse.data

    console.log('Coinbase charge created:', charge.code)

    // Update order with Coinbase charge details
    const { error: dbError } = await supabase.rpc('update_order_coinbase_charge', {
      p_order_number: requestData.orderNumber,
      p_charge_code: charge.code,
      p_hosted_url: charge.hosted_url
    })

    if (dbError) {
      console.error('Database update error:', dbError)
      // Continue anyway - charge is created
    }

    // Return charge details to frontend
    return new Response(
      JSON.stringify({
        success: true,
        chargeCode: charge.code,
        hostedUrl: charge.hosted_url,
        expiresAt: charge.expires_at
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating charge:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})