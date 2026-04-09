import { NextRequest, NextResponse } from 'next/server'
import { requireContext } from '@/lib/require-context'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { empresaIds } = await requireContext()
  const { id } = await params

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const body = await req.json()
  const patch: Record<string, string | number | null> = {}
  if ('responsavel' in body) patch.responsavel = body.responsavel ?? null
  if ('status' in body) patch.status = body.status ?? null
  if ('fatias' in body) patch.fatias = body.fatias != null ? Number(body.fatias) : null

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'nenhum campo para atualizar' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', id)
    .in('empresa_id', empresaIds)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, row: data })
}

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
    .from('orders')
    .delete()
    .eq('id', id)
    .in('empresa_id', empresaIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
