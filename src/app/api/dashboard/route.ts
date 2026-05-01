import { NextRequest, NextResponse } from 'next/server'
import { requireContext } from '@/lib/require-context'
import { createAdminClient } from '@/lib/supabase/server'
import { parsePeriodRange, periodRangeUTC } from '@/lib/period'
import { fetchAll } from '@/lib/paginate'
import { serverMark, buildServerTiming, perfLog } from '@/lib/perf'

function isColumnError(err: { code?: string; message: string }): boolean {
  return (
    err.code === '42703' ||
    err.code === 'PGRST204' ||
    err.message.includes('column') ||
    err.message.includes('does not exist')
  )
}

type ExpenseEntry = {
  id: unknown
  category: unknown
  description: unknown
  amount: unknown
  occurred_at: unknown
  payment_method?: unknown
}
type WithdrawalEntry = { amount: unknown }

async function fetchExpenses(
  supabase: ReturnType<typeof createAdminClient>,
  empresaIds: string[],
  start: string,
  end: string,
  contextId: string,
  isHolding: boolean,
): Promise<ExpenseEntry[]> {
  try {
    return await fetchAll<ExpenseEntry>((f, t) => {
      const q = supabase
        .from('cash_entries')
        .select('id, category, description, amount, occurred_at, payment_method')
        .in('empresa_id', empresaIds)
        .gte('op_date', start)
        .lte('op_date', end)
        .eq('type', 'expense')
      return (isHolding
        ? q.or(`holding_id.is.null,holding_id.eq.${contextId}`)
        : q.is('holding_id', null)
      ).range(f, t)
    })
  } catch (err1: unknown) {
    const e1 = err1 instanceof Error ? { message: err1.message } : { message: String(err1) }
    if (!isColumnError(e1)) throw err1
    try {
      return await fetchAll<ExpenseEntry>((f, t) =>
        supabase
          .from('cash_entries')
          .select('id, category, description, amount, occurred_at, payment_method')
          .in('empresa_id', empresaIds)
          .gte('op_date', start)
          .lte('op_date', end)
          .eq('type', 'expense')
          .range(f, t)
      )
    } catch (err2: unknown) {
      const e2 = err2 instanceof Error ? { message: err2.message } : { message: String(err2) }
      if (!isColumnError(e2)) throw err2
      return fetchAll<ExpenseEntry>((f, t) =>
        supabase
          .from('cash_entries')
          .select('id, category, description, amount, occurred_at')
          .in('empresa_id', empresaIds)
          .gte('op_date', start)
          .lte('op_date', end)
          .eq('type', 'expense')
          .range(f, t)
      )
    }
  }
}

async function fetchWithdrawals(
  supabase: ReturnType<typeof createAdminClient>,
  empresaIds: string[],
  start: string,
  end: string,
  contextId: string,
  isHolding: boolean,
): Promise<WithdrawalEntry[]> {
  try {
    return await fetchAll<WithdrawalEntry>((f, t) => {
      const q = supabase
        .from('cash_entries')
        .select('amount')
        .in('empresa_id', empresaIds)
        .gte('op_date', start)
        .lte('op_date', end)
        .eq('type', 'withdrawal')
      return (isHolding
        ? q.or(`holding_id.is.null,holding_id.eq.${contextId}`)
        : q.is('holding_id', null)
      ).range(f, t)
    })
  } catch (err: unknown) {
    const e = err instanceof Error ? { message: err.message } : { message: String(err) }
    if (!isColumnError(e)) throw err
    try {
      return await fetchAll<WithdrawalEntry>((f, t) =>
        supabase
          .from('cash_entries')
          .select('amount')
          .in('empresa_id', empresaIds)
          .gte('op_date', start)
          .lte('op_date', end)
          .eq('type', 'withdrawal')
          .range(f, t)
      )
    } catch {
      return []
    }
  }
}

export async function GET(req: NextRequest) {
  const tTotal = serverMark()
  const { context, empresaIds, isHolding } = await requireContext()

  const { start, end } = parsePeriodRange(req.nextUrl.searchParams)
  const { from: fromUTC, to: toUTC } = periodRangeUTC(start, end)

  const supabase = createAdminClient()
  const db = supabase as any

  const tQueries = serverMark()

  const [rpcResult, expenseEntries, withdrawalEntries] = await Promise.all([
    db.rpc('fn_dashboard', {
      p_empresa_ids: empresaIds,
      p_from_ts: fromUTC,
      p_to_ts: toUTC,
      p_from_date: start,
      p_to_date: end,
      p_is_holding: isHolding,
    }),
    fetchExpenses(supabase, empresaIds, start, end, context.id, isHolding).catch(() => null),
    fetchWithdrawals(supabase, empresaIds, start, end, context.id, isHolding).catch(() => []),
  ])

  const queriesMs = tQueries()
  perfLog('dashboard queries (parallel)', queriesMs)

  const { data, error } = rpcResult

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (expenseEntries === null) {
    const totalMs = tTotal()
    perfLog('dashboard total (rpc-only fallback)', totalMs)
    const res = NextResponse.json({ ok: true, isHolding, periodo: { from: start, to: end }, ...data })
    res.headers.set('Server-Timing', buildServerTiming({ queries: queriesMs, total: totalMs }))
    return res
  }

  const faturamento: number = data?.cards_topo?.faturamento ?? 0

  const totalDespesas = expenseEntries.reduce((s, e) => s + Number(e.amount), 0)
  const despesas_pct = faturamento > 0 ? (totalDespesas / faturamento) * 100 : 0
  const lucro_estimado = faturamento - totalDespesas
  const margem_pct = faturamento > 0 ? (lucro_estimado / faturamento) * 100 : 0

  const despesaMap = new Map<string, {
    total: number
    itens: Array<{ id: string; descricao: string; valor: number; data: string; payment_method: string | null }>
  }>()
  for (const e of expenseEntries) {
    const cat = String(e.category ?? 'Outros').trim() || 'Outros'
    const group = despesaMap.get(cat) ?? { total: 0, itens: [] }
    group.total += Number(e.amount)
    group.itens.push({
      id: String(e.id ?? ''),
      descricao: String(e.description ?? '').trim() || '—',
      valor: Number(e.amount),
      data: String(e.occurred_at ?? ''),
      payment_method: e.payment_method ? String(e.payment_method) : null,
    })
    despesaMap.set(cat, group)
  }
  const despesas_detalhadas = Array.from(despesaMap.entries())
    .map(([key, { total, itens }]) => ({
      key,
      valor: total,
      pct: faturamento > 0 ? (total / faturamento) * 100 : 0,
      itens,
    }))
    .sort((a, b) => b.valor - a.valor)

  const patched = { ...data }
  if (patched.cards_topo) {
    patched.cards_topo = {
      ...patched.cards_topo,
      despesas: totalDespesas,
      despesas_pct,
      lucro_estimado,
      margem_pct,
    }
  }
  patched.despesas_detalhadas = despesas_detalhadas

  if (patched.conferencia_caixa) {
    const cc = patched.conferencia_caixa
    const cashExpenses = expenseEntries
      .filter((e) => !e.payment_method || e.payment_method === 'dinheiro')
      .reduce((s, e) => s + Number(e.amount), 0)
    const totalWithdrawals = (withdrawalEntries as WithdrawalEntry[])
      .reduce((s, e) => s + Number(e.amount), 0)
    const freshSaidas = cashExpenses + totalWithdrawals
    const freshProvaReal =
      (Number(cc.caixaInicial) || 0) +
      (Number(cc.entradasDinheiro) || 0) -
      freshSaidas
    const freshQuebra = (Number(cc.caixaFinal) || 0) - freshProvaReal
    patched.conferencia_caixa = {
      ...cc,
      saidas: freshSaidas,
      provaReal: freshProvaReal,
      quebra: freshQuebra,
      status: Math.abs(freshQuebra) > 5 ? 'ATENÇÃO' : 'OK',
    }
  }

  const totalMs = tTotal()
  perfLog('dashboard total', totalMs)

  const res = NextResponse.json({ ok: true, isHolding, periodo: { from: start, to: end }, ...patched })
  res.headers.set('Server-Timing', buildServerTiming({ queries: queriesMs, total: totalMs }))
  return res
}
