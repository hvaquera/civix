import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface INEData {
  // Datos personales
  clave_elector: string | null
  curp: string | null
  nombre: string | null
  apellido_paterno: string | null
  apellido_materno: string | null
  fecha_nacimiento: string | null
  sexo: 'M' | 'F' | null
  
  // Domicilio
  calle: string | null
  numero_exterior: string | null
  numero_interior: string | null
  colonia: string | null
  codigo_postal: string | null
  municipio: string | null
  estado: string | null
  
  // Datos electorales
  seccion: string | null
  vigencia: string | null
  año_registro: string | null
  
  // Confianza por campo
  confidence: Record<string, number>
}

const SYSTEM_PROMPT = `Eres un experto en extracción de datos de credenciales INE (Instituto Nacional Electoral) de México.

Tu tarea es extraer TODOS los datos visibles de las imágenes de INE que te proporcionen.

ESTRUCTURA DE LA INE MEXICANA:
- FRENTE: Tiene la foto del ciudadano. Arriba dice "INSTITUTO NACIONAL ELECTORAL" y "CREDENCIAL PARA VOTAR". 
  Contiene: nombre completo (en una o dos líneas), domicilio, clave de elector, CURP, fecha de nacimiento, sexo, sección, vigencia.
  El NOMBRE aparece después de "NOMBRE" y está en MAYÚSCULAS.
  El DOMICILIO aparece después de "DOMICILIO" y contiene: calle, número, colonia, código postal, municipio y estado.

- REVERSO: Contiene el código de barras, la firma, y datos adicionales.

REGLAS CRÍTICAS:
1. El NOMBRE siempre está separado de los APELLIDOS. En INEs modernas:
   - Primera línea después de "NOMBRE": APELLIDO PATERNO y APELLIDO MATERNO
   - Segunda línea: NOMBRE(S)
   
2. El DOMICILIO sigue este formato típico:
   - "C [nombre de calle] [número]" o "AV [nombre] [número]" = calle y número
   - La COLONIA aparece después, usualmente precedida por "COL" o sola
   - El CP es un número de 5 dígitos
   - El MUNICIPIO y ESTADO aparecen al final

3. Si dice "DOMICILIO CONOCIDO" significa que no hay calle/número específico (zona rural).

4. La SECCIÓN ELECTORAL es un número de 4 dígitos que aparece en el frente.

5. Extrae exactamente lo que ves, sin inventar datos.
6. Si un campo no es legible o no está presente, devuelve null.
7. Los nombres van en MAYÚSCULAS tal como aparecen.

Responde ÚNICAMENTE con un objeto JSON válido, sin explicaciones adicionales ni markdown.`

const EXTRACTION_PROMPT = `Analiza esta(s) imagen(es) de INE mexicana y extrae todos los datos visibles.

INSTRUCCIONES:
1. Identifica primero si es el FRENTE o REVERSO de la INE
2. Extrae los datos en el orden en que aparecen
3. Para el NOMBRE: separa claramente nombre(s) de apellidos
4. Para el DOMICILIO: identifica cada componente (calle, número, colonia, CP, municipio, estado)

Devuelve un JSON con esta estructura exacta:
{
  "clave_elector": "string de 18 caracteres o null",
  "curp": "string de 18 caracteres o null",
  "nombre": "solo el/los nombre(s) de pila, sin apellidos",
  "apellido_paterno": "primer apellido",
  "apellido_materno": "segundo apellido",
  "fecha_nacimiento": "YYYY-MM-DD o null",
  "sexo": "M o F o null",
  "calle": "nombre de la calle SIN número (ej: 'AV CONSTITUCION', 'C MORELOS')",
  "numero_exterior": "número de casa/edificio",
  "numero_interior": "depto/interior si existe, o null",
  "colonia": "nombre de la colonia SIN el prefijo 'COL'",
  "codigo_postal": "5 dígitos",
  "municipio": "nombre del municipio",
  "estado": "nombre del estado (ej: 'NUEVO LEON', 'JALISCO')",
  "seccion": "número de 4 dígitos de la sección electoral",
  "vigencia": "año de vigencia",
  "año_registro": "año en que se registró",
  "confidence": {
    "nombre": 0.0-1.0,
    "domicilio": 0.0-1.0,
    "seccion": 0.0-1.0
  }
}

IMPORTANTE: Si ves "DOMICILIO CONOCIDO" en lugar de calle y número, pon eso en "calle" y deja "numero_exterior" como null.

Solo devuelve el JSON, nada más.`

export async function POST(request: NextRequest) {
  console.log('[OCR API] Recibida petición de OCR INE')
  
  try {
    const body = await request.json()
    const { frontImage, backImage } = body

    console.log('[OCR API] Imágenes recibidas:', {
      front: frontImage ? `${(frontImage.length / 1024).toFixed(0)}KB` : 'no',
      back: backImage ? `${(backImage.length / 1024).toFixed(0)}KB` : 'no'
    })

    if (!frontImage) {
      console.log('[OCR API] Error: No se recibió imagen frontal')
      return NextResponse.json(
        { error: 'Se requiere al menos la imagen frontal de la INE' },
        { status: 400 }
      )
    }

    // Preparar imágenes para Claude
    const images: Anthropic.ImageBlockParam[] = []

    // Procesar imagen frontal
    const frontBase64 = frontImage.replace(/^data:image\/\w+;base64,/, '')
    images.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: frontBase64,
      },
    })

    // Procesar imagen trasera si existe
    if (backImage) {
      const backBase64 = backImage.replace(/^data:image\/\w+;base64,/, '')
      images.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: backBase64,
        },
      })
    }

    console.log('[OCR API] Llamando a Claude Vision...')

    // Llamar a Claude Vision
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...images,
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    })

    console.log('[OCR API] Respuesta de Claude recibida')

    // Extraer el texto de la respuesta
    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No se recibió respuesta de texto')
    }

    // Parsear JSON
    let ineData: INEData
    try {
      // Limpiar posibles caracteres extra
      const cleanJson = textContent.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      ineData = JSON.parse(cleanJson)
      console.log('[OCR API] Datos extraídos:', {
        nombre: ineData.nombre,
        municipio: ineData.municipio,
        seccion: ineData.seccion
      })
    } catch (parseError) {
      console.error('[OCR API] Error parsing OCR response:', textContent.text)
      throw new Error('No se pudo procesar la respuesta del OCR')
    }

    // Validar que el municipio sea del área de servicio (Monterrey)
    const validMunicipios = ['MONTERREY', 'GUADALUPE', 'SAN NICOLÁS DE LOS GARZA', 'APODACA', 'SANTA CATARINA', 'SAN PEDRO GARZA GARCÍA', 'GENERAL ESCOBEDO']
    const municipioNormalizado = ineData.municipio?.toUpperCase().trim() || ''
    const isValidMunicipio = validMunicipios.some(m => 
      municipioNormalizado.includes(m) || m.includes(municipioNormalizado)
    )

    console.log('[OCR API] ✅ OCR completado exitosamente')

    return NextResponse.json({
      success: true,
      data: ineData,
      validation: {
        isValidMunicipio,
        municipio: ineData.municipio,
        estado: ineData.estado,
      },
    })
  } catch (error) {
    console.error('[OCR API] ❌ Error:', error)
    return NextResponse.json(
      { 
        error: 'Error procesando la INE',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
