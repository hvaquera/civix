import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generate AI message for a segment
async function generateMessage(segment: string, channel: string): Promise<string> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: `Eres un experto en comunicación política en México. Genera mensajes para campañas de contacto ciudadano.
El mensaje debe ser: breve (máximo 160 chars para SMS, 300 para WhatsApp), cálido, personalizado, no político agresivo, enfocado en resolver problemas del ciudadano.
NO uses hashtags, NO menciones partidos, NO pidas voto directo. Sé humano y cercano.`,
        messages: [{ role: 'user', content: `Genera un mensaje de ${channel} para este segmento: ${segment}. Solo el texto del mensaje, nada más.` }],
      }),
    })
    const data = await res.json()
    return data.content[0]?.text || 'Hola vecino, queremos saber cómo podemos ayudarte. ¿Qué necesita tu colonia?'
  } catch {
    return 'Hola vecino, queremos saber cómo podemos ayudarte. ¿Qué necesita tu colonia?'
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get audience segments from real data
    const { data: contacts } = await supabase
      .from('political_contacts')
      .select('id, name, phone, ine_section, support_level, issues_of_interest, colonia_text')
      .eq('status', 'active')

    const allContacts = contacts || []

    // Build segments
    const segments = {
      all: { label: 'Todos los contactos', count: allContacts.length, contacts: allContacts },
      hard: { label: 'Simpatizantes duros', count: allContacts.filter(c => c.support_level === 'hard_supporter').length, contacts: allContacts.filter(c => c.support_level === 'hard_supporter') },
      soft: { label: 'Simpatizantes blandos', count: allContacts.filter(c => c.support_level === 'soft_supporter').length, contacts: allContacts.filter(c => c.support_level === 'soft_supporter') },
      undecided: { label: 'Indecisos', count: allContacts.filter(c => c.support_level === 'undecided').length, contacts: allContacts.filter(c => c.support_level === 'undecided') },
      security: { label: 'Preocupados por seguridad', count: allContacts.filter(c => c.issues_of_interest?.includes('seguridad')).length, contacts: allContacts.filter(c => c.issues_of_interest?.includes('seguridad')) },
      infrastructure: { label: 'Piden infraestructura', count: allContacts.filter(c => c.issues_of_interest?.includes('infraestructura')).length, contacts: allContacts.filter(c => c.issues_of_interest?.includes('infraestructura')) },
      withPhone: { label: 'Con teléfono registrado', count: allContacts.filter(c => c.phone).length, contacts: allContacts.filter(c => c.phone) },
    }

    // Mock past campaigns
    const pastCampaigns = [
      { id: 1, name: 'Bienvenida simpatizantes', channel: 'whatsapp', segment: 'hard', sent: 24, delivered: 22, read: 18, responded: 8, date: '2024-02-15', status: 'completed' },
      { id: 2, name: 'Encuesta seguridad', channel: 'voice', segment: 'security', sent: 15, delivered: 15, responded: 6, date: '2024-02-20', status: 'completed' },
      { id: 3, name: 'Invitación evento', channel: 'whatsapp', segment: 'all', sent: 42, delivered: 38, read: 25, responded: 12, date: '2024-03-01', status: 'completed' },
    ]

    return NextResponse.json({
      segments: Object.entries(segments).map(([key, val]) => ({
        key, label: val.label, count: val.count,
      })),
      past_campaigns: pastCampaigns,
      total_contacts_with_phone: allContacts.filter(c => c.phone).length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, segment, channel, customMessage } = await request.json()

    if (action === 'generate_message') {
      const message = await generateMessage(segment, channel)
      return NextResponse.json({ message })
    }

    if (action === 'preview') {
      // Get contacts for this segment
      const { data: contacts } = await supabase
        .from('political_contacts')
        .select('name, phone, ine_section, support_level, colonia_text')
        .eq('status', 'active')

      let filtered = contacts || []
      if (segment === 'hard') filtered = filtered.filter(c => c.support_level === 'hard_supporter')
      if (segment === 'soft') filtered = filtered.filter(c => c.support_level === 'soft_supporter')
      if (segment === 'undecided') filtered = filtered.filter(c => c.support_level === 'undecided')

      return NextResponse.json({
        recipients: filtered.filter(c => c.phone).slice(0, 10),
        total: filtered.filter(c => c.phone).length,
        estimated_cost: channel === 'whatsapp'
          ? `$${(filtered.filter(c => c.phone).length * 0.50).toFixed(2)} MXN`
          : `$${(filtered.filter(c => c.phone).length * 0.80).toFixed(2)} MXN`,
      })
    }

    if (action === 'send') {
      // MOCK: In production this calls WhatsApp Business API or Twilio
      console.log(`[Campañas] MOCK SEND: ${channel} to segment ${segment}`)
      return NextResponse.json({
        success: true,
        mock: true,
        message: `Campaña de ${channel} enviada al segmento "${segment}" (modo demo — no se enviaron mensajes reales)`,
        campaign_id: `camp_${Date.now()}`,
      })
    }

    if (action === 'voice_config') {
      return NextResponse.json({
        available_voices: [
          { id: 'maria', name: 'María (femenina, amable)', language: 'es-MX' },
          { id: 'carlos', name: 'Carlos (masculino, profesional)', language: 'es-MX' },
          { id: 'ana', name: 'Ana (femenina, joven)', language: 'es-MX' },
        ],
        default_questions: [
          '¿Cuál es el problema más importante en su colonia?',
          '¿Ha notado mejoras en los últimos meses?',
          '¿Le gustaría que lo visitara un representante del candidato?',
        ],
      })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
