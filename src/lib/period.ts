const TZ_OFFSET_MS = -3 * 60 * 60 * 1000
const BRT_CUTOFF_HOUR = 6

export const OP_CUTOFF_HOUR = BRT_CUTOFF_HOUR

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function formatUTCDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

export function resolveTodayBRT(): string {
  const d = new Date(Date.now() + TZ_OFFSET_MS)
  if (d.getUTCHours() < BRT_CUTOFF_HOUR) d.setUTCDate(d.getUTCDate() - 1)
  return formatUTCDate(d)
}

export function opDateRangeUTC(opDate: string): { from: string; to: string } {
  const from = `${opDate}T09:00:00.000Z`
  const next = new Date(opDate + 'T00:00:00Z')
  next.setUTCDate(next.getUTCDate() + 1)
  return { from, to: formatUTCDate(next) + 'T09:00:00.000Z' }
}

export function opDateWindowDates(opDate: string): { start: Date; end: Date } {
  const { from, to } = opDateRangeUTC(opDate)
  return { start: new Date(from), end: new Date(to) }
}

export function periodRangeUTC(start: string, end: string): { from: string; to: string } {
  const endNext = new Date(end + 'T00:00:00Z')
  endNext.setUTCDate(endNext.getUTCDate() + 1)
  return {
    from: start + 'T09:00:00.000Z',
    to: formatUTCDate(endNext) + 'T09:00:00.000Z',
  }
}

export function parsePeriodRange(params: URLSearchParams): { start: string; end: string } {
  const from = params.get('from')
  const to = params.get('to')

  if (
    from && to &&
    /^\d{4}-\d{2}-\d{2}$/.test(from) &&
    /^\d{4}-\d{2}-\d{2}$/.test(to)
  ) {
    return from <= to ? { start: from, end: to } : { start: to, end: from }
  }

  const period = params.get('period') ?? 'hoje'
  const today = resolveTodayBRT()
  const base = new Date(today + 'T00:00:00Z')

  if (period === 'hoje') return { start: today, end: today }

  if (period === 'ontem') {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() - 1)
    const s = formatUTCDate(d)
    return { start: s, end: s }
  }

  if (period === '7d') {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() - 6)
    return { start: formatUTCDate(d), end: today }
  }

  if (period === '30d') {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() - 29)
    return { start: formatUTCDate(d), end: today }
  }

  if (period === 'este_mes') {
    const first = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1))
    const last = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0))
    return { start: formatUTCDate(first), end: formatUTCDate(last) }
  }

  if (period === 'mes_anterior') {
    const first = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - 1, 1))
    const last = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 0))
    return { start: formatUTCDate(first), end: formatUTCDate(last) }
  }

  return { start: today, end: today }
}
