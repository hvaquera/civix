import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Calcular distancia en metros entre dos puntos (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Agrupar reportes por proximidad
function clusterReports(reports: any[], maxDistance: number = 200): any[][] {
  const clusters: any[][] = []
  const used = new Set<string>()

  for (const report of reports) {
    if (used.has(report.id)) continue

    const cluster = [report]
    used.add(report.id)

    for (const other of reports) {
      if (used.has(other.id)) continue
      if (report.category_id !== other.category_id) continue

      const distance = calculateDistance(
        report.latitude, report.longitude,
        other.latitude, other.longitude
      )

      if (distance <= maxDistance) {
        cluster.push(other)
        used.add(other.id)
      }
    }

    if (cluster.length >= 2) {
      clusters.push(cluster)
    }
  }

  return clusters
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const municipalityId = searchParams.get('municipalityId')

    if (!municipalityId) {
      return NextResponse.json({ error: 'Se requiere municipalityId' }, { status: 400 })
    }

    // Obtener reportes activos no agrupados de los últimos 30 días
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        id, folio, category_id, latitude, longitude, 
        address, colonia, description, created_at,
        report_categories(name)
      `)
      .eq('municipality_id', municipalityId)
      .is('grouped_issue_id', null)
      .in('internal_status', ['nuevo', 'sin_asignar', 'asignado'])
      .gte('created_at', thirtyDaysAgo)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json({ error: 'Error obteniendo reportes' }, { status: 500 })
    }

    if (!reports || reports.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Agrupar por proximidad geográfica
    const clusters = clusterReports(reports)

    // Generar sugerencias
    const suggestions = clusters.map((cluster) => {
      // Calcular centro del cluster
      const avgLat = cluster.reduce((sum, r) => sum + r.latitude, 0) / cluster.length
      const avgLng = cluster.reduce((sum, r) => sum + r.longitude, 0) / cluster.length

      // Calcular radio aproximado
      let maxDistance = 0
      for (const report of cluster) {
        const dist = calculateDistance(avgLat, avgLng, report.latitude, report.longitude)
        if (dist > maxDistance) maxDistance = dist
      }

      // Obtener colonia más común
      const colonias = cluster.map(r => r.colonia).filter(Boolean)
      const coloniaCount: Record<string, number> = {}
      colonias.forEach(c => { coloniaCount[c] = (coloniaCount[c] || 0) + 1 })
      const mainColonia = Object.entries(coloniaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin colonia'

      return {
        id: `suggestion-${cluster[0].id}`,
        category: cluster[0].report_categories?.name || 'Sin categoría',
        categoryId: cluster[0].category_id,
        colonia: mainColonia,
        reportsCount: cluster.length,
        radiusMeters: Math.round(maxDistance),
        centerLat: avgLat,
        centerLng: avgLng,
        reportIds: cluster.map(r => r.id),
        folios: cluster.map(r => r.folio),
        confidence: cluster.length >= 3 ? 'high' : 'medium',
      }
    })

    // Ordenar por cantidad de reportes (mayor primero)
    suggestions.sort((a, b) => b.reportsCount - a.reportsCount)

    return NextResponse.json({
      suggestions: suggestions.slice(0, 10), // Top 10 sugerencias
      totalClusters: suggestions.length,
    })
  } catch (error) {
    console.error('Grouping Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST: Crear issue agrupado desde sugerencia
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportIds, title, municipalityId, areaId, assigneeId } = body

    if (!reportIds || reportIds.length < 2) {
      return NextResponse.json(
        { error: 'Se requieren al menos 2 reportes' },
        { status: 400 }
      )
    }

    // Verificar que los reportes existen y no están agrupados
    const { data: reports, error: fetchError } = await supabase
      .from('reports')
      .select('id, folio, category_id, colonia, latitude, longitude')
      .in('id', reportIds)
      .is('grouped_issue_id', null)

    if (fetchError || !reports || reports.length !== reportIds.length) {
      return NextResponse.json(
        { error: 'Algunos reportes no existen o ya están agrupados' },
        { status: 400 }
      )
    }

    // Calcular centro
    const avgLat = reports.reduce((sum, r) => sum + r.latitude, 0) / reports.length
    const avgLng = reports.reduce((sum, r) => sum + r.longitude, 0) / reports.length

    // Crear issue agrupado
    const { data: issue, error: createError } = await supabase
      .from('grouped_issues')
      .insert({
        title: title || `Issue agrupado - ${reports[0].colonia}`,
        municipality_id: municipalityId,
        category_id: reports[0].category_id,
        status: 'nuevo',
        priority: 'media',
        center_latitude: avgLat,
        center_longitude: avgLng,
        area_id: areaId || null,
        assignee_id: assigneeId || null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating issue:', createError)
      return NextResponse.json({ error: 'Error creando issue' }, { status: 500 })
    }

    // Actualizar reportes con el issue_id
    await supabase
      .from('reports')
      .update({ grouped_issue_id: issue.id })
      .in('id', reportIds)

    // Crear registros de membresía
    const memberRecords = reportIds.map((reportId: string) => ({
      grouped_issue_id: issue.id,
      report_id: reportId,
    }))
    await supabase.from('grouped_issue_members').insert(memberRecords)

    return NextResponse.json({
      success: true,
      issue: {
        id: issue.id,
        title: issue.title,
        reportsCount: reportIds.length,
      },
    })
  } catch (error) {
    console.error('Create Issue Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
