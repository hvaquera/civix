import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

// Solo crear cliente si tenemos service key
const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null

// Usuario demo para desarrollo
const DEV_USER = {
  id: 'dev-admin-001',
  email: 'admin@civix.mx',
  password: 'admin123',
  name: 'Admin Demo',
  role: 'superadmin',
  status: 'active',
  municipality: { id: 1, name: 'Monterrey' },
  area: null,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Se requiere correo y contraseña' },
        { status: 400 }
      )
    }

    // MODO DESARROLLO: Si no hay Supabase service key, usar usuario demo
    if (!supabase || process.env.NODE_ENV === 'development') {
      // Aceptar usuario demo
      if (email.toLowerCase() === DEV_USER.email && password === DEV_USER.password) {
        const sessionToken = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000)

        const cookieStore = await cookies()
        cookieStore.set('admin_session', sessionToken, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          expires: expiresAt,
          path: '/',
        })

        console.log('[DEV] Login exitoso para usuario demo')

        return NextResponse.json({
          success: true,
          user: {
            id: DEV_USER.id,
            name: DEV_USER.name,
            email: DEV_USER.email,
            role: DEV_USER.role,
            municipality: DEV_USER.municipality,
            area: DEV_USER.area,
          },
        })
      }

      return NextResponse.json(
        { error: 'En desarrollo usa: admin@civix.mx / admin123' },
        { status: 401 }
      )
    }

    // MODO PRODUCCIÓN: Usar Supabase real
    const { data: user, error: fetchError } = await supabase
      .from('admin_users')
      .select(`
        id, email, password_hash, name, role, status,
        municipality_id, area_id,
        municipalities(id, name),
        municipal_areas(id, name)
      `)
      .eq('email', email.toLowerCase())
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Tu cuenta está desactivada. Contacta al administrador.' },
        { status: 403 }
      )
    }

    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'login_failed',
        resource_type: 'auth',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      })

      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000)

    await supabase.from('admin_sessions').insert({
      user_id: user.id,
      token: sessionToken,
      expires_at: expiresAt.toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    })

    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'login_success',
      resource_type: 'auth',
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    })

    const cookieStore = await cookies()
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        municipality: user.municipalities,
        area: user.municipal_areas,
      },
    })
  } catch (error) {
    console.error('Login Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 }
  )
  }
}
