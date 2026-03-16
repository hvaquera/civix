import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DB_SCHEMA = `
TABLES IN DATABASE:

1. political_contacts (ciudadanos registrados en campo)
   - id, name, paternal_surname, maternal_surname, phone, street, colonia_text, postal_code
   - ine_section (integer - número de sección electoral)
   - section_id (uuid -> electoral_sections.id)
   - support_level: 'hard_supporter' | 'soft_supporter' | 'undecided' | 'opponent'
   - issues_of_interest: text[] (array de temas: infraestructura, seguridad, agua, empleo, salud, educacion, vivienda)
   - specific_requests: text (petición textual del ciudadano)
   - latitude, longitude (ubicación geocodificada)
   - cluster_id (uuid -> territorial_clusters.id)
   - status: 'active' | 'inactive'
   - created_at

2. political_operators (brigadistas, manzaneros, coordinadores)
   - id, name, phone
   - role_id (uuid -> political_roles.id)
   - section_id (uuid -> electoral_sections.id, nullable)
   - district_id (uuid -> electoral_districts.id, nullable)
   - municipality_id, status: 'active'|'inactive', created_at

3. political_roles
   - id, role_key: 'block_promoter'|'colonia_leader'|'section_coordinator'|'district_coordinator'|'campaign_leader'|'superadmin'
   - name (Spanish label)

4. electoral_sections (secciones electorales con geometría)
   - id, section_number (integer), section_key
   - district_id, municipality_id
   - lista_nominal (integer - votantes registrados, dato real del INE)
   - padron_electoral (integer)
   - estimated_houses (integer - viviendas estimadas)
   - geom (PostGIS geometry)

5. territorial_clusters (clusters generados por IA)
   - id, cluster_name, cluster_key, section_id
   - centroid_lat, centroid_lng, radius_meters
   - contacts_count, ai_confidence
   - status: 'suggested'|'approved'|'active'|'dissolved'
   - assigned_manzanero_id (uuid -> political_operators.id)

6. colonias
   - id, name, postal_code, municipality_id

7. electoral_districts
   - id, district_number, name, municipality_id

MUNICIPALITY ID: 'a0000000-0000-0000-0000-000000000001' (Monterrey)

IMPORTANT NOTES:
- support_level values: hard_supporter, soft_supporter, undecided, opponent
- issues_of_interest is a text array, use ANY() or @> for querying
- Use section_number (integer) when the user says "sección 1234"
- lista_nominal is REAL data from INE 2024
- Always limit results to 100 unless user asks for totals/aggregates
`

const SYSTEM_PROMPT = `Eres el Copilot Electoral de CIVIX, un asistente de IA experto en análisis de datos electorales y estrategia de campaña para Monterrey, Nuevo León.

Tu trabajo es responder preguntas sobre los datos de la campaña consultando la base de datos.

FLUJO:
1. El usuario hace una pregunta en lenguaje natural
2. Generas una consulta SQL segura (solo SELECT, nunca INSERT/UPDATE/DELETE)
3. Recibes los resultados
4. Interpretas y respondes en español con insights accionables

REGLAS:
- SOLO genera SELECT queries, nunca modifiques datos
- Siempre incluye LIMIT para evitar queries enormes
- Responde en español
- Sé conciso pero con insights útiles
- Si detectas patrones interesantes, mencionálos
- Si el usuario pide un "reporte", genera un resumen estructurado
- Si pide algo que no está en la BD, dilo honestamente
- Para "anomalías" o "alertas", busca patrones inusuales en los datos
- Para "discurso" o "brief", genera recomendaciones basadas en las peticiones de la zona

SCHEMA DE LA BD:
${DB_SCHEMA}

Responde SIEMPRE en este formato JSON exacto:
{
  "sql": "SELECT ... FROM ... (la query a ejecutar)",
  "explanation": "breve explicación de qué va a buscar",
  "needs_query": true
}

O si no necesitas consultar la BD (pregunta general):
{
  "answer": "tu respuesta directa",
  "needs_query": false
}
`

const INTERPRET_PROMPT = `Eres el Copilot Electoral de CIVIX. Eres un CONSULTOR POLÍTICO EXPERIMENTADO, no un cheerleader.

CONTEXTO CRÍTICO DE LA CAMPAÑA:
- Monterrey tiene ~963,000 personas en la Lista Nominal
- Hay ~752 secciones electorales con ~296,000 viviendas estimadas
- Para ganar una elección municipal necesitas al menos 200,000+ votos
- Cualquier número de contactos menor a 10,000 es una campaña EN PAÑALES
- Un buen avance territorial cubre al menos el 30% de las secciones
- Tener 42 contactos de 963,000 es 0.004% — esto es prácticamente CERO

REGLAS:
- Sé HONESTO y DIRECTO. Si los números son malos, dilo claramente
- SIEMPRE compara contra el universo total (lista nominal, viviendas, secciones totales)
- No digas "excelente" si el avance es menor al 5%
- Usa porcentajes de penetración: contactos / viviendas estimadas de esas secciones
- Da recomendaciones CONCRETAS y URGENTES cuando los números son bajos
- Formatea con markdown: **negritas** para datos clave
- No uses encabezados con # — usa **negritas** y saltos de línea
- Si los datos sugieren una acción urgente, márcala con ⚠️
- Sé conciso, máximo 300 palabras
- NO muestres SQL ni datos técnicos, solo insights para el coordinador

Responde SOLO el texto interpretado, nada más.`

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
    }

    // Step 1: Ask Claude to generate SQL
    const genResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          ...(history || []).slice(-6), // Keep last 3 exchanges for context
          { role: 'user', content: message },
        ],
      }),
    })

    if (!genResponse.ok) throw new Error('Error calling Claude')

    const genData = await genResponse.json()
    const genText = genData.content[0]?.text || ''
    const cleanJson = genText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed: any
    try {
      parsed = JSON.parse(cleanJson)
    } catch {
      // If Claude didn't return JSON, treat as direct answer
      return NextResponse.json({
        answer: genText,
        sql: null,
        data: null,
      })
    }

    // If no query needed, return direct answer
    if (!parsed.needs_query) {
      return NextResponse.json({
        answer: parsed.answer,
        sql: null,
        data: null,
      })
    }

    // Step 2: Execute the SQL
    const sql = parsed.sql
    console.log('[Copilot] SQL:', sql)

    // Safety check — only allow SELECT
    if (!sql.trim().toUpperCase().startsWith('SELECT')) {
      return NextResponse.json({
        answer: '⚠️ Solo puedo consultar datos, no modificarlos.',
        sql,
        data: null,
      })
    }

    const { data: queryResult, error: queryError } = await supabase.rpc('exec_sql', { query: sql })

    let resultData: any = null
    let resultText = ''

    if (queryError) {
      // Try direct query if RPC doesn't exist
      console.log('[Copilot] RPC failed, trying raw query...')
      try {
        const rawResult = await supabase.from('political_contacts').select('id').limit(0) // Test connection
        resultText = `Error en query: ${queryError.message}. Intenta reformular tu pregunta.`
      } catch {
        resultText = `Error de conexión a la base de datos.`
      }

      // Fallback: try common queries directly
      if (sql.includes('political_contacts')) {
        const { data, error } = await supabase.from('political_contacts').select('*').eq('status', 'active').limit(100)
        if (!error) resultData = data
      }
    } else {
      resultData = queryResult
    }

    // Step 3: Interpret results
    const interpretResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: INTERPRET_PROMPT,
        messages: [{
          role: 'user',
          content: `Pregunta del usuario: "${message}"

SQL ejecutado: ${sql}

Explicación: ${parsed.explanation}

Resultados (JSON):
${JSON.stringify(resultData || resultText, null, 2).slice(0, 8000)}

Interpreta estos resultados para el coordinador de campaña.`,
        }],
      }),
    })

    const interpretData = await interpretResponse.json()
    const answer = interpretData.content[0]?.text || 'No pude interpretar los resultados.'

    return NextResponse.json({
      answer,
      sql,
      data: resultData,
      explanation: parsed.explanation,
    })

  } catch (err: any) {
    console.error('[Copilot] Error:', err)
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
