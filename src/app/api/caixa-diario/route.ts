import { NextRequest, NextResponse } from 'next/server'
import { requireContext } from '@/lib/require-context'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveTodayBRT, opDateRangeUTC } from '@/lib/period'
import { fetchAll } from '@/lib/paginate'
import { serverMark, buildServerTiming, perfLog } from '@/lib/perf'

export async function GET(req: NextRequest) {
  const tTotal = serverMark()
  const { context, empresaIds, isHolding } = await requireContext()
  const dateParam = req.nextUrl.searchParams.get('date')
  const opDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : resolveTodayBRT()
  const { from, to } = opDateRangeUTC(opDate)

  const supabase = createAdminClient()

  try {
    if (isHolding) {
      // Fetch entries with holding_id scope filter. Falls back progressively:
      //   1. with holding_id filter + payment_method (full schema)
      //   2. without holding_id filter + payment_method (holding_id column absent)
      //   3. without holding_id filter + without payment_method (neither column present)
      // This ensures the page loads regardless of which migrations have been applied.
      const [entries, pedidos] = await Promise.all([
        (async () => {
          // Attempt 1: full schema
          try {
            return await fetchAll((f, t) =>
              supabase
                .from('cash_entries')
                .select('id, type, category, description, amount, occurred_at, payment_method')
                .in('empresa_id', empresaIds)
                .eq('op_date', opDate)
                .or(`holding_id.is.null,holding_id.eq.${context.id}`)
                .order('occurred_at', { ascending: false })
                .range(f, t),
            )
          } catch { /* fall through */ }

          // Attempt 2: holding_id column absent — no scope filter
          try {
            return await fetchAll((f, t) =>
              supabase
                .from('cash_entries')
                .select('id, type, category, description, amount, occurred_at, payment_method')
                .in('empresa_id', empresaIds)
                .eq('op_date', opDate)
                .order('occurred_at', { ascending: false })
                .range(f, t),
            )
          } catch { /* fall through */ }

          // Attempt 3: payment_method column also absent — minimal select
          return fetchAll((f, t) =>
            supabase
              .from('cash_entries')
              .select('id, type, category, description, amount, occurred_at')
              .in('empresa_id', empresaIds)
              .eq('op_date', opDate)
              .order('occurred_at', { ascending: false })
              .range(f, t),
          )
        })(),

        fetchAll((f, t) =>
          supabase
            .from('orders')
            .select('id, created_at, payment_method, r_final, r_inicial, customer_name, platform, service_type')
            .in('empresa_id', empresaIds)
            .gte('created_at', from)
            .lt('created_at', to)
            .order('created_at', { ascending: false })
            .range(f, t),
        ),
      ])

      const totalMs = tTotal()
      perfLog('caixa-diario (holding)', totalMs)
      const res = NextResponse.json({ ok: true, isHolding: true, op_date: opDate, session: null, entries, pedidos })
      res.headers.set('Server-Timing', buildServerTiming({ total: totalMs }))
      return res
    }

    const empresaId = empresaIds[0]

    // Fetch entries with holding_id IS NULL to exclude holding-scoped entries from the empresa
    // view. Falls back to unscoped query if the column does not yet exist.
    const [sessionRes, entries, pedidos] = await Promise.all([
      supabase
        .from('cash_sessions')
        .select('id, op_date, initial_counts, final_counts, status, updated_at')
        .eq('empresa_id', empresaId)
        .eq('op_date', opDate)
        .maybeSingle(),

      (async () => {
        // Attempt 1: full schema
        try {
          return await fetchAll((f, t) =>
            supabase
              .from('cash_entries')
              .select('id, type, category, description, amount, occurred_at, payment_method')
              .eq('empresa_id', empresaId)
              .eq('op_date', opDate)
              .is('holding_id', null)
              .order('occurred_at', { ascending: false })
              .range(f, t),
          )
        } catch { /* fall through */ }

        // Attempt 2: holding_id column absent
        try {
          return await fetchAll((f, t) =>
            supabase
              .from('cash_entries')
              .select('id, type, category, description, amount, occurred_at, payment_method')
              .eq('empresa_id', empresaId)
              .eq('op_date', opDate)
              .order('occurred_at', { ascending: false })
              .range(f, t),
          )
        } catch { /* fall through */ }

        // Attempt 3: payment_method column also absent
        return fetchAll((f, t) =>
          supabase
            .from('cash_entries')
            .select('id, type, category, description, amount, occurred_at')
            .eq('empresa_id', empresaId)
            .eq('op_date', opDate)
            .order('occurred_at', { ascending: false })
            .range(f, t),
        )
      })(),

      fetchAll((f, t) =>
        supabase
          .from('orders')
          .select('id, created_at, payment_method, r_final, r_inicial, customer_name, platform, service_type')
          .eq('empresa_id', empresaId)
          .gte('created_at', from)
          .lt('created_at', to)
          .order('created_at', { ascending: false })
          .range(f, t),
      ),
    ])

    if (sessionRes.error) throw new Error(sessionRes.error.message)

    const totalMs = tTotal()
    perfLog('caixa-diario (empresa)', totalMs)
    const res = NextResponse.json({
      ok: true,
      isHolding: false,
      op_date: opDate,
      session: sessionRes.data ?? null,
      entries,
      pedidos,
    })
    res.headers.set('Server-Timing', buildServerTiming({ total: totalMs }))
    return res
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
