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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const citizenId = await getCitizenFromSession()
    if (!citizenId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { rating, tags, comment, requestReview } = body

    // Validar rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Calificación inválida (1-5)' }, { status: 400 })
    }

    // Verificar que el reporte existe y pertenece al ciudadano
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('id, citizen_status, rating')
      .eq('id', id)
      .eq('citizen_id', citizenId)
      .single()

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
    }

    // Verificar que se puede calificar
    if (report.citizen_status !== 'resuelto' && report.citizen_status !== 'no_procede') {
      return NextResponse.json(
        { error: 'Solo puedes calificar reportes resueltos' },
        { status: 400 }
      )
    }

    if (report.rating) {
      return NextResponse.json(
        { error: 'Este reporte ya fue calificado' },
        { status: 400 }
      )
    }

    // Actualizar reporte con calificación
    const updateData: any = {
      rating,
      rating_tags: tags || [],
      rating_comment: comment || null,
      rated_at: new Date().toISOString(),
    }

    // Si solicita revisión
    if (requestReview && rating <= 2) {
      updateData.review_requested = true
      updateData.review_requested_at = new Date().toISOString()
      updateData.citizen_status = 'revision_solicitada'
      updateData.internal_status = 'reabierto'
    }

    const { error: updateError } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating rating:', updateError)
      return NextResponse.json({ error: 'Error guardando calificación' }, { status: 500 })
    }

    // Registrar en historial si se solicitó revisión
    if (requestReview && rating <= 2) {
      await supabase.from('report_status_history').insert({
        report_id: id,
        from_status: report.citizen_status,
        to_status: 'reabierto',
        changed_by_type: 'citizen',
        changed_by_id: citizenId,
        notes: `Revisión solicitada. Calificación: ${rating}/5. Motivo: ${comment || 'No especificado'}`,
      })
    }

    return NextResponse.json({
      success: true,
      message: requestReview 
        ? 'Calificación enviada. Tu caso será revisado nuevamente.' 
        : 'Gracias por tu calificación.',
    })
  } catch (error) {
    console.error('Rating Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
