/**
 * Canonical domain values — single source of truth for the entire system.
 * Both backend (API routes) and frontend (display aggregation) must import
 * from here. No other normalization logic should exist anywhere else.
 */

export const PLATFORMS = ['WHATSAPP', 'BALCÃO', 'DELIVERY MUCH', 'AIQFOME', 'IFOOD', 'AMOOFERTAS'] as const
export type Platform = (typeof PLATFORMS)[number]

export const SERVICE_TYPES = ['RETIRADA', 'ENTREGA', 'MESA'] as const
export type ServiceType = (typeof SERVICE_TYPES)[number]

/**
 * Normalizes a raw platform string to its canonical value.
 * Throws if the value cannot be recognized.
 *
 * Mappings:
 *   contains 'ifood'       → IFOOD
 *   contains 'whats'       → WHATSAPP
 *   'balcao' | 'balcão'   → BALCÃO
 *   contains 'delivery'    → DELIVERY MUCH
 *   contains 'aiq'         → AIQFOME
 *   contains 'amoofertas'  → AMOOFERTAS
 */
export function normalizePlatform(input: string): string {
  const s = String(input).trim().toLowerCase()
  if (s.includes('ifood')) return 'IFOOD'
  if (s.includes('whats')) return 'WHATSAPP'
  if (s === 'balcao' || s === 'balcão') return 'BALCÃO'
  if (s.includes('delivery')) return 'DELIVERY MUCH'
  if (s.includes('aiq')) return 'AIQFOME'
  if (s.includes('amoofertas')) return 'AMOOFERTAS'
  throw new Error(`platform inválido: "${input}"`)
}

/**
 * Normalizes a raw service_type string to its canonical value.
 * Throws if the value cannot be recognized.
 *
 * Mappings:
 *   'retirada' | 'balcao' → RETIRADA
 *   'entrega'  | 'delivery' → ENTREGA
 *   'mesa'     | 'mesas'  → MESA
 */
export function normalizeServiceType(input: string): string {
  const s = String(input).trim().toLowerCase()
  if (s === 'retirada' || s === 'balcao') return 'RETIRADA'
  if (s === 'entrega' || s === 'delivery') return 'ENTREGA'
  if (s === 'mesa' || s === 'mesas') return 'MESA'
  throw new Error(`service_type inválido: "${input}"`)
}
