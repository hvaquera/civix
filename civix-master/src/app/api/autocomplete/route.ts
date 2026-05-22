import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || ''

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'street' | 'colonia'
  const query = searchParams.get('q') || ''

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    if (type === 'colonia') {
      // Search colonias from Supabase
      const { data, error } = await supabase
        .from('colonias')
        .select('id, name, postal_code')
        .eq('municipality_id', 'a0000000-0000-0000-0000-000000000001')
        .ilike('name', `%${query}%`)
        .limit(8)

      if (error) throw error

      return NextResponse.json({
        results: (data || []).map(c => ({
          value: c.name,
          label: c.name,
          cp: c.postal_code,
          id: c.id,
        })),
      })
    }

    if (type === 'street' && MAPBOX_TOKEN) {
      // Use Mapbox Geocoding for street suggestions
      const bbox = '-100.45,25.55,-100.20,25.80' // Monterrey metro area
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&bbox=${bbox}&types=address&limit=5&language=es`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Mapbox error')
      const data = await res.json()

      return NextResponse.json({
        results: (data.features || []).map((f: any) => ({
          value: f.place_name_es || f.place_name || '',
          label: f.text_es || f.text || '',
          context: f.context?.map((c: any) => c.text).join(', ') || '',
        })),
      })
    }

    // Fallback - no results
    return NextResponse.json({ results: [] })
  } catch (err: any) {
    console.error('[Autocomplete] Error:', err)
    return NextResponse.json({ results: [] })
  }
}
