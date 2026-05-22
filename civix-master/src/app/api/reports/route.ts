import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Obtener ciudadano de la sesión
async function getCitizenFromSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('citizen_session')?.value

  if (!sessionToken) return null

  const { data: session } = await supabase
    .from('citizen_sessions')
    .select('citizen_id, citizens(*)')
    .eq('token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single()

  return session?.citizens || null
}

// GET: Listar reportes del ciudadano
export async function GET(request: NextRequest) {
  try {
    const citizen = await getCitizenFromSession()
    
    if (!citizen) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('reports')
      .select(`
        *,
        report_categories(name, icon),
        report_photos(url, is_primary)
      `, { count: 'exact' })
      .eq('citizen_id', citizen.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status && status !== 'all') {
      query = query.eq('citizen_status', status)
    }

    const { data: reports, error, count } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json(
        { error: 'Error obteniendo reportes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Reports GET Error:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}

// POST: Crear nuevo reporte
export async function POST(request: NextRequest) {
  try {
    const citizen = await getCitizenFromSession()
    
    if (!citizen) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!citizen.ine_verified) {
      return NextResponse.json(
        { error: 'Debes verificar tu INE para crear reportes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      categoryId, 
      description, 
      audioTranscription,
      latitude, 
      longitude, 
      address,
      colonia,
      reference,
      photos // Array de URLs de fotos ya subidas
    } = body

    // Validaciones
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Se requiere una categoría' },
        { status: 400 }
      )
    }

    if (!description && !audioTranscription) {
      return NextResponse.json(
        { error: 'Se requiere una descripción o audio' },
        { status: 400 }
      )
    }

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Se requiere ubicación' },
        { status: 400 }
      )
    }

    // Obtener configuración del municipio para SLA
    const { data: slaPolicy } = await supabase
      .from('sla_policies')
      .select('*')
      .eq('municipality_id', citizen.municipality_id)
      .eq('category_id', categoryId)
      .single()

    // SLA por defecto si no hay específico
    const defaultSla = {
      first_response_hours: 24,
      resolution_hours: 48,
    }
    const sla = slaPolicy || defaultSla

    // Calcular deadlines
    const now = new Date()
    const firstResponseDeadline = new Date(now.getTime() + sla.first_response_hours * 60 * 60 * 1000)
    const resolutionDeadline = new Date(now.getTime() + sla.resolution_hours * 60 * 60 * 1000)

    // Generar folio
    const { data: folioData } = await supabase
      .rpc('generate_folio', { p_municipality_id: citizen.municipality_id })

    const folio = folioData || `CIV-${Date.now()}`

    // Crear reporte
    const { data: report, error: createError } = await supabase
      .from('reports')
      .insert({
        folio,
        citizen_id: citizen.id,
        municipality_id: citizen.municipality_id,
        category_id: categoryId,
        description: description || audioTranscription || '',
        audio_transcription: audioTranscription || null,
        latitude,
        longitude,
        address,
        colonia: colonia || citizen.colonia,
        reference,
        internal_status: 'nuevo',
        citizen_status: 'recibido',
        priority: 'media', // Por defecto, puede ajustarse con IA
        first_response_deadline: firstResponseDeadline.toISOString(),
        resolution_deadline: resolutionDeadline.toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating report:', createError)
      return NextResponse.json(
        { error: 'Error creando reporte' },
        { status: 500 }
      )
    }

    // Guardar fotos
    if (photos && photos.length > 0) {
      const photoRecords = photos.map((url: string, index: number) => ({
        report_id: report.id,
        url,
        is_primary: index === 0,
      }))

      await supabase.from('report_photos').insert(photoRecords)
    }

    // Crear entrada en historial
    await supabase.from('report_status_history').insert({
      report_id: report.id,
      from_status: null,
      to_status: 'nuevo',
      changed_by_type: 'system',
      notes: 'Reporte creado',
    })

    // TODO: Disparar notificación al área correspondiente
    // TODO: Verificar si hay reportes similares para agrupar

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        folio: report.folio,
        status: 'recibido',
        createdAt: report.created_at,
      },
    })
  } catch (error) {
    console.error('Reports POST Error:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
