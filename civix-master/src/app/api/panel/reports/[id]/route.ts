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

// GET: Detalle de reporte
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const { data: report, error } = await supabase
      .from('reports')
      .select(`
        *,
        report_categories(id, name, icon),
        citizens(id, nombre, apellido_paterno, apellido_materno, colonia, contact_method, contact_value),
        municipal_areas(id, name),
        admin_users!reports_assignee_id_fkey(id, name, email),
        report_photos(id, url, is_primary, created_at),
        report_internal_notes(id, note, created_at, admin_users(name)),
        report_status_history(id, from_status, to_status, notes, created_at, changed_by_type, admin_users(name)),
        report_resolutions(id, resolution_type, description, created_at, resolution_photos(url)),
        grouped_issues(id, title)
      `)
      .eq('id', id)
      .eq('municipality_id', admin.municipality_id)
      .single()

    if (error || !report) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Panel Report GET Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PATCH: Actualizar reporte (asignar, cambiar estado, etc)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, ...data } = body

    // Obtener reporte actual
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .eq('municipality_id', admin.municipality_id)
      .single()

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
    }

    const previousStatus = report.internal_status

    switch (action) {
      case 'assign': {
        const { areaId, assigneeId, priority, note } = data

        const updateData: any = {
          internal_status: 'asignado',
          citizen_status: 'en_proceso',
        }
        if (areaId) updateData.area_id = areaId
        if (assigneeId) updateData.assignee_id = assigneeId
        if (priority) updateData.priority = priority

        // Marcar primera respuesta si no existe
        if (!report.first_response_at) {
          updateData.first_response_at = new Date().toISOString()
        }

        await supabase.from('reports').update(updateData).eq('id', id)

        // Registrar en historial
        await supabase.from('report_status_history').insert({
          report_id: id,
          from_status: previousStatus,
          to_status: 'asignado',
          changed_by_type: 'admin',
          changed_by_id: admin.id,
          notes: note || null,
        })

        // Crear nota interna si hay
        if (note) {
          await supabase.from('report_internal_notes').insert({
            report_id: id,
            admin_user_id: admin.id,
            note,
          })
        }

        // Registrar asignación
        await supabase.from('report_assignments').insert({
          report_id: id,
          area_id: areaId,
          assigned_to: assigneeId,
          assigned_by: admin.id,
          notes: note || null,
        })

        return NextResponse.json({ success: true, message: 'Reporte asignado' })
      }

      case 'change_status': {
        const { status, note } = data

        const statusToCitizenStatus: Record<string, string> = {
          nuevo: 'recibido',
          sin_asignar: 'recibido',
          asignado: 'en_proceso',
          programado: 'en_proceso',
          en_campo: 'en_proceso',
          esperando_material: 'en_proceso',
          en_revision: 'en_proceso',
          resuelto: 'resuelto',
          no_procede: 'no_procede',
          reabierto: 'en_proceso',
        }

        await supabase.from('reports').update({
          internal_status: status,
          citizen_status: statusToCitizenStatus[status] || 'en_proceso',
        }).eq('id', id)

        await supabase.from('report_status_history').insert({
          report_id: id,
          from_status: previousStatus,
          to_status: status,
          changed_by_type: 'admin',
          changed_by_id: admin.id,
          notes: note || null,
        })

        return NextResponse.json({ success: true, message: 'Estado actualizado' })
      }

      case 'resolve': {
        const { resolutionType, description, photoUrls } = data

        if (!resolutionType || !description) {
          return NextResponse.json({ error: 'Faltan datos de resolución' }, { status: 400 })
        }

        const citizenStatus = resolutionType === 'resolved' ? 'resuelto' : 'no_procede'
        const internalStatus = resolutionType === 'resolved' ? 'resuelto' : 'no_procede'

        await supabase.from('reports').update({
          internal_status: internalStatus,
          citizen_status: citizenStatus,
          resolved_at: new Date().toISOString(),
          resolved_by: admin.id,
        }).eq('id', id)

        // Crear registro de resolución
        const { data: resolution } = await supabase.from('report_resolutions').insert({
          report_id: id,
          resolution_type: resolutionType,
          description,
          resolved_by: admin.id,
        }).select().single()

        // Guardar fotos de resolución
        if (photoUrls && photoUrls.length > 0 && resolution) {
          const photoRecords = photoUrls.map((url: string) => ({
            resolution_id: resolution.id,
            url,
          }))
          await supabase.from('resolution_photos').insert(photoRecords)
        }

        // Historial
        await supabase.from('report_status_history').insert({
          report_id: id,
          from_status: previousStatus,
          to_status: internalStatus,
          changed_by_type: 'admin',
          changed_by_id: admin.id,
          notes: description,
        })

        // TODO: Enviar notificación al ciudadano

        return NextResponse.json({ success: true, message: 'Reporte resuelto' })
      }

      case 'add_note': {
        const { note } = data
        if (!note) {
          return NextResponse.json({ error: 'Se requiere nota' }, { status: 400 })
        }

        await supabase.from('report_internal_notes').insert({
          report_id: id,
          admin_user_id: admin.id,
          note,
        })

        return NextResponse.json({ success: true, message: 'Nota agregada' })
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Panel Report PATCH Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
