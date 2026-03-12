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
    .select('user_id, admin_users(*)')
    .eq('token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single()

  return session?.admin_users || null
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const municipalityId = admin.municipality_id
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Alertas: Sin asignar
    const { count: unassignedCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('municipality_id', municipalityId)
      .in('internal_status', ['nuevo', 'sin_asignar'])

    // Alertas: Por vencer SLA (próximas 4 horas)
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString()
    const { count: slaWarningCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('municipality_id', municipalityId)
      .is('resolved_at', null)
      .gt('resolution_deadline', now.toISOString())
      .lt('resolution_deadline', fourHoursFromNow)

    // Alertas: SLA vencido
    const { count: slaExpiredCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('municipality_id', municipalityId)
      .is('resolved_at', null)
      .lt('resolution_deadline', now.toISOString())

    // Alertas: Revisión solicitada
    const { count: reviewRequestedCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('municipality_id', municipalityId)
      .eq('internal_status', 'reabierto')

    // KPI: Resueltos hoy
    const { count: resolvedTodayCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('municipality_id', municipalityId)
      .gte('resolved_at', todayStart)

    // KPI: Total últimos 7 días
    const { count: totalWeekCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('municipality_id', municipalityId)
      .gte('created_at', sevenDaysAgo)

    // KPI: Resueltos últimos 7 días
    const { count: resolvedWeekCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('municipality_id', municipalityId)
      .gte('resolved_at', sevenDaysAgo)

    // Calcular tiempo promedio de primera respuesta (últimos 7 días)
    const { data: responseTimeData } = await supabase
      .from('reports')
      .select('created_at, first_response_at')
      .eq('municipality_id', municipalityId)
      .not('first_response_at', 'is', null)
      .gte('created_at', sevenDaysAgo)

    let avgFirstResponseHours = 0
    if (responseTimeData && responseTimeData.length > 0) {
      const totalHours = responseTimeData.reduce((sum, r) => {
        const created = new Date(r.created_at)
        const responded = new Date(r.first_response_at)
        return sum + (responded.getTime() - created.getTime()) / (1000 * 60 * 60)
      }, 0)
      avgFirstResponseHours = totalHours / responseTimeData.length
    }

    // Calcular % dentro de SLA
    const { data: slaData } = await supabase
      .from('reports')
      .select('resolved_at, resolution_deadline')
      .eq('municipality_id', municipalityId)
      .not('resolved_at', 'is', null)
      .gte('resolved_at', sevenDaysAgo)

    let slaCompliancePercent = 0
    if (slaData && slaData.length > 0) {
      const inTime = slaData.filter(r => 
        new Date(r.resolved_at) <= new Date(r.resolution_deadline)
      ).length
      slaCompliancePercent = Math.round((inTime / slaData.length) * 100)
    }

    // Cola prioritaria (top 10 urgentes)
    const { data: priorityQueue } = await supabase
      .from('reports')
      .select(`
        id, folio, category_id, internal_status, priority,
        resolution_deadline, created_at,
        report_categories(name),
        municipal_areas(name),
        admin_users!reports_assignee_id_fkey(name)
      `)
      .eq('municipality_id', municipalityId)
      .is('resolved_at', null)
      .order('resolution_deadline', { ascending: true })
      .limit(10)

    // Agregar estado SLA a cada reporte de la cola
    const priorityQueueWithSla = (priorityQueue || []).map(report => {
      const deadline = new Date(report.resolution_deadline)
      let slaStatus = 'ok'
      if (now > deadline) {
        slaStatus = 'expired'
      } else if (now > new Date(deadline.getTime() - 4 * 60 * 60 * 1000)) {
        slaStatus = 'warning'
      }
      return { ...report, sla_status: slaStatus }
    })

    return NextResponse.json({
      alerts: {
        unassigned: unassignedCount || 0,
        slaWarning: slaWarningCount || 0,
        slaExpired: slaExpiredCount || 0,
        reviewRequested: reviewRequestedCount || 0,
      },
      kpis: {
        resolvedToday: resolvedTodayCount || 0,
        totalWeek: totalWeekCount || 0,
        resolvedWeek: resolvedWeekCount || 0,
        avgFirstResponseHours: Math.round(avgFirstResponseHours * 10) / 10,
        slaCompliancePercent,
      },
      priorityQueue: priorityQueueWithSla,
    })
  } catch (error) {
    console.error('Dashboard Stats Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
