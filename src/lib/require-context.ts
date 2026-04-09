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

// Tables not yet in the generated Supabase schema — single cast point.
// Replace with typed client once `npx supabase gen types` is run.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminFrom(admin: ReturnType<typeof createAdminClient>, table: string): any {
  return (admin as any).from(table)
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

  const profileRes = await adminFrom(admin, 'profiles')
    .select('super_admin')
    .eq('id', user.id)
    .maybeSingle()

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

  const holdingRes = await adminFrom(admin, 'holdings')
    .select('nome')
    .eq('id', context.id)
    .single()

  const nome = holdingRes.data?.nome ?? 'Holding'
  const empresaIds = await getContextEmpresaIds()

  return { user, context, empresaIds, nome, isHolding: true }
}
