import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sectionId = searchParams.get('section_id')

  const { data: operators, error } = await supabase
    .from('political_operators')
    .select('id, name, phone, section_id, district_id, political_roles ( role_key, name )')
    .eq('municipality_id', 'a0000000-0000-0000-0000-000000000001')
    .eq('status', 'active')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const allOps = (operators || []).map(op => ({
    id: op.id, name: op.name, phone: op.phone,
    role_key: (op.political_roles as any)?.role_key || '',
    role: (op.political_roles as any)?.name || 'Sin rol',
    section_id: op.section_id, district_id: op.district_id,
  }))

  // Distrital: if only one exists, they cover everything
  const distritales = allOps.filter(o => o.role_key === 'district_coordinator')
  const distrital = distritales.length === 1 ? distritales[0] : null

  // Seccional: must match THIS section
  const seccional = allOps.find(o => o.role_key === 'section_coordinator' && o.section_id === sectionId) || null

  // Jefe de colonia: must match THIS section
  const colonia = allOps.find(o => o.role_key === 'colonia_leader' && o.section_id === sectionId) || null

  // Manzaneros: ONLY block_promoters in THIS section
  const manzaneros = allOps.filter(o => o.role_key === 'block_promoter' && o.section_id === sectionId)

  return NextResponse.json({
    operators: manzaneros,
    structure: { distrital, seccional, colonia, manzaneros },
  })
}