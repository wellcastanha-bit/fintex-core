import { NextRequest, NextResponse } from 'next/server'
import { requireContext } from '@/lib/require-context'
import { createAdminClient } from '@/lib/supabase/server'

function validateBody(b: Record<string, unknown>): string | null {
  if (!String(b.op_date ?? '').match(/^\d{4}-\d{2}-\d{2}$/)) return 'op_date inválido'
  if (!('initial_counts' in b) && !('final_counts' in b) && !('status' in b)) {
    return 'nenhum campo para atualizar'
  }
  return null
}

export async function PATCH(req: NextRequest) {
  const { empresaIds, isHolding } = await requireContext()

  if (isHolding) {
    return NextResponse.json({ error: 'indisponível no modo holding' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'body inválido' }, { status: 400 })
  }

  const err = validateBody(body)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  const patch: Record<string, unknown> = {
    empresa_id: empresaIds[0],
    op_date: String(body.op_date),
    updated_at: new Date().toISOString(),
  }

  if ('initial_counts' in body) patch.initial_counts = body.initial_counts
  if ('final_counts' in body) patch.final_counts = body.final_counts
  if ('status' in body) patch.status = body.status

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('cash_sessions')
    .upsert(patch, { onConflict: 'empresa_id,op_date' })
    .select('id, op_date, initial_counts, final_counts, status, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, session: data })
}
