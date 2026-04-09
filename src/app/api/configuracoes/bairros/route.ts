import { NextRequest, NextResponse } from 'next/server'
import { requireEmpresa } from '@/lib/require-empresa'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { empresaId } = await requireEmpresa()

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'body inválido' }, { status: 400 })
  }

  const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
  const taxa_entrega = typeof body.taxa_entrega === 'number' ? body.taxa_entrega : -1

  if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  if (taxa_entrega < 0) return NextResponse.json({ error: 'Taxa de entrega inválida' }, { status: 400 })

  const ativo = typeof body.ativo === 'boolean' ? body.ativo : true

  const supabase = createAdminClient()

  const { data: maxRow } = await supabase
    .from('empresas_bairros')
    .select('ordem')
    .eq('empresa_id', empresaId)
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ordem = typeof body.ordem === 'number' ? body.ordem : (maxRow?.ordem ?? 0) + 1

  const { data, error } = await supabase
    .from('empresas_bairros')
    .insert({ empresa_id: empresaId, nome, taxa_entrega, ativo, ordem })
    .select('id, nome, taxa_entrega, ativo, ordem')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, data })
}
