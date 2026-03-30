import { NextRequest, NextResponse } from 'next/server'
import { requireEmpresa } from '@/lib/require-empresa'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { empresaId } = await requireEmpresa()
  const { id } = await params

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'body inválido' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.ativo === 'boolean') patch.ativo = body.ativo
  if (typeof body.nome === 'string' && body.nome.trim()) patch.nome = body.nome.trim()
  if (typeof body.taxa_entrega === 'number') patch.taxa_entrega = body.taxa_entrega
  if (typeof body.ordem === 'number') patch.ordem = body.ordem

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'nenhum campo para atualizar' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('empresas_bairros')
    .update(patch)
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('id, nome, taxa_entrega, ativo, ordem')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, data })
}
