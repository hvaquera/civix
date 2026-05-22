import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SYSTEM_PROMPT = `Eres un experto en extracción de datos de credenciales INE (Instituto Nacional Electoral) de México.

PRIMERA TAREA — VALIDACIÓN:
Antes de extraer datos, VERIFICA que la imagen sea realmente una credencial INE/IFE mexicana. 
Indicadores de INE válida:
- Texto "INSTITUTO NACIONAL ELECTORAL" o "INSTITUTO FEDERAL ELECTORAL"
- Texto "CREDENCIAL PARA VOTAR"
- Escudo nacional mexicano
- Formato de tarjeta con foto, nombre, domicilio, sección electoral
- Código de barras (reverso)

Si la imagen NO es una INE (es una foto random, un documento diferente, una selfie, etc.), responde EXACTAMENTE:
{"is_valid_ine": false, "rejection_reason": "breve explicación de por qué no es INE"}

Si ES una INE válida, procede a extraer datos.

ESTRUCTURA DE LA INE MEXICANA:
- FRENTE: Foto del ciudadano. Arriba dice "INSTITUTO NACIONAL ELECTORAL" y "CREDENCIAL PARA VOTAR". 
  Contiene: nombre completo, domicilio, clave de elector, CURP, fecha de nacimiento, sexo, sección, vigencia.
  El NOMBRE aparece después de "NOMBRE" y está en MAYÚSCULAS.
  El DOMICILIO contiene: calle, número, colonia, código postal, municipio y estado.

- REVERSO: Código de barras, firma, datos adicionales.

REGLAS CRÍTICAS:
1. El NOMBRE siempre está separado de los APELLIDOS. En INEs modernas:
   - Primera línea después de "NOMBRE": APELLIDO PATERNO y APELLIDO MATERNO
   - Segunda línea: NOMBRE(S)
   
2. El DOMICILIO sigue este formato típico:
   - "C [nombre de calle] [número]" o "AV [nombre] [número]"
   - La COLONIA usualmente precedida por "COL" o sola
   - CP es un número de 5 dígitos
   - MUNICIPIO y ESTADO al final

3. Si dice "DOMICILIO CONOCIDO" = zona rural, no hay calle/número.
4. La SECCIÓN ELECTORAL es un número de 4 dígitos.
5. Extrae exactamente lo que ves, sin inventar datos.
6. Si un campo no es legible, devuelve null.
7. Los nombres van en MAYÚSCULAS tal como aparecen.

Responde ÚNICAMENTE con un objeto JSON válido, sin explicaciones ni markdown.`

const EXTRACTION_PROMPT = `Analiza esta(s) imagen(es).

PASO 1: ¿Es una credencial INE/IFE mexicana real? Si NO lo es, responde:
{"is_valid_ine": false, "rejection_reason": "explicación"}

PASO 2: Si SÍ es INE, extrae todos los datos y responde:
{
  "is_valid_ine": true,
  "clave_elector": "string de 18 caracteres o null",
  "curp": "string de 18 caracteres o null",
  "nombre": "solo el/los nombre(s) de pila, sin apellidos",
  "apellido_paterno": "primer apellido",
  "apellido_materno": "segundo apellido",
  "fecha_nacimiento": "YYYY-MM-DD o null",
  "sexo": "M o F o null",
  "calle": "nombre de la calle SIN número",
  "numero_exterior": "número de casa/edificio",
  "numero_interior": "depto/interior si existe, o null",
  "colonia": "nombre de la colonia SIN prefijo COL",
  "codigo_postal": "5 dígitos",
  "municipio": "nombre del municipio",
  "estado": "nombre del estado",
  "seccion": "número de 4 dígitos de la sección electoral",
  "vigencia": "año de vigencia",
  "año_registro": "año en que se registró",
  "confidence": {
    "nombre": 0.0-1.0,
    "domicilio": 0.0-1.0,
    "seccion": 0.0-1.0
  }
}

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
      return NextResponse.json(
        { error: 'Se requiere al menos la imagen frontal de la INE' },
        { status: 400 }
      )
    }

    // Prepare images for Claude
    const images: Anthropic.ImageBlockParam[] = []

    const frontBase64 = frontImage.replace(/^data:image\/\w+;base64,/, '')
    images.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: frontBase64 },
    })

    if (backImage) {
      const backBase64 = backImage.replace(/^data:image\/\w+;base64,/, '')
      images.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: backBase64 },
      })
    }

    console.log('[OCR API] Llamando a Claude Vision...')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [...images, { type: 'text', text: EXTRACTION_PROMPT }],
        },
      ],
    })

    console.log('[OCR API] Respuesta de Claude recibida')

    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No se recibió respuesta de texto')
    }

    let ineData: any
    try {
      const cleanJson = textContent.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      ineData = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('[OCR API] Error parsing:', textContent.text)
      throw new Error('No se pudo procesar la respuesta del OCR')
    }

    // Check if image was rejected as non-INE
    if (ineData.is_valid_ine === false) {
      console.log('[OCR API] ❌ Imagen rechazada:', ineData.rejection_reason)
      return NextResponse.json({
        success: false,
        is_valid_ine: false,
        rejection_reason: ineData.rejection_reason || 'La imagen no parece ser una credencial INE válida',
      }, { status: 422 })
    }

    console.log('[OCR API] ✅ INE válida, datos extraídos:', {
      nombre: ineData.nombre,
      municipio: ineData.municipio,
      seccion: ineData.seccion
    })

    // Validate municipio
    const validMunicipios = ['MONTERREY', 'GUADALUPE', 'SAN NICOLÁS DE LOS GARZA', 'SAN NICOLAS DE LOS GARZA', 'APODACA', 'SANTA CATARINA', 'SAN PEDRO GARZA GARCÍA', 'SAN PEDRO GARZA GARCIA', 'GENERAL ESCOBEDO', 'GARCIA', 'JUAREZ', 'SANTIAGO', 'CADEREYTA']
    const municipioNorm = ineData.municipio?.toUpperCase().trim() || ''
    const isValidMunicipio = validMunicipios.some(m => municipioNorm.includes(m) || m.includes(municipioNorm))

    return NextResponse.json({
      success: true,
      is_valid_ine: true,
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
      { error: 'Error procesando la INE', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
