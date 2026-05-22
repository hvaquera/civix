import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Solo crear cliente si tenemos service key
const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null

// Generar código de 6 dígitos
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Enviar por WhatsApp (Twilio)
async function sendWhatsAppOTP(phone: string, code: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio not configured, skipping WhatsApp send')
    return true
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: `whatsapp:+52${phone}`,
          Body: `Tu código de verificación CIVIX es: ${code}\n\nEste código expira en 10 minutos.`,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Twilio error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return false
  }
}

// Enviar por Email (Resend)
async function sendEmailOTP(email: string, code: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.warn('Resend not configured, skipping email send')
    return true
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CIVIX <noreply@civix.mx>',
        to: email,
        subject: 'Tu código de verificación CIVIX',
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1e40af; margin-bottom: 20px;">CIVIX</h1>
            <p>Tu código de verificación es:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${code}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Este código expira en 10 minutos.</p>
          </div>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Resend error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { method, contact } = body

    if (!method || !contact) {
      return NextResponse.json(
        { error: 'Se requiere método y contacto' },
        { status: 400 }
      )
    }

    if (method !== 'whatsapp' && method !== 'email') {
      return NextResponse.json(
        { error: 'Método inválido' },
        { status: 400 }
      )
    }

    // Validar formato
    if (method === 'whatsapp') {
      const phoneRegex = /^[0-9]{10}$/
      if (!phoneRegex.test(contact)) {
        return NextResponse.json(
          { error: 'Número de teléfono inválido (10 dígitos)' },
          { status: 400 }
        )
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(contact)) {
        return NextResponse.json(
          { error: 'Correo electrónico inválido' },
          { status: 400 }
        )
      }
    }

    // Generar OTP
    const code = generateOTP()

    // En desarrollo, siempre usar código 123456 para facilitar pruebas
    const devCode = process.env.NODE_ENV === 'development' ? '123456' : code
    const finalCode = process.env.NODE_ENV === 'development' ? '123456' : code

    // Intentar guardar en DB si tenemos Supabase configurado
    if (supabase) {
      try {
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
        await supabase.from('otp_codes').insert({
          method,
          contact,
          code: finalCode,
          expires_at: expiresAt.toISOString(),
        })
      } catch (dbError) {
        console.warn('DB not available, continuing without persistence')
      }
    }

    // En producción, enviar OTP real
    if (process.env.NODE_ENV !== 'development') {
      let sent = false
      if (method === 'whatsapp') {
        sent = await sendWhatsAppOTP(contact, finalCode)
      } else {
        sent = await sendEmailOTP(contact, finalCode)
      }

      if (!sent) {
        return NextResponse.json(
          { error: 'Error enviando el código. Intenta de nuevo.' },
          { status: 500 }
        )
      }
    }

    console.log(`[DEV] OTP para ${contact}: ${finalCode}`)

    return NextResponse.json({
      success: true,
      message: method === 'whatsapp' 
        ? 'Código enviado por WhatsApp' 
        : 'Código enviado a tu correo',
      // En desarrollo, devolver código para pruebas
      ...(process.env.NODE_ENV === 'development' && { devCode: '123456' }),
    })
  } catch (error) {
    console.error('Send OTP Error:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
