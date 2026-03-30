import { NextRequest, NextResponse } from 'next/server'
import { requireContext } from '@/lib/require-context'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveTodayBRT, opDateRangeUTC } from '@/lib/period'
import { fetchAll } from '@/lib/paginate'

export async function GET(req: NextRequest) {
  const { empresaIds, isHolding } = await requireContext()
  const dateParam = req.nextUrl.searchParams.get('date')
  const opDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : resolveTodayBRT()
  const { from, to } = opDateRangeUTC(opDate)

  const supabase = createAdminClient()

  try {
    if (isHolding) {
      const [entries, pedidos] = await Promise.all([
        fetchAll((f, t) =>
          supabase
            .from('cash_entries')
            .select('id, type, category, description, amount, occurred_at')
            .in('empresa_id', empresaIds)
            .eq('op_date', opDate)
            .order('occurred_at', { ascending: false })
            .range(f, t),
        ),

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

      return NextResponse.json({ ok: true, isHolding: true, op_date: opDate, session: null, entries, pedidos })
    }

    const empresaId = empresaIds[0]

    const [sessionRes, entries, pedidos] = await Promise.all([
      supabase
        .from('cash_sessions')
        .select('id, op_date, initial_counts, final_counts, status, updated_at')
        .eq('empresa_id', empresaId)
        .eq('op_date', opDate)
        .maybeSingle(),

      fetchAll((f, t) =>
        supabase
          .from('cash_entries')
          .select('id, type, category, description, amount, occurred_at')
          .eq('empresa_id', empresaId)
          .eq('op_date', opDate)
          .order('occurred_at', { ascending: false })
          .range(f, t),
      ),

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

    return NextResponse.json({
      ok: true,
      isHolding: false,
      op_date: opDate,
      session: sessionRes.data ?? null,
      entries,
      pedidos,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
