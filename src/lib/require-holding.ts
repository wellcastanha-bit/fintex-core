import { createAdminClient } from '@/lib/supabase/server'

async function isSuperAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles' as any)
    .select('super_admin')
    .eq('id', userId)
    .maybeSingle()
  return (data as any)?.super_admin === true
}

export async function getUserHoldings(userId: string): Promise<Array<{ id: string; nome: string; cargo: string }>> {
  const admin = createAdminClient()

  if (await isSuperAdmin(userId)) {
    const { data } = await admin
      .from('holdings' as any)
      .select('id, nome')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    return ((data as any[]) ?? []).map((h: any) => ({
      id: h.id,
      nome: h.nome,
      cargo: 'master',
    }))
  }

  const { data } = await admin
    .from('acessos_holdings' as any)
    .select('cargo, holdings(id, nome, ativo)')
    .eq('usuario_id', userId)
    .eq('ativo', true)

  return ((data as any[]) ?? [])
    .filter((a: any) => a.holdings?.ativo)
    .map((a: any) => ({
      id: a.holdings.id,
      nome: a.holdings.nome,
      cargo: a.cargo,
    }))
}
