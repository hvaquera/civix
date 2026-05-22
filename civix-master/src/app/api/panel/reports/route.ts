import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAdminFromSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin_session')?.value
  if (!sessionToken) return null

  const { data: session } = await supabase
    .from('admin_sessions')
    .select(`
      user_id,
      admin_users(id, name, email, role, municipality_id, area_id)
    `)
    .eq('token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single()

  return session?.admin_users || null
}

// GET: Listar reportes para el panel
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const area = searchParams.get('area')
    const sla = searchParams.get('sla')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')

    let query = supabase
      .from('reports')
      .select(`
        *,
        report_categories(id, name, icon),
        citizens(id, nombre, apellido_paterno, colonia),
        municipal_areas(id, name),
        admin_users!reports_assignee_id_fkey(id, name)
      `, { count: 'exact' })
      .eq('municipality_id', admin.municipality_id)
      .order('created_at', { ascending: false })

    // Filtrar por rol
    if (admin.role === 'coordinator' && admin.area_id) {
      query = query.eq('area_id', admin.area_id)
    } else if (admin.role === 'operator') {
      query = query.eq('assignee_id', admin.id)
    }

    // Filtros
    if (status && status !== 'all') {
      query = query.eq('internal_status', status)
    }
    if (category && category !== 'all') {
      query = query.eq('category_id', category)
    }
    if (area && area !== 'all') {
      query = query.eq('area_id', area)
    }
    if (search) {
      query = query.or(`folio.ilike.%${search}%,address.ilike.%${search}%,colonia.ilike.%${search}%`)
    }

    // Filtro SLA
    const now = new Date().toISOString()
    if (sla === 'expired') {
      query = query.lt('resolution_deadline', now).is('resolved_at', null)
    } else if (sla === 'warning') {
      const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      query = query.gt('resolution_deadline', now).lt('resolution_deadline', fourHoursFromNow).is('resolved_at', null)
    }

    // Paginación
    query = query.range((page - 1) * limit, page * limit - 1)

    const { data: reports, error, count } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json({ error: 'Error obteniendo reportes' }, { status: 500 })
    }

    // Calcular estado SLA para cada reporte
    const reportsWithSla = (reports || []).map(report => {
      const now = new Date()
      const deadline = new Date(report.resolution_deadline)
      let slaStatus = 'ok'
      
      if (report.resolved_at) {
        slaStatus = new Date(report.resolved_at) <= deadline ? 'ok' : 'expired'
      } else if (now > deadline) {
        slaStatus = 'expired'
      } else if (now > new Date(deadline.getTime() - 4 * 60 * 60 * 1000)) {
        slaStatus = 'warning'
      }

      return { ...report, sla_status: slaStatus }
    })

    return NextResponse.json({
      reports: reportsWithSla,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Panel Reports GET Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
