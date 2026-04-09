export const PLATFORM_ACCENTS: Record<string, string> = {
  AIQFOME: 'purple',
  BALCÃO: 'blue',
  WHATSAPP: 'green',
  'DELIVERY MUCH': 'orange',
  IFOOD: 'red',
  AMOOFERTAS: 'pink',
}

export const PLATFORM_ACCENT_CYCLE = ['blue', 'purple', 'green', 'orange', 'red']

export const ATENDIMENTO_ACCENTS: Record<string, string> = {
  ENTREGA: 'gray',
  RETIRADA: 'blue',
  MESA: 'orange',
}

export const ATENDIMENTO_ACCENT_CYCLE = ['gray', 'blue', 'orange']

export type OrderRow = {
  payment_method: unknown
  platform: unknown
  service_type: unknown
  r_final: unknown
  r_inicial: unknown
  troco: unknown
  fatias: unknown
}

export type EntryRow = {
  type: string
  category: unknown
  amount: unknown
  payment_method?: string | null
}

export type SessionRow = {
  op_date: unknown
  initial_counts: unknown
  final_counts: unknown
}

export function orderValue(row: OrderRow): number {
  const fin = row.r_final !== null && row.r_final !== undefined ? Number(row.r_final) : null
  if (fin !== null && Number.isFinite(fin) && fin > 0) return fin
  const ini = Number(row.r_inicial ?? 0)
  const troco = Number(row.troco ?? 0)
  return Math.max(0, ini - troco)
}

export function extractCaixaTotal(counts: unknown): number {
  if (typeof counts === 'number') return counts
  if (Array.isArray(counts)) {
    return (counts as Array<{ denomination?: unknown; quantity?: unknown }>).reduce(
      (sum, it) => sum + Number(it?.denomination ?? 0) * Number(it?.quantity ?? 0),
      0
    )
  }
  if (counts && typeof counts === 'object') {
    return Object.entries(counts as Record<string, unknown>).reduce(
      (sum, [denom, qty]) => sum + Number(denom) * Number(qty),
      0
    )
  }
  return 0
}

export function groupByKey(
  rows: OrderRow[],
  keyFn: (r: OrderRow) => string,
  accentMap: Record<string, string>,
  accentCycle: string[]
): Array<{ key: string; pedidos: number; valor: number; pct: number; accent: string }> {
  const map = new Map<string, { pedidos: number; valor: number }>()

  for (const r of rows) {
    const k = keyFn(r)
    const entry = map.get(k) ?? { pedidos: 0, valor: 0 }
    entry.pedidos += 1
    entry.valor += orderValue(r)
    map.set(k, entry)
  }

  const total = Array.from(map.values()).reduce((s, v) => s + v.valor, 0)
  const sorted = Array.from(map.entries())
    .map(([k, v]) => ({
      key: k,
      pedidos: v.pedidos,
      valor: v.valor,
      pct: total > 0 ? (v.valor / total) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor)

  return sorted.map((r, i) => ({
    ...r,
    accent: accentMap[r.key] ?? accentCycle[i % accentCycle.length],
  }))
}

type CaixaResult = { caixaInicial: number; caixaFinal: number }

// Shared core: all dashboard logic except how caixaInicial/caixaFinal are derived.
function computeDashboardCore(
  orders: OrderRow[],
  entries: EntryRow[],
  caixa: CaixaResult
) {
  const faturamento = orders.reduce((s, r) => s + orderValue(r), 0)
  const pedidos = orders.length
  const ticket_medio = pedidos > 0 ? faturamento / pedidos : 0
  const fatias_total = orders.reduce((s, r) => s + Number(r.fatias ?? 0), 0)

  const despesas = entries
    .filter((e) => e.type === 'expense')
    .reduce((s, e) => s + Number(e.amount), 0)

  const despesas_pct = faturamento > 0 ? (despesas / faturamento) * 100 : 0
  const lucro_estimado = faturamento - despesas
  const margem_pct = faturamento > 0 ? (lucro_estimado / faturamento) * 100 : 0

  const ranking_pagamentos = groupByKey(
    orders,
    (r) => String(r.payment_method ?? 'OUTROS').toUpperCase(),
    {},
    []
  ).map(({ accent: _accent, ...rest }) => rest)

  const pedidos_por_plataforma = groupByKey(
    orders,
    (r) => String(r.platform ?? 'OUTROS').toUpperCase(),
    PLATFORM_ACCENTS,
    PLATFORM_ACCENT_CYCLE
  )

  const pedidos_por_atendimento = groupByKey(
    orders,
    (r) => String(r.service_type ?? 'OUTROS').toUpperCase(),
    ATENDIMENTO_ACCENTS,
    ATENDIMENTO_ACCENT_CYCLE
  )

  const pedidosDinheiro = orders
    .filter((o) => String(o.payment_method ?? '').toUpperCase() === 'DINHEIRO')
    .reduce((s, r) => s + Number(r.r_final ?? 0), 0)

  const manualIn = entries
    .filter((e) => e.type === 'manual_in')
    .reduce((s, e) => s + Number(e.amount), 0)

  const entradasDinheiro = pedidosDinheiro + manualIn

  const saidas = entries
    .filter((e) => {
      if (e.type === 'withdrawal') return true
      if (e.type !== 'expense') return false
      // Non-cash expenses (pix/debito/credito) don't leave the cash register.
      // null = legacy record with no payment_method; treat as cash for backward compatibility.
      return !e.payment_method || e.payment_method === 'dinheiro'
    })
    .reduce((s, e) => s + Number(e.amount), 0)

  const { caixaInicial, caixaFinal } = caixa
  const esperado = caixaInicial + entradasDinheiro - saidas
  const quebra = caixaFinal - esperado

  const despesaMap = new Map<string, number>()
  for (const e of entries) {
    if (e.type !== 'expense') continue
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

  return {
    cards_topo: { pedidos, faturamento, ticket_medio, despesas, despesas_pct, lucro_estimado, margem_pct, fatias_total },
    ranking_pagamentos,
    pedidos_por_plataforma,
    pedidos_por_atendimento,
    conferencia_caixa: {
      status: Math.abs(quebra) > 5 ? 'ATENÇÃO' : 'OK',
      caixaInicial,
      entradasDinheiro,
      saidas,
      provaReal: esperado,
      caixaFinal,
      quebra,
    },
    despesas_detalhadas,
  }
}

// Single-empresa: caixaInicial from first session, caixaFinal from last session.
export function computeDashboard(
  orders: OrderRow[],
  entries: EntryRow[],
  sessions: SessionRow[]
) {
  const firstSession = sessions[0] ?? null
  const lastSession = sessions[sessions.length - 1] ?? null
  const caixa: CaixaResult = {
    caixaInicial: extractCaixaTotal(firstSession?.initial_counts ?? null),
    caixaFinal: extractCaixaTotal(lastSession?.final_counts ?? null),
  }
  return computeDashboardCore(orders, entries, caixa)
}

// Holding: caixaInicial and caixaFinal are the sum across all member sessions.
export function computeHoldingDashboard(
  orders: OrderRow[],
  entries: EntryRow[],
  sessions: SessionRow[]
) {
  const caixa: CaixaResult = {
    caixaInicial: sessions.reduce((s, sess) => s + extractCaixaTotal(sess.initial_counts), 0),
    caixaFinal: sessions.reduce((s, sess) => s + extractCaixaTotal(sess.final_counts), 0),
  }
  return computeDashboardCore(orders, entries, caixa)
}
