import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getContext, getContextEmpresaIds, type Context } from '@/lib/context'

export type ContextResult = {
  user: any
  context: Context
  empresaIds: string[]
  nome: string
  isHolding: boolean
}

export async function requireContext(): Promise<ContextResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const context = await getContext()
  if (!context) redirect('/empresas')

  const admin = createAdminClient()

  if (context.tipo === 'empresa') {
    const { data } = await admin
      .from('acessos_empresas')
      .select('cargo')
      .eq('usuario_id', user.id)
      .eq('empresa_id', context.id)
      .eq('ativo', true)
      .single()

    if (!data) redirect('/empresas')

    const [configRes, empresaRes] = await Promise.all([
      admin.from('empresas_config').select('nome_exibicao').eq('empresa_id', context.id).maybeSingle(),
      admin.from('empresas').select('nome').eq('id', context.id).single(),
    ])

    const nome = configRes.data?.nome_exibicao ?? empresaRes.data?.nome ?? ''
    return { user, context, empresaIds: [context.id], nome, isHolding: false }
  }

  const profileRes = await admin
    .from('profiles' as any)
    .select('super_admin')
    .eq('id', user.id)
    .maybeSingle()

  const isSuperAdmin = (profileRes.data as any)?.super_admin === true

  if (!isSuperAdmin) {
    const { data } = await admin
      .from('acessos_holdings' as any)
      .select('cargo')
      .eq('usuario_id', user.id)
      .eq('holding_id', context.id)
      .eq('ativo', true)
      .single()

    if (!data) redirect('/empresas')
  }

  const holdingRes = await admin
    .from('holdings' as any)
    .select('nome')
    .eq('id', context.id)
    .single()

  const nome = (holdingRes.data as any)?.nome ?? 'Holding'
  const empresaIds = await getContextEmpresaIds()

  return { user, context, empresaIds, nome, isHolding: true }
}
