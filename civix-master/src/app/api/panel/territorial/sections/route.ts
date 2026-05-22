import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no configurado', features: [] }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');

    // Get sections with geometry
    const { data, error } = await supabase.rpc('get_sections_geojson', {
      district_filter: district ? parseInt(district) : null
    });

    if (error) {
      console.error('Error calling get_sections_geojson:', error);
      throw error;
    }

    // Get REAL demographic data from electoral_sections
    const { data: sectionData } = await supabase
      .from('electoral_sections')
      .select('section_number, lista_nominal, padron_electoral, estimated_houses')
      .gt('lista_nominal', 0);

    // Index by section number for fast lookup
    const demoBySection: Record<number, { ln: number; padron: number; houses: number }> = {};
    (sectionData || []).forEach((s: any) => {
      demoBySection[s.section_number] = {
        ln: s.lista_nominal || 0,
        padron: s.padron_electoral || 0,
        houses: s.estimated_houses || 0,
      };
    });

    // Get real contact counts per section
    const { data: contactCounts } = await supabase
      .from('political_contacts')
      .select('section_id, ine_section')
      .eq('status', 'active');

    const contactsBySection: Record<number, number> = {};
    (contactCounts || []).forEach((c: any) => {
      const sec = c.ine_section;
      if (sec) contactsBySection[sec] = (contactsBySection[sec] || 0) + 1;
    });

    // Build GeoJSON with REAL data
    const geojson = {
      type: 'FeatureCollection',
      features: (data || []).map((row: any) => {
        const sectionNum = row.section_number;
        const contacts = contactsBySection[sectionNum] || 0;
        const demo = demoBySection[sectionNum] || { ln: 0, padron: 0, houses: 0 };
        const houses = demo.houses;
        const coverage = houses > 0 ? Math.min(Math.round((contacts / houses) * 100), 100) : 0;

        return {
          type: 'Feature',
          properties: {
            id: row.id,
            section_number: sectionNum,
            district_number: row.district_number,
            district_name: row.district_name,
            lista_nominal: demo.ln,
            padron_electoral: demo.padron,
            total_supporters: contacts,
            total_operators: 0,
            coverage_pct: coverage,
            estimated_houses: houses,
            total_contacts: contacts,
          },
          geometry: row.geometry,
        };
      }),
    };

    console.log(`[API Territorial] ${geojson.features.length} sections, ${Object.keys(demoBySection).length} with real LN data, ${Object.keys(contactsBySection).length} with contacts`);
    return NextResponse.json(geojson);

  } catch (error) {
    console.error('Error fetching territorial data:', error);
    return NextResponse.json({ error: 'Error al obtener datos territoriales', features: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 });
    }

    const { lat, lng } = await request.json();
    if (!lat || !lng) {
      return NextResponse.json({ error: 'Se requieren lat y lng' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('get_section_by_location', {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    });

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No se encontró sección' }, { status: 404 });
    }

    return NextResponse.json({
      section_id: data[0].section_id,
      section_number: data[0].section_number,
      district_number: data[0].district_number,
    });
  } catch (error) {
    console.error('Error finding section by location:', error);
    return NextResponse.json({ error: 'Error al buscar sección' }, { status: 500 });
  }
}
