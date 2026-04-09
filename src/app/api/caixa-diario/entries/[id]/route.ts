import { NextRequest, NextResponse } from 'next/server'
import { requireContext } from '@/lib/require-context'
import { createAdminClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { empresaIds, isHolding } = await requireContext()
  const { id } = await params

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  if (isHolding) return NextResponse.json({ error: 'indisponível no modo holding' }, { status: 403 })

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('cash_entries')
    .delete()
    .eq('id', id)
    .in('empresa_id', empresaIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
