import { NextRequest, NextResponse } from 'next/server'
import { requireContext } from '@/lib/require-context'
import { createAdminClient } from '@/lib/supabase/server'
import { parsePeriodRange, periodRangeUTC } from '@/lib/period'
import { fetchAll } from '@/lib/paginate'

export async function GET(req: NextRequest) {
  const { empresaIds, isHolding } = await requireContext()

  const { start, end } = parsePeriodRange(req.nextUrl.searchParams)
  const { from: fromUTC, to: toUTC } = periodRangeUTC(start, end)

  const supabase = createAdminClient()

  const { data, error } = await (supabase as any).rpc('fn_dashboard', {
    p_empresa_ids: empresaIds,
    p_from_ts: fromUTC,
    p_to_ts: toUTC,
    p_from_date: start,
    p_to_date: end,
    p_is_holding: isHolding,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalculate despesas using ONLY type='expense' entries.
  // The fn_dashboard RPC may include 'withdrawal' in its aggregation — this
  // query overrides those fields with the correct, filtered values.
  const expenseEntries = await fetchAll((f, t) =>
    supabase
      .from('cash_entries')
      .select('category, amount')
      .in('empresa_id', empresaIds)
      .gte('op_date', start)
      .lte('op_date', end)
      .eq('type', 'expense')
      .range(f, t)
  )

  const faturamento: number = data?.cards_topo?.faturamento ?? 0

  const totalDespesas = expenseEntries.reduce(
    (s: number, e: { amount: unknown }) => s + Number(e.amount),
    0
  )
  const despesas_pct = faturamento > 0 ? (totalDespesas / faturamento) * 100 : 0
  const lucro_estimado = faturamento - totalDespesas
  const margem_pct = faturamento > 0 ? (lucro_estimado / faturamento) * 100 : 0

  const despesaMap = new Map<string, number>()
  for (const e of expenseEntries as { category: unknown; amount: unknown }[]) {
    const cat = String(e.category ?? 'Outros').trim() || 'Outros'
    despesaMap.set(cat, (despesaMap.get(cat) ?? 0) + Number(e.amount))
  }
  const despesas_detalhadas = Array.from(despesaMap.entries())
    .map(([key, valor]) => ({
      key,
      valor,
      pct: faturamento > 0 ? (valor / faturamento) * 100 : 0,
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

  return NextResponse.json({ ok: true, isHolding, periodo: { from: start, to: end }, ...patched })
}
