import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// MOCK: In production, RGs report who has voted from our supporter list
const generateVotingProgress = (contacts: any[]) => {
  const hora = new Date().getHours()
  const progressFactor = Math.min(Math.max((hora - 8) / 10, 0.05), 0.95)

  return contacts.map((c: any) => {
    // Simulate: hard supporters more likely to vote, progress increases through the day
    const baseProb = c.support_level === 'hard_supporter' ? 0.7 : c.support_level === 'soft_supporter' ? 0.45 : 0.2
    const hasVoted = Math.random() < (baseProb * progressFactor)

    return {
      id: c.id,
      name: `${c.name} ${c.paternal_surname || ''}`.trim(),
      phone: c.phone,
      section: c.ine_section,
      support_level: c.support_level,
      has_voted: hasVoted,
      distance_to_casilla: Math.round(200 + Math.random() * 2000),
      needs_transport: Math.random() > 0.7,
      last_contact: hasVoted ? 'Confirmado por RG' : null,
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'overview'

    // Get real contacts
    const { data: contacts } = await supabase
      .from('political_contacts')
      .select('id, name, paternal_surname, phone, ine_section, support_level, section_id')
      .eq('status', 'active')

    // Get real operators
    const { data: operators } = await supabase
      .from('political_operators')
      .select('id, name, phone, section_id, political_roles(role_key, name)')
      .eq('status', 'active')

    // Get sections with LN
    const { data: sections } = await supabase
      .from('electoral_sections')
      .select('id, section_number, lista_nominal, estimated_houses')
      .gt('lista_nominal', 0)

    const allContacts = contacts || []
    const votingData = generateVotingProgress(allContacts)

    if (view === 'overview') {
      const totalSupporters = allContacts.length
      const hardSupporters = allContacts.filter(c => c.support_level === 'hard_supporter').length
      const softSupporters = allContacts.filter(c => c.support_level === 'soft_supporter').length
      const undecided = allContacts.filter(c => c.support_level === 'undecided').length

      const voted = votingData.filter(v => v.has_voted).length
      const notVoted = votingData.filter(v => !v.has_voted).length
      const hardVoted = votingData.filter(v => v.has_voted && v.support_level === 'hard_supporter').length
      const softVoted = votingData.filter(v => v.has_voted && v.support_level === 'soft_supporter').length

      // Sections we're covering
      const coveredSections = [...new Set(allContacts.map(c => c.ine_section).filter(Boolean))]
      const totalSections = (sections || []).length

      // RG coverage (mock: operators with block_promoter role)
      const rgs = (operators || []).filter((o: any) => (o.political_roles as any)?.role_key === 'block_promoter')
      const sectionsWithRG = [...new Set(rgs.map((r: any) => r.section_id).filter(Boolean))]

      // By-section breakdown
      const sectionBreakdown = coveredSections.map(secNum => {
        const secContacts = votingData.filter(v => v.section === secNum)
        const secVoted = secContacts.filter(v => v.has_voted).length
        const secTotal = secContacts.length
        const secLN = (sections || []).find(s => s.section_number === secNum)?.lista_nominal || 0
        return {
          section: secNum,
          total_supporters: secTotal,
          voted: secVoted,
          pending: secTotal - secVoted,
          pct_voted: secTotal > 0 ? Math.round(secVoted / secTotal * 100) : 0,
          lista_nominal: secLN,
          our_pct_of_ln: secLN > 0 ? Math.round(secTotal / secLN * 100 * 10) / 10 : 0,
        }
      }).sort((a, b) => a.pct_voted - b.pct_voted)

      return NextResponse.json({
        stats: {
          total_supporters: totalSupporters,
          hard_supporters: hardSupporters,
          soft_supporters: softSupporters,
          undecided,
          total_voted: voted,
          total_pending: notVoted,
          pct_voted: totalSupporters > 0 ? Math.round(voted / totalSupporters * 100) : 0,
          hard_voted: hardVoted,
          hard_total: hardSupporters,
          soft_voted: softVoted,
          soft_total: softSupporters,
          sections_covered: coveredSections.length,
          total_sections: totalSections,
          sections_with_rg: sectionsWithRG.length,
          rg_count: rgs.length,
        },
        sections: sectionBreakdown,
        last_update: new Date().toISOString(),
      })
    }

    if (view === 'movilizacion') {
      const noShows = votingData
        .filter(v => !v.has_voted && (v.support_level === 'hard_supporter' || v.support_level === 'soft_supporter'))
        .sort((a, b) => {
          if (a.support_level === 'hard_supporter' && b.support_level !== 'hard_supporter') return -1
          if (a.support_level !== 'hard_supporter' && b.support_level === 'hard_supporter') return 1
          return a.distance_to_casilla - b.distance_to_casilla
        })

      return NextResponse.json({
        total_supporters: allContacts.filter(c => c.support_level === 'hard_supporter' || c.support_level === 'soft_supporter').length,
        already_voted: votingData.filter(v => v.has_voted && (v.support_level === 'hard_supporter' || v.support_level === 'soft_supporter')).length,
        no_shows: noShows,
        no_show_count: noShows.length,
        need_transport: noShows.filter(n => n.needs_transport).length,
        high_priority: noShows.filter(n => n.support_level === 'hard_supporter').length,
      })
    }

    if (view === 'reasignacion') {
      // Find sections where our voting rate is low = need reinforcement
      const coveredSections = [...new Set(allContacts.map(c => c.ine_section).filter(Boolean))]
      const sectionStats = coveredSections.map(secNum => {
        const secContacts = votingData.filter(v => v.section === secNum)
        const secVoted = secContacts.filter(v => v.has_voted).length
        const secTotal = secContacts.length
        const secOps = (operators || []).filter((o: any) => {
          const secId = (sections || []).find(s => s.section_number === secNum)?.id
          return o.section_id === secId
        })
        return {
          section: secNum,
          total: secTotal,
          voted: secVoted,
          pct: secTotal > 0 ? Math.round(secVoted / secTotal * 100) : 0,
          brigadistas: secOps.length,
        }
      })

      const needHelp = sectionStats
        .filter(s => s.pct < 50 && s.total >= 3)
        .map(s => ({
          section: s.section,
          pct_voted: s.pct,
          pending: s.total - s.voted,
          current_brigadistas: s.brigadistas,
          recommended_add: Math.max(1, Math.ceil((s.total - s.voted) / 5)),
          reason: `Solo ${s.pct}% de ${s.total} simpatizantes han votado. Faltan ${s.total - s.voted} por movilizar.`,
        }))

      const safe = sectionStats
        .filter(s => s.pct >= 70)
        .map(s => ({
          section: s.section,
          pct_voted: s.pct,
          current_brigadistas: s.brigadistas,
          can_release: Math.max(0, s.brigadistas - 1),
          reason: `${s.pct}% de simpatizantes ya votaron. Zona controlada.`,
        }))

      const recommendation = needHelp.length > 0
        ? `⚠️ ${needHelp.length} secciones necesitan movilización urgente. Priorizar sección ${needHelp[0]?.section} donde solo ${needHelp[0]?.pct_voted}% ha votado.`
        : '✅ Todas las secciones con buen ritmo de votación.'

      return NextResponse.json({
        zones_need_help: needHelp,
        zones_safe: safe,
        recommendation,
      })
    }

    return NextResponse.json({ error: 'Vista no válida' }, { status: 400 })
  } catch (err: any) {
    console.error('[WarRoom] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
