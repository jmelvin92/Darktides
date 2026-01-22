import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, subject, message } = await req.json()

    // Validate input
    if (!name || !email || !subject || !message) {
      throw new Error('Missing required fields')
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Create the HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Form Inquiry - DarkTides Research</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">🧪 DarkTides Research</h1>
    <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">New Contact Form Inquiry</p>
  </div>

  <!-- Content -->
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Subject -->
    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 5px; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Subject</h2>
      <p style="margin: 0; font-size: 18px; color: #1e293b; font-weight: 600;">${subject}</p>
    </div>

    <!-- Sender Info -->
    <div style="margin-bottom: 25px;">
      <h3 style="margin: 0 0 15px; font-size: 16px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Sender Information</h3>
      <div style="background: #fafafa; padding: 15px; border-radius: 8px; border-left: 4px solid #38bdf8;">
        <p style="margin: 0 0 8px;">
          <strong style="color: #64748b; display: inline-block; width: 80px;">Name:</strong>
          <span style="color: #1e293b;">${name}</span>
        </p>
        <p style="margin: 0;">
          <strong style="color: #64748b; display: inline-block; width: 80px;">Email:</strong>
          <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
        </p>
      </div>
    </div>

    <!-- Message -->
    <div style="margin-bottom: 25px;">
      <h3 style="margin: 0 0 15px; font-size: 16px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Message</h3>
      <div style="background: #fafafa; padding: 20px; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word; color: #334155; line-height: 1.8;">
${message}
      </div>
    </div>

    <!-- Reply Button -->
    <div style="text-align: center; margin-top: 30px;">
      <a href="mailto:${email}?subject=Re: ${subject}" style="display: inline-block; background: #38bdf8; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
        ↩️ Reply to ${name}
      </a>
    </div>

    <!-- Timestamp -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        Received on ${new Date().toLocaleString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })}
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
    <p>This email was sent from the contact form at darktideslab.com</p>
  </div>

</body>
</html>
    `;

    // Send the email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DarkTides Contact Form <onboarding@resend.dev>',
        to: ['darktidesresearch@protonmail.com'],
        subject: `[Contact Form] ${subject}`,
        html: htmlContent,
        reply_to: email,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      console.error('Resend API error:', error)
      throw new Error(`Failed to send email: ${error}`)
    }

    const result = await emailResponse.json()
    console.log('Contact email sent successfully:', result)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in send-contact-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})