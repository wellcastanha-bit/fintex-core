import { NextRequest, NextResponse } from 'next/server'
import { requireContext } from '@/lib/require-context'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { parsePeriodRange, periodRangeUTC } from '@/lib/period'
import { normalizePlatform, normalizeServiceType } from '@/lib/normalizers'

const ORDER_COLS =
  'id, created_at, status, responsavel, customer_name, platform, service_type, bairros, taxa_entrega, payment_method, r_inicial, r_final, troco, fatias'

const DEFAULT_LIMIT = 200

function toOrderDTO(row: Record<string, unknown>) {
  return {
    id: row.id,
    created_at: row.created_at,
    status: row.status ?? null,
    responsavel: row.responsavel ?? null,
    cliente_nome: row.customer_name ?? null,
    plataforma: row.platform ?? null,
    atendimento: row.service_type ?? null,
    bairro: row.bairros ?? null,
    taxa_entrega: row.taxa_entrega ?? null,
    pagamento: row.payment_method ?? null,
    valor_pago: row.r_inicial ?? null,
    valor_final: row.r_final ?? null,
    troco: row.troco ?? null,
    fatias: row.fatias ?? null,
  }
}

function validateBody(b: Record<string, unknown>): string | null {
  if (!String(b.customer_name ?? '').trim()) return 'customer_name obrigatório'
  if (!String(b.platform ?? '').trim()) return 'platform obrigatório'
  if (!String(b.service_type ?? '').trim()) return 'service_type obrigatório'
  if (!String(b.payment_method ?? '').trim()) return 'payment_method obrigatório'
  if (typeof b.r_inicial !== 'number' || b.r_inicial < 0) return 'r_inicial inválido'
  if (typeof b.troco !== 'number' || b.troco < 0) return 'troco inválido'
  if (typeof b.taxa_entrega !== 'number' || b.taxa_entrega < 0) return 'taxa_entrega inválida'
  return null
}

export async function GET(req: NextRequest) {
  const { empresaIds } = await requireContext()
  const supabase = createAdminClient()

  const params = req.nextUrl.searchParams
  const limit = Math.min(Math.max(parseInt(params.get('limit') ?? String(DEFAULT_LIMIT), 10), 1), 1000)
  const offset = Math.max(parseInt(params.get('offset') ?? '0', 10), 0)
  const hasDateFilter = params.has('from') || params.has('to') || params.has('period')

  let fromUTC: string | undefined
  let toUTC: string | undefined

  if (hasDateFilter) {
    const { start, end } = parsePeriodRange(params)
    const range = periodRangeUTC(start, end)
    fromUTC = range.from
    toUTC = range.to
  }

  try {
    let q = supabase
      .from('orders')
      .select(ORDER_COLS, { count: 'estimated' })
      .in('empresa_id', empresaIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fromUTC && toUTC) {
      q = q.gte('created_at', fromUTC).lt('created_at', toUTC)
    }

    const { data, error, count } = await q

    if (error) throw new Error(error.message)

    const rows = (data ?? []) as Record<string, unknown>[]
    const hasMore = count !== null ? offset + limit < count : rows.length === limit

    return NextResponse.json({ ok: true, rows: rows.map(toOrderDTO), has_more: hasMore, offset, limit })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { empresaIds, isHolding } = await requireContext()

  if (isHolding) {
    return NextResponse.json({ error: 'indisponível no modo holding' }, { status: 403 })
  }

  const supabase = await createClient()

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'body inválido' }, { status: 400 })
  }

  const err = validateBody(body)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  let platform: string
  let service_type: string
  try {
    platform = normalizePlatform(String(body.platform))
    service_type = normalizeServiceType(String(body.service_type))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('orders')
    .insert({
      empresa_id: empresaIds[0],
      customer_name: String(body.customer_name).trim(),
      platform,
      service_type,
      payment_method: String(body.payment_method).trim(),
      r_inicial: body.r_inicial as number,
      troco: body.troco as number,
      bairros: String(body.bairros ?? '').trim() || null,
      taxa_entrega: body.taxa_entrega as number,
      status: 'EM PRODUÇÃO',
    })
    .select('id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: data.id, created_at: data.created_at }, { status: 201 })
}
