import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { section_id, section_number } = await request.json()

    if (!section_id) {
      return NextResponse.json({ error: 'section_id requerido' }, { status: 400 })
    }

    const { data: contacts, error } = await supabase
      .from('political_contacts')
      .select('id, name, paternal_surname, maternal_surname, street, colonia_text, latitude, longitude, support_level, issues_of_interest, specific_requests')
      .eq('section_id', section_id)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .eq('status', 'active')

    if (error) throw error

    if (!contacts || contacts.length < 3) {
      return NextResponse.json({ 
        clusters: [], saved_clusters: [],
        message: `Solo ${contacts?.length || 0} contactos geocodificados. Se necesitan al menos 3.`
      })
    }

    const contactsForAI = contacts.map(c => ({
      id: c.id,
      name: `${c.name} ${c.paternal_surname}`,
      street: c.street,
      colonia: c.colonia_text,
      lat: c.latitude,
      lng: c.longitude,
      support: c.support_level,
      issues: c.issues_of_interest,
      request: c.specific_requests,
    }))

    const prompt = `Eres un analista geoespacial electoral experto en México. Analiza estos ${contacts.length} contactos de la sección electoral ${section_number || '?'} y agrúpalos en clusters territoriales operativos.

CONTACTOS:
${JSON.stringify(contactsForAI, null, 2)}

REGLAS DE CLUSTERING:
1. Agrupa por proximidad geográfica (lat/lng). Contactos a menos de 200-300 metros entre sí pertenecen al mismo cluster.
2. Un cluster debe tener al menos 3 contactos para ser viable.
3. Si hay contactos dispersos que no forman cluster, agrúpalos como "dispersos" con una nota.
4. Para cada cluster, identifica la calle o zona predominante y dale un nombre descriptivo.
5. Analiza las peticiones del cluster e identifica el tema principal.
6. Evalúa la densidad de simpatizantes vs indecisos.

Responde SOLO en JSON puro sin markdown:
{
  "clusters": [
    {
      "name": "nombre descriptivo de la zona",
      "centroid_lat": promedio de latitudes,
      "centroid_lng": promedio de longitudes,
      "radius_meters": radio estimado,
      "contact_ids": ["id1", "id2"],
      "contacts_count": número,
      "streets": ["calles principales"],
      "dominant_issue": "tema más frecuente",
      "support_breakdown": { "hard": N, "soft": N, "undecided": N },
      "confidence": 0.0 a 1.0,
      "recommendation": "recomendación operativa breve"
    }
  ],
  "scattered_contacts": ["ids sin cluster"],
  "section_summary": "resumen 2-3 oraciones",
  "recommended_manzaneros": "número recomendado"
}`

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeResponse.ok) {
      const err = await claudeResponse.text()
      throw new Error(`Claude API error: ${err}`)
    }

    const claudeData = await claudeResponse.json()
    const responseText = claudeData.content[0]?.text || ''
    const cleanJson = responseText.replace(/```json|```/g, '').trim()
    const analysis = JSON.parse(cleanJson)

    // Save clusters to DB and return their IDs
    const savedClusters = []
    for (let i = 0; i < analysis.clusters.length; i++) {
      const c = analysis.clusters[i]
      const clusterKey = `SEC${section_number}-C${String(i + 1).padStart(2, '0')}`

      const { data: saved, error: saveErr } = await supabase
        .from('territorial_clusters')
        .upsert({
          cluster_name: c.name,
          cluster_key: clusterKey,
          section_id,
          municipality_id: 'a0000000-0000-0000-0000-000000000001',
          centroid_lat: c.centroid_lat,
          centroid_lng: c.centroid_lng,
          radius_meters: c.radius_meters || 200,
          contacts_count: c.contacts_count,
          ai_confidence: c.confidence,
          ai_suggested_at: new Date().toISOString(),
          ai_model: 'claude-sonnet-4-20250514',
          status: 'suggested',
        }, { onConflict: 'section_id,cluster_key' })
        .select()
        .single()

      if (saved) {
        if (c.contact_ids?.length) {
          await supabase
            .from('political_contacts')
            .update({ cluster_id: saved.id })
            .in('id', c.contact_ids)
        }
        // Fetch real coordinates for this cluster's contacts
        let realContacts: any[] = []
        if (c.contact_ids?.length) {
          const { data: coords } = await supabase
            .from('political_contacts')
            .select('id, name, paternal_surname, latitude, longitude, support_level')
            .in('id', c.contact_ids)
          realContacts = (coords || []).map(ct => ({
            lat: ct.latitude,
            lng: ct.longitude,
            support: ct.support_level,
            name: `${ct.name} ${ct.paternal_surname || ''}`.trim(),
          }))
        }
        // Merge DB record with AI analysis data + real contacts
        savedClusters.push({
          db_id: saved.id,
          cluster_key: saved.cluster_key,
          status: saved.status,
          ...c,
          contacts: realContacts,
        })
      }
    }

    return NextResponse.json({
      clusters: savedClusters, // Now includes db_id
      scattered_contacts: analysis.scattered_contacts,
      section_summary: analysis.section_summary,
      recommended_manzaneros: analysis.recommended_manzaneros,
      saved_count: savedClusters.length,
      total_contacts: contacts.length,
    })

  } catch (err: any) {
    console.error('Clustering error:', err)
    return NextResponse.json({ error: err.message || 'Error en clustering' }, { status: 500 })
  }
}

// GET: Retrieve existing clusters for a section
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sectionId = searchParams.get('section_id')

  if (!sectionId) {
    return NextResponse.json({ error: 'section_id requerido' }, { status: 400 })
  }

  const { data: clusters, error } = await supabase
    .from('territorial_clusters')
    .select('*')
    .eq('section_id', sectionId)
    .neq('status', 'dissolved')
    .order('cluster_key')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  for (const cluster of clusters || []) {
    const { data: contacts } = await supabase
      .from('political_contacts')
      .select('id, name, paternal_surname, latitude, longitude, support_level')
      .eq('cluster_id', cluster.id)
    cluster.contacts = contacts || []
  }

  const { data: unassigned } = await supabase
    .from('political_contacts')
    .select('id, name, paternal_surname, latitude, longitude, support_level')
    .eq('section_id', sectionId)
    .is('cluster_id', null)
    .not('latitude', 'is', null)

  return NextResponse.json({
    clusters: clusters || [],
    unassigned: unassigned || [],
  })
}

// PATCH: Approve cluster or assign manzanero
export async function PATCH(request: NextRequest) {
  try {
    const { cluster_id, action, operator_id } = await request.json()

    if (!cluster_id || !action) {
      return NextResponse.json({ error: 'cluster_id y action requeridos' }, { status: 400 })
    }

    if (action === 'approve') {
      const { data, error } = await supabase
        .from('territorial_clusters')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', cluster_id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, cluster: data })
    }

    if (action === 'assign') {
      if (!operator_id) {
        return NextResponse.json({ error: 'operator_id requerido para asignar' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('territorial_clusters')
        .update({ 
          assigned_manzanero_id: operator_id,
          assigned_at: new Date().toISOString(),
          status: 'active',
        })
        .eq('id', cluster_id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, cluster: data })
    }

    return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 })

  } catch (err: any) {
    console.error('Cluster action error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
