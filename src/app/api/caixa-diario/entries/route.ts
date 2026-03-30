import { NextRequest, NextResponse } from 'next/server'
import { requireContext } from '@/lib/require-context'
import { createAdminClient } from '@/lib/supabase/server'

const VALID_TYPES = ['manual_in', 'expense', 'withdrawal'] as const
type EntryType = (typeof VALID_TYPES)[number]

function validateBody(b: Record<string, unknown>): string | null {
  if (!VALID_TYPES.includes(b.type as EntryType)) return 'type inválido'
  if (typeof b.amount !== 'number' || b.amount <= 0) return 'amount inválido'
  if (!String(b.op_date ?? '').match(/^\d{4}-\d{2}-\d{2}$/)) return 'op_date inválido'
  return null
}

export async function POST(req: NextRequest) {
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

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('cash_entries')
    .insert({
      empresa_id: empresaIds[0],
      op_date: String(body.op_date),
      type: body.type as EntryType,
      amount: body.amount as number,
      category: body.category ? String(body.category).trim() || null : null,
      description: String(body.description ?? '').trim() || null,
      occurred_at: body.occurred_at ?? new Date().toISOString(),
    })
    .select('id, type, category, description, amount, occurred_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, entry: data }, { status: 201 })
}
