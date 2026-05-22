import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Obtener ciudadano de la sesión
async function getCitizenFromSession(): Promise<string | null> {
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

export async function POST(request: NextRequest) {
  try {
    const citizenId = await getCitizenFromSession()
    
    if (!citizenId) {
      return NextResponse.json(
        { error: 'Sesión inválida. Verifica tu contacto primero.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ineData, acceptedTerms } = body

    if (!ineData || !acceptedTerms) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    // Validar que el municipio sea válido
    const validMunicipios = ['MONTERREY', 'GUADALUPE', 'SAN NICOLÁS', 'APODACA', 'SANTA CATARINA', 'SAN PEDRO', 'ESCOBEDO']
    const municipioNormalizado = (ineData.municipio || '').toUpperCase()
    const isValidMunicipio = validMunicipios.some(m => municipioNormalizado.includes(m))

    if (!isValidMunicipio) {
      return NextResponse.json(
        { error: 'Tu domicilio no está dentro del área de servicio.' },
        { status: 400 }
      )
    }

    // Buscar municipio en DB
    const { data: municipality } = await supabase
      .from('municipalities')
      .select('id')
      .ilike('name', `%${ineData.municipio}%`)
      .limit(1)
      .single()

    // Actualizar ciudadano con datos de INE
    const { data: citizen, error: updateError } = await supabase
      .from('citizens')
      .update({
        // Datos personales
        nombre: ineData.nombre,
        apellido_paterno: ineData.apellido_paterno,
        apellido_materno: ineData.apellido_materno,
        curp: ineData.curp,
        fecha_nacimiento: ineData.fecha_nacimiento,
        sexo: ineData.sexo,
        
        // Domicilio
        calle: ineData.calle,
        numero_exterior: ineData.numero_exterior,
        numero_interior: ineData.numero_interior,
        colonia: ineData.colonia,
        codigo_postal: ineData.codigo_postal,
        municipio: ineData.municipio,
        estado: ineData.estado,
        
        // Datos electorales
        clave_elector: ineData.clave_elector,
        seccion_electoral: ineData.seccion,
        
        // Metadata
        ine_verified: true,
        ine_verified_at: new Date().toISOString(),
        status: 'active',
        municipality_id: municipality?.id || null,
        terms_accepted_at: new Date().toISOString(),
      })
      .eq('id', citizenId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating citizen:', updateError)
      return NextResponse.json(
        { error: 'Error guardando datos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      citizen: {
        id: citizen.id,
        name: `${citizen.nombre} ${citizen.apellido_paterno}`,
        colonia: citizen.colonia,
        municipio: citizen.municipio,
        verified: true,
      },
    })
  } catch (error) {
    console.error('Registration Error:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
