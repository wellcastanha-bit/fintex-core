import { NextRequest, NextResponse } from 'next/server'
import { requireContext } from '@/lib/require-context'
import { createAdminClient } from '@/lib/supabase/server'

const RESERVA_COLS =
  'id, empresa_id, day, start_time, end_time, people, customer_name, phone, notes, table_code, location, value_cents, is_paid, created_at'

function toDTO(r: Record<string, any>) {
  return {
    id: r.id,
    empresa_id: r.empresa_id,
    date: r.day,
    startTime: r.start_time,
    endTime: r.end_time ?? null,
    people: r.people ?? null,
    customerName: r.customer_name,
    phone: r.phone ?? null,
    notes: r.notes ?? null,
    table: r.table_code ?? null,
    location: r.location ?? null,
    value: r.value_cents ? r.value_cents / 100 : 0,
    isPaid: r.is_paid ?? true,
    createdAt: r.created_at,
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { empresaIds, isHolding } = await requireContext()
  const { id } = await params
  const supabase = createAdminClient()

  if (isHolding) {
    return NextResponse.json({ error: 'indisponível no modo holding' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'body inválido' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (body.date !== undefined) patch.day = body.date
  if (body.startTime !== undefined) patch.start_time = body.startTime
  if (body.endTime !== undefined) patch.end_time = body.endTime
  if (body.people !== undefined) patch.people = body.people
  if (body.customerName !== undefined) patch.customer_name = String(body.customerName).trim()
  if (body.phone !== undefined) patch.phone = body.phone
  if (body.notes !== undefined) patch.notes = body.notes
  if (body.table !== undefined) patch.table_code = body.table
  if (body.location !== undefined) patch.location = body.location
  if (body.value !== undefined) patch.value_cents = body.value ? Math.round(Number(body.value) * 100) : 0
  if (body.isPaid !== undefined) patch.is_paid = body.isPaid

  const { data, error } = await (supabase as any)
    .from('reservations')
    .update(patch)
    .eq('id', id)
    .in('empresa_id', empresaIds)
    .select(RESERVA_COLS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, row: toDTO(data) })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { empresaIds, isHolding } = await requireContext()
  const { id } = await params
  const supabase = createAdminClient()

  if (isHolding) {
    return NextResponse.json({ error: 'indisponível no modo holding' }, { status: 403 })
  }

  const { error } = await (supabase as any)
    .from('reservations')
    .delete()
    .eq('id', id)
    .in('empresa_id', empresaIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
