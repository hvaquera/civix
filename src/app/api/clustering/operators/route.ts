import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sectionId = searchParams.get('section_id')

  // Fetch operators that could be assigned as manzaneros
  // Include: block_promoters in this section + unassigned operators
  const { data: operators, error } = await supabase
    .from('political_operators')
    .select(`
      id, name, phone,
      political_roles ( role_key, name )
    `)
    .eq('municipality_id', 'a0000000-0000-0000-0000-000000000001')
    .eq('status', 'active')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    operators: (operators || []).map(op => ({
      id: op.id,
      name: op.name,
      phone: op.phone,
      role: (op.political_roles as any)?.name || 'Sin rol',
    })),
  })
}
