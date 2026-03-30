import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'

export type Context =
  | { tipo: 'empresa'; id: string }
  | { tipo: 'holding'; id: string }

export async function getContext(): Promise<Context | null> {
  const store = await cookies()
  const empresaId = store.get('empresa_id')?.value
  if (empresaId) return { tipo: 'empresa', id: empresaId }
  const holdingId = store.get('holding_id')?.value
  if (holdingId) return { tipo: 'holding', id: holdingId }
  return null
}

export async function setContextEmpresa(id: string) {
  const store = await cookies()
  store.delete('holding_id')
  store.set('empresa_id', id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function setContextHolding(id: string) {
  const store = await cookies()
  store.delete('empresa_id')
  store.set('holding_id', id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function clearContext() {
  const store = await cookies()
  store.delete('empresa_id')
  store.delete('holding_id')
}

export async function getContextEmpresaIds(): Promise<string[]> {
  const ctx = await getContext()
  if (!ctx) return []
  if (ctx.tipo === 'empresa') return [ctx.id]

  const admin = createAdminClient()
  const { data } = await admin
    .from('holding_empresas' as any)
    .select('empresa_id')
    .eq('holding_id', ctx.id)

  return ((data as any[]) ?? []).map((r) => r.empresa_id as string)
}
