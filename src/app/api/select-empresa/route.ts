import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { setContextEmpresa } from '@/lib/context'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const empresaId = searchParams.get('id')
  const rawNext = searchParams.get('next') ?? '/pedidos'
  // Only allow internal paths; block external URLs and protocol-relative // patterns
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/pedidos'

  if (!empresaId) {
    return NextResponse.redirect(new URL('/empresas', req.url))
  }

  const user = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('acessos_empresas')
    .select('empresa_id')
    .eq('usuario_id', user.id)
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .single()

  if (error || !data) {
    return NextResponse.redirect(new URL('/empresas', req.url))
  }

  await setContextEmpresa(empresaId)
  return NextResponse.redirect(new URL(next, req.url))
}
