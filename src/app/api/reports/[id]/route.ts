import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getCitizenFromSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('citizen_session')?.value
  if (!sessionToken) return null

  const { data: session } = await supabase
    .from('citizen_sessions')
    .select('citizen_id')
    .eq('token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single()

  return session?.citizen_id || null
}

// GET: Obtener detalle de reporte
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const citizenId = await getCitizenFromSession()
    if (!citizenId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const { data: report, error } = await supabase
      .from('reports')
      .select(`
        *,
        report_categories(id, name, icon),
        report_photos(id, url, is_primary, created_at),
        report_status_history(
          id, from_status, to_status, notes, created_at,
          changed_by_type
        ),
        report_resolutions(
          id, resolution_type, description, created_at,
          resolution_photos(url)
        )
      `)
      .eq('id', id)
      .eq('citizen_id', citizenId)
      .single()

    if (error || !report) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
    }

    // Calcular estado de SLA
    const now = new Date()
    const firstResponseDeadline = new Date(report.first_response_deadline)
    const resolutionDeadline = new Date(report.resolution_deadline)

    let firstResponseSla = 'ok'
    let resolutionSla = 'ok'

    if (report.first_response_at) {
      firstResponseSla = new Date(report.first_response_at) <= firstResponseDeadline ? 'ok' : 'expired'
    } else if (now > firstResponseDeadline) {
      firstResponseSla = 'expired'
    } else if (now > new Date(firstResponseDeadline.getTime() - 4 * 60 * 60 * 1000)) {
      firstResponseSla = 'warning'
    }

    if (report.resolved_at) {
      resolutionSla = new Date(report.resolved_at) <= resolutionDeadline ? 'ok' : 'expired'
    } else if (now > resolutionDeadline) {
      resolutionSla = 'expired'
    } else if (now > new Date(resolutionDeadline.getTime() - 8 * 60 * 60 * 1000)) {
      resolutionSla = 'warning'
    }

    // Construir timeline para ciudadano
    const timeline = (report.report_status_history || [])
      .filter((h: any) => h.changed_by_type === 'system' || h.to_status === 'resuelto' || h.to_status === 'no_procede')
      .map((h: any) => ({
        status: h.to_status,
        timestamp: h.created_at,
        notes: h.notes,
      }))
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    return NextResponse.json({
      report: {
        id: report.id,
        folio: report.folio,
        category: report.report_categories,
        description: report.description,
        address: report.address,
        colonia: report.colonia,
        reference: report.reference,
        latitude: report.latitude,
        longitude: report.longitude,
        status: report.citizen_status,
        photos: report.report_photos,
        resolution: report.report_resolutions?.[0] || null,
        rating: report.rating,
        ratingComment: report.rating_comment,
        canRate: report.citizen_status === 'resuelto' && !report.rating,
        canRequestReview: report.citizen_status === 'no_procede' && !report.review_requested,
        createdAt: report.created_at,
        sla: {
          firstResponse: {
            deadline: report.first_response_deadline,
            status: firstResponseSla,
            completedAt: report.first_response_at,
          },
          resolution: {
            deadline: report.resolution_deadline,
            status: resolutionSla,
            completedAt: report.resolved_at,
          },
        },
        timeline,
      },
    })
  } catch (error) {
    console.error('Report GET Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
