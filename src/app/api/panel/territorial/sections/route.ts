import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Crear cliente solo si tenemos las credenciales
const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no configurado', features: [] },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');

    // Usar la función PostGIS que creamos
    const { data, error } = await supabase.rpc('get_sections_geojson', {
      district_filter: district ? parseInt(district) : null
    });

    if (error) {
      console.error('Error calling get_sections_geojson:', error);
      throw error;
    }

    // Convertir a GeoJSON FeatureCollection
    const geojson = {
      type: 'FeatureCollection',
      features: (data || []).map((row: any) => ({
        type: 'Feature',
        properties: {
          id: row.id,
          section_number: row.section_number,
          district_number: row.district_number,
          district_name: row.district_name,
          total_supporters: Math.floor(Math.random() * 300), // Mock por ahora
          total_operators: Math.floor(Math.random() * 15),
          coverage_pct: Math.floor(Math.random() * 100),
        },
        geometry: row.geometry,
      })),
    };

    console.log(`[API] Returning ${geojson.features.length} sections`);
    return NextResponse.json(geojson);

  } catch (error) {
    console.error('Error fetching territorial data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos territoriales', features: [] },
      { status: 200 }
    );
  }
}

// Get section by GPS coordinates
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no configurado' },
        { status: 500 }
      );
    }

    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Se requieren lat y lng' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('get_section_by_location', {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró sección en esa ubicación' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      section_id: data[0].section_id,
      section_number: data[0].section_number,
      district_number: data[0].district_number,
    });

  } catch (error) {
    console.error('Error finding section by location:', error);
    return NextResponse.json(
      { error: 'Error al buscar sección' },
      { status: 500 }
    );
  }
}
