import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Alert {
  id: string
  type: 'critical' | 'warning' | 'insight'
  icon: string
  title: string
  description: string
  action: string
  data?: any
}

export async function GET() {
  try {
    const alerts: Alert[] = []

    // 1. COVERAGE GAPS — sections with 0 contacts
    const { data: coverage } = await supabase.rpc('exec_sql', {
      query: `SELECT count(*) as total_sections, 
        count(*) FILTER (WHERE section_number IN (SELECT DISTINCT ine_section FROM political_contacts WHERE status='active')) as sections_with_contacts
      FROM electoral_sections WHERE lista_nominal > 0`
    })
    if (coverage?.[0]) {
      const total = coverage[0].total_sections
      const covered = coverage[0].sections_with_contacts
      const gap = total - covered
      if (covered < total * 0.1) {
        alerts.push({
          id: 'coverage-gap',
          type: 'critical',
          icon: '🗺️',
          title: `${gap} secciones sin contactar (${Math.round(gap/total*100)}%)`,
          description: `Solo ${covered} de ${total} secciones tienen al menos 1 contacto. La campaña opera en menos del ${Math.round(covered/total*100)}% del territorio.`,
          action: 'Expandir operación a nuevas secciones urgentemente',
        })
      }
    }

    // 2. RESOURCE IMBALANCE — sections with contacts but no operators
    const { data: operators } = await supabase.rpc('exec_sql', {
      query: `SELECT es.section_number, count(pc.id) as contactos,
        (SELECT count(*) FROM political_operators po WHERE po.section_id = es.id AND po.status='active') as operadores
      FROM electoral_sections es
      JOIN political_contacts pc ON pc.section_id = es.id AND pc.status='active'
      GROUP BY es.id, es.section_number
      HAVING (SELECT count(*) FROM political_operators po WHERE po.section_id = es.id AND po.status='active') = 0`
    })
    if (operators && operators.length > 0) {
      alerts.push({
        id: 'no-operators',
        type: 'warning',
        icon: '👤',
        title: `${operators.length} secciones con contactos pero sin operador asignado`,
        description: `Secciones ${operators.map((o: any) => o.section_number).join(', ')} tienen contactos registrados pero nadie coordinando el territorio.`,
        action: 'Asignar coordinadores seccionales inmediatamente',
        data: operators,
      })
    }

    // 3. ISSUE CLUSTERS — same issue mentioned by 3+ people in same section
    const { data: issuePatterns } = await supabase.rpc('exec_sql', {
      query: `SELECT es.section_number, unnest(pc.issues_of_interest) as tema, count(*) as menciones
      FROM political_contacts pc
      JOIN electoral_sections es ON pc.section_id = es.id
      WHERE pc.status = 'active' AND pc.issues_of_interest IS NOT NULL
      GROUP BY es.section_number, unnest(pc.issues_of_interest)
      HAVING count(*) >= 3
      ORDER BY menciones DESC
      LIMIT 10`
    })
    if (issuePatterns && issuePatterns.length > 0) {
      for (const pattern of issuePatterns.slice(0, 3)) {
        alerts.push({
          id: `issue-${pattern.section_number}-${pattern.tema}`,
          type: 'insight',
          icon: '📢',
          title: `"${pattern.tema}" — ${pattern.menciones} menciones en sección ${pattern.section_number}`,
          description: `Múltiples ciudadanos en la misma zona reportan el mismo problema. Esto indica una crisis localizada que puede usarse como propuesta de campaña.`,
          action: `Preparar propuesta específica de ${pattern.tema} para sección ${pattern.section_number}`,
        })
      }
    }

    // 4. UNDECIDED CONCENTRATION — sections with high % undecided
    const { data: undecided } = await supabase.rpc('exec_sql', {
      query: `SELECT es.section_number, 
        count(*) as total,
        count(*) FILTER (WHERE pc.support_level = 'undecided') as indecisos,
        ROUND(count(*) FILTER (WHERE pc.support_level = 'undecided') * 100.0 / NULLIF(count(*), 0)) as pct_indeciso
      FROM political_contacts pc
      JOIN electoral_sections es ON pc.section_id = es.id
      WHERE pc.status = 'active'
      GROUP BY es.section_number
      HAVING count(*) FILTER (WHERE pc.support_level = 'undecided') >= 2
      ORDER BY pct_indeciso DESC
      LIMIT 5`
    })
    if (undecided && undecided.length > 0) {
      const top = undecided[0]
      if (top.pct_indeciso >= 30) {
        alerts.push({
          id: 'undecided-concentration',
          type: 'warning',
          icon: '🎯',
          title: `Sección ${top.section_number}: ${top.pct_indeciso}% de indecisos`,
          description: `${top.indecisos} de ${top.total} contactos son indecisos. Esta sección tiene alto potencial de conversión pero necesita trabajo enfocado.`,
          action: 'Enviar brigadistas especializados en conversión a esta zona',
        })
      }
    }

    // 5. PENETRATION vs OPPORTUNITY — best ROI sections
    const { data: opportunity } = await supabase.rpc('exec_sql', {
      query: `SELECT es.section_number, es.lista_nominal, es.estimated_houses,
        count(pc.id) as contactos,
        ROUND(count(pc.id) * 100.0 / NULLIF(es.estimated_houses, 0), 2) as penetracion
      FROM electoral_sections es
      LEFT JOIN political_contacts pc ON pc.section_id = es.id AND pc.status = 'active'
      WHERE es.lista_nominal > 500
      GROUP BY es.id, es.section_number, es.lista_nominal, es.estimated_houses
      HAVING count(pc.id) > 0
      ORDER BY penetracion DESC
      LIMIT 1`
    })
    if (opportunity && opportunity.length > 0) {
      const best = opportunity[0]
      alerts.push({
        id: 'best-section',
        type: 'insight',
        icon: '⭐',
        title: `Tu mejor sección: ${best.section_number} (${best.penetracion}% penetración)`,
        description: `${best.contactos} contactos de ${best.estimated_houses} viviendas. Esta es tu zona más avanzada — úsala como modelo para replicar en otras secciones.`,
        action: 'Replicar la estrategia de esta sección en las secciones vecinas',
      })
    }

    // Sort: critical first, then warning, then insight
    const priority = { critical: 0, warning: 1, insight: 2 }
    alerts.sort((a, b) => priority[a.type] - priority[b.type])

    return NextResponse.json({ alerts, generated_at: new Date().toISOString() })

  } catch (err: any) {
    console.error('[Alerts API] Error:', err)
    return NextResponse.json({ alerts: [], error: err.message }, { status: 200 })
  }
}
