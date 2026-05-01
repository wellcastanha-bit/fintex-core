import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getContext, type Context } from '@/lib/context'

export type ContextResult = {
  user: any
  context: Context
  empresaIds: string[]
  nome: string
  competencia?: string
  isHolding: boolean
}

function adminFrom(admin: ReturnType<typeof createAdminClient>, table: string): any {
  return (admin as any).from(table)
}

async function getHoldingEmpresaIds(holdingId: string): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('holding_empresas' as any)
    .select('empresa_id')
    .eq('holding_id', holdingId)
  return ((data as any[]) ?? []).map((r) => r.empresa_id as string)
}

export async function requireContext(): Promise<ContextResult> {
  const supabase = await createClient()

  const [{ data: { user } }, context] = await Promise.all([
    supabase.auth.getUser(),
    getContext(),
  ])

  if (!user) redirect('/login')
  if (!context) redirect('/empresas')

  const admin = createAdminClient()

  if (context.tipo === 'empresa') {
    const [accessRes, configRes, empresaRes] = await Promise.all([
      admin
        .from('acessos_empresas')
        .select('cargo')
        .eq('usuario_id', user.id)
        .eq('empresa_id', context.id)
        .eq('ativo', true)
        .single(),
      (admin.from('empresas_config') as any)
        .select('nome_exibicao, competencia')
        .eq('empresa_id', context.id)
        .maybeSingle(),
      admin.from('empresas').select('nome').eq('id', context.id).single(),
    ])

    if (!accessRes.data) redirect('/empresas')

    const nome = configRes.data?.nome_exibicao ?? empresaRes.data?.nome ?? ''
    const competencia = configRes.data?.competencia ?? undefined
    return { user, context, empresaIds: [context.id], nome, competencia, isHolding: false }
  }

  const [profileRes, holdingRes, empresaIds] = await Promise.all([
    adminFrom(admin, 'profiles').select('super_admin').eq('id', user.id).maybeSingle(),
    adminFrom(admin, 'holdings').select('nome').eq('id', context.id).single(),
    getHoldingEmpresaIds(context.id),
  ])

  const isSuperAdmin = profileRes.data?.super_admin === true

  if (!isSuperAdmin) {
    const { data } = await adminFrom(admin, 'acessos_holdings')
      .select('cargo')
      .eq('usuario_id', user.id)
      .eq('holding_id', context.id)
      .eq('ativo', true)
      .single()

    if (!data) redirect('/empresas')
  }

  const nome = holdingRes.data?.nome ?? 'Holding'

  return { user, context, empresaIds, nome, isHolding: true }
}
