import { NextRequest, NextResponse } from 'next/server'
import { requireContext } from '@/lib/require-context'
import { createAdminClient } from '@/lib/supabase/server'
import { parsePeriodRange, periodRangeUTC } from '@/lib/period'
import { fetchAll } from '@/lib/paginate'

export async function GET(req: NextRequest) {
  const { context, empresaIds, isHolding } = await requireContext()

  const { start, end } = parsePeriodRange(req.nextUrl.searchParams)
  const { from: fromUTC, to: toUTC } = periodRangeUTC(start, end)

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any  // single cast; remove once Supabase types are generated

  const { data, error } = await db.rpc('fn_dashboard', {
    p_empresa_ids: empresaIds,
    p_from_ts: fromUTC,
    p_to_ts: toUTC,
    p_from_date: start,
    p_to_date: end,
    p_is_holding: isHolding,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type ExpenseEntry = { id: unknown; category: unknown; description: unknown; amount: unknown; occurred_at: unknown; payment_method: unknown }
  type WithdrawalEntry = { amount: unknown }

  // For holding: include empresa-level entries (holding_id IS NULL) + holding-level entries.
  // For empresa: include only empresa-level entries (holding_id IS NULL), excluding entries
  // that belong to a holding even if stored under this empresa's empresa_id.
  //
  // NOTE: these queries depend on the holding_id and payment_method columns existing in
  // cash_entries. If the schema migration has not been applied yet, fetchAll will throw and
  // we fall back to returning the raw RPC payload so the dashboard still loads.
  let expenseEntries: ExpenseEntry[] = []
  let withdrawalEntries: WithdrawalEntry[] = []
  let entriesFetched = false

  try {
    ;[expenseEntries, withdrawalEntries] = await Promise.all([
      fetchAll<ExpenseEntry>((f, t) => {
        const q = supabase
          .from('cash_entries')
          .select('id, category, description, amount, occurred_at, payment_method')
          .in('empresa_id', empresaIds)
          .gte('op_date', start)
          .lte('op_date', end)
          .eq('type', 'expense')
        return (isHolding
          ? q.or(`holding_id.is.null,holding_id.eq.${context.id}`)
          : q.is('holding_id', null)
        ).range(f, t)
      }),
      fetchAll<WithdrawalEntry>((f, t) => {
        const q = supabase
          .from('cash_entries')
          .select('amount')
          .in('empresa_id', empresaIds)
          .gte('op_date', start)
          .lte('op_date', end)
          .eq('type', 'withdrawal')
        return (isHolding
          ? q.or(`holding_id.is.null,holding_id.eq.${context.id}`)
          : q.is('holding_id', null)
        ).range(f, t)
      }),
    ])
    entriesFetched = true
  } catch {
    // Schema migration not yet applied — return raw RPC payload without expense recomputation.
    return NextResponse.json({ ok: true, isHolding, periodo: { from: start, to: end }, ...data })
  }

  const faturamento: number = data?.cards_topo?.faturamento ?? 0

  const totalDespesas = (expenseEntries as ExpenseEntry[]).reduce(
    (s, e) => s + Number(e.amount),
    0
  )
  const despesas_pct = faturamento > 0 ? (totalDespesas / faturamento) * 100 : 0
  const lucro_estimado = faturamento - totalDespesas
  const margem_pct = faturamento > 0 ? (lucro_estimado / faturamento) * 100 : 0

  // itens are accumulated in the same loop that builds the category total —
  // this guarantees group.valor === sum(group.itens.map(i => i.valor)) always.
  const despesaMap = new Map<string, {
    total: number
    itens: Array<{ id: string; descricao: string; valor: number; data: string }>
  }>()
  for (const e of expenseEntries as ExpenseEntry[]) {
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

  // Recompute saidas from scratch using filtered entries (respects holding_id scope and
  // payment_method). This replaces the previous approach that adjusted cc.saidas from the
  // RPC — the RPC is unaware of holding_id and would include holding expenses in empresa A.
  if (patched.conferencia_caixa) {
    const cc = patched.conferencia_caixa
    const cashExpenses = (expenseEntries as ExpenseEntry[])
      .filter((e) => !e.payment_method || e.payment_method === 'dinheiro')
      .reduce((s, e) => s + Number(e.amount), 0)
    const totalWithdrawals = (withdrawalEntries as WithdrawalEntry[])
      .reduce((s, e) => s + Number(e.amount), 0)
    const freshSaidas = cashExpenses + totalWithdrawals
    patched.conferencia_caixa = {
      ...cc,
      saidas: freshSaidas,
      provaReal:
        (Number(cc.caixaInicial) || 0) +
        (Number(cc.entradasDinheiro) || 0) -
        freshSaidas,
    }
  }

  return NextResponse.json({ ok: true, isHolding, periodo: { from: start, to: end }, ...patched })
}
