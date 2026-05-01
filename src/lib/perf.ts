const isDev = process.env.NODE_ENV === 'development'

export function serverMark(): () => number {
  const t0 = Date.now()
  return () => Date.now() - t0
}

export function buildServerTiming(timings: Record<string, number>): string {
  return Object.entries(timings)
    .map(([k, v]) => `${k};dur=${Math.round(v)}`)
    .join(', ')
}

export function perfLog(label: string, ms: number): void {
  if (isDev) {
    console.log(`[perf] ${label}: ${ms}ms`)
  }
}

export function clientMark(label: string): () => void {
  if (typeof performance === 'undefined') return () => {}
  const t0 = performance.now()
  return () => {
    if (isDev) {
      const ms = (performance.now() - t0).toFixed(1)
      console.log(`[perf:client] ${label}: ${ms}ms`)
    }
  }
}
