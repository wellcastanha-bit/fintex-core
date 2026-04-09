import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEmpresaId } from '@/lib/empresa-cookie'

export async function requireEmpresa() {
  const supabase = await createClient()

  const [{ data: { user } }, empresaId] = await Promise.all([
    supabase.auth.getUser(),
    getEmpresaId(),
  ])

  if (!user) redirect('/login')
  if (!empresaId) redirect('/empresas')

  const { data } = await supabase
    .from('acessos_empresas')
    .select('cargo')
    .eq('usuario_id', user.id)
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .single()

  if (!data) redirect('/empresas')

  return { user, empresaId, cargo: data.cargo as string }
}
