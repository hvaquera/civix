import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Geocode address and auto-assign to nearest cluster
export async function POST(request: NextRequest) {
  try {
    const { contact_id, street, colonia, municipio, estado, cp } = await request.json()

    if (!contact_id || !street) {
      return NextResponse.json({ error: 'contact_id y street requeridos' }, { status: 400 })
    }

    // 1. Geocode the address with Mapbox
    const address = `${street}, ${colonia || ''}, ${municipio || 'Monterrey'}, ${estado || 'Nuevo León'}, ${cp || ''}, Mexico`
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    
    let lat: number | null = null
    let lng: number | null = null

    if (mapboxToken) {
      const geoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&country=MX&limit=1`
      const geoRes = await fetch(geoUrl)
      
      if (geoRes.ok) {
        const geoData = await geoRes.json()
        if (geoData.features?.length > 0) {
          const [longitude, latitude] = geoData.features[0].center
          lat = latitude
          lng = longitude
        }
      }
    }

    if (!lat || !lng) {
      // Update contact without geocoding
      return NextResponse.json({ 
        geocoded: false, 
        assigned: false,
        message: 'No se pudo geocodificar la dirección. El contacto se guardó sin coordenadas.' 
      })
    }

    // 2. Get the contact's section
    const { data: contact } = await supabase
      .from('political_contacts')
      .select('section_id')
      .eq('id', contact_id)
      .single()

    if (!contact?.section_id) {
      return NextResponse.json({ 
        geocoded: true, 
        assigned: false,
        message: 'Contacto sin sección electoral asignada.' 
      })
    }

    // 3. Find nearest active cluster
    // Using simple distance calculation (good enough for city-level)
    const { data: clusters } = await supabase
      .from('territorial_clusters')
      .select('id, cluster_name, centroid_lat, centroid_lng, radius_meters, assigned_manzanero_id')
      .eq('section_id', contact.section_id)
      .in('status', ['approved', 'active'])

    let bestCluster: any = null
    let bestDistance = Infinity

    for (const cluster of clusters || []) {
      // Haversine-lite: approximate distance in meters
      const dLat = (cluster.centroid_lat - lat) * 111320
      const dLng = (cluster.centroid_lng - lng) * 111320 * Math.cos(lat * Math.PI / 180)
      const dist = Math.sqrt(dLat * dLat + dLng * dLng)
      
      if (dist < (cluster.radius_meters + 200) && dist < bestDistance) {
        bestDistance = dist
        bestCluster = cluster
      }
    }

    // 4. Update the contact
    const updateData: any = {
      latitude: lat,
      longitude: lng,
      geocoded_at: new Date().toISOString(),
    }

    if (bestCluster) {
      updateData.cluster_id = bestCluster.id
    }

    await supabase
      .from('political_contacts')
      .update(updateData)
      .eq('id', contact_id)

    // 5. Get the manzanero info if cluster has one
    let manzanero = null
    if (bestCluster?.assigned_manzanero_id) {
      const { data: manz } = await supabase
        .from('political_operators')
        .select('id, name, phone')
        .eq('id', bestCluster.assigned_manzanero_id)
        .single()
      manzanero = manz
    }

    return NextResponse.json({
      geocoded: true,
      latitude: lat,
      longitude: lng,
      assigned: !!bestCluster,
      cluster: bestCluster ? {
        id: bestCluster.id,
        name: bestCluster.cluster_name,
        distance_meters: Math.round(bestDistance),
      } : null,
      manzanero,
      message: bestCluster 
        ? `Asignado a ${bestCluster.cluster_name} (${Math.round(bestDistance)}m del centro)`
        : 'Geocodificado pero sin cluster cercano. Quedará como contacto disperso.',
    })

  } catch (err: any) {
    console.error('Auto-assign error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
