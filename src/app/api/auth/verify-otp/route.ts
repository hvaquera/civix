import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Solo crear cliente si tenemos service key
const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { method, contact, code } = body

    if (!method || !contact || !code) {
      return NextResponse.json(
        { error: 'Se requiere método, contacto y código' },
        { status: 400 }
      )
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'El código debe ser de 6 dígitos' },
        { status: 400 }
      )
    }

    // En desarrollo, aceptar código "123456" siempre
    const isDev = process.env.NODE_ENV === 'development'
    const isDevCode = isDev && code === '123456'

    // MODO DESARROLLO: Si no hay Supabase o es código de dev, simular
    if (!supabase || isDevCode) {
      if (!isDevCode) {
        return NextResponse.json(
          { error: 'Código incorrecto (en dev usa: 123456)' },
          { status: 400 }
        )
      }

      // Crear sesión mock
      const sessionToken = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const cookieStore = await cookies()
      cookieStore.set('citizen_session', sessionToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        expires: expiresAt,
        path: '/',
      })

      console.log('[DEV] OTP verificado, sesión creada')

      return NextResponse.json({
        success: true,
        citizen: {
          id: 'dev-citizen-001',
          contactVerified: true,
          ineVerified: false,
          status: 'pending_ine',
          name: null,
        },
        needsINE: true,
      })
    }

    // MODO PRODUCCIÓN: Verificar contra DB
    const { data: otpRecord } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('contact', contact)
      .eq('method', method)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!otpRecord && !isDevCode) {
      const { data: expiredCode } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('contact', contact)
        .eq('code', code)
        .limit(1)
        .single()

      if (expiredCode) {
        return NextResponse.json(
          { error: 'El código ha expirado. Solicita uno nuevo.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Código incorrecto' },
        { status: 400 }
      )
    }

    if (otpRecord) {
      await supabase
        .from('otp_codes')
        .update({ used: true })
        .eq('id', otpRecord.id)
    }

    let citizen
    const { data: existingCitizen } = await supabase
      .from('citizens')
      .select('*')
      .eq('contact_method', method)
      .eq('contact_value', contact)
      .limit(1)
      .single()

    if (existingCitizen) {
      citizen = existingCitizen
    } else {
      const { data: newCitizen, error: createError } = await supabase
        .from('citizens')
        .insert({
          contact_method: method,
          contact_value: contact,
          contact_verified: true,
          ine_verified: false,
          status: 'pending_ine',
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating citizen:', createError)
        return NextResponse.json(
          { error: 'Error creando usuario' },
          { status: 500 }
        )
      }

      citizen = newCitizen
    }

    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await supabase.from('citizen_sessions').insert({
      citizen_id: citizen.id,
      token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })

    const cookieStore = await cookies()
    cookieStore.set('citizen_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      citizen: {
        id: citizen.id,
        contactVerified: true,
        ineVerified: citizen.ine_verified,
        status: citizen.status,
        name: citizen.nombre,
      },
      needsINE: !citizen.ine_verified,
    })
  } catch (error) {
    console.error('Verify OTP Error:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
