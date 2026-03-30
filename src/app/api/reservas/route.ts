import { NextRequest, NextResponse } from 'next/server'
import { requireContext } from '@/lib/require-context'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchAll } from '@/lib/paginate'

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

export async function GET(req: NextRequest) {
  const { empresaIds } = await requireContext()
  const supabase = createAdminClient()

  const params = req.nextUrl.searchParams
  const date = params.get('date')
  const from = params.get('from')
  const to = params.get('to')

  try {
    const rows = await fetchAll((f, t) => {
      let q = (supabase as any)
        .from('reservations')
        .select(RESERVA_COLS)
        .in('empresa_id', empresaIds)
        .order('start_time', { ascending: true })
        .range(f, t)

      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        q = q.eq('day', date)
      } else if (from && to) {
        q = q.gte('day', from).lte('day', to)
      }

      return q
    })

    return NextResponse.json({ ok: true, rows: (rows as any[]).map(toDTO) })
  } catch (e: any) {
    console.error('[/api/reservas GET]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { empresaIds, isHolding } = await requireContext()

  if (isHolding) {
    return NextResponse.json({ error: 'indisponível no modo holding' }, { status: 403 })
  }

  const supabase = createAdminClient()

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'body inválido' }, { status: 400 })
  }

  const customerName = String(body.customerName ?? '').trim()
  const date = String(body.date ?? '').trim()
  const startTime = String(body.startTime ?? '').trim()

  if (!customerName || customerName.length < 2)
    return NextResponse.json({ error: 'customerName obrigatório' }, { status: 400 })
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return NextResponse.json({ error: 'date inválido' }, { status: 400 })
  if (!startTime)
    return NextResponse.json({ error: 'startTime obrigatório' }, { status: 400 })

  const valueCents = body.value ? Math.round(Number(body.value) * 100) : 0

  const { data, error } = await (supabase as any)
    .from('reservations')
    .insert({
      empresa_id: empresaIds[0],
      day: date,
      start_time: startTime,
      end_time: body.endTime ?? null,
      people: body.people ?? null,
      customer_name: customerName,
      phone: body.phone ? String(body.phone).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
      table_code: body.table ? String(body.table).trim() : null,
      location: body.location ? String(body.location).trim() : null,
      value_cents: valueCents,
      is_paid: body.isPaid ?? true,
    })
    .select(RESERVA_COLS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, row: toDTO(data) }, { status: 201 })
}
