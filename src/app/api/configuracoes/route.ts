import { NextResponse } from 'next/server'
import { requireEmpresa } from '@/lib/require-empresa'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const { empresaId } = await requireEmpresa()
  const supabase = createAdminClient()

  const [config, plataformas, pagamentos, atendimentos, bairros] = await Promise.all([
    supabase
      .from('empresas_config')
      .select('nome_exibicao, margem_padrao, ativo')
      .eq('empresa_id', empresaId)
      .maybeSingle(),

    supabase
      .from('empresas_plataformas')
      .select('id, codigo, nome, ativo, ordem')
      .eq('empresa_id', empresaId)
      .order('ordem', { ascending: true }),

    supabase
      .from('empresas_pagamentos')
      .select('id, codigo, nome, ativo, ordem')
      .eq('empresa_id', empresaId)
      .order('ordem', { ascending: true }),

    supabase
      .from('empresas_atendimentos')
      .select('id, codigo, nome, ativo, ordem')
      .eq('empresa_id', empresaId)
      .order('ordem', { ascending: true }),

    supabase
      .from('empresas_bairros')
      .select('id, nome, taxa_entrega, ativo, ordem')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true }),
  ])

  const erro =
    config.error ??
    plataformas.error ??
    pagamentos.error ??
    atendimentos.error ??
    bairros.error

  if (erro) return NextResponse.json({ ok: false, error: erro.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    data: {
      config: config.data,
      plataformas: plataformas.data ?? [],
      pagamentos: pagamentos.data ?? [],
      atendimentos: atendimentos.data ?? [],
      bairros: bairros.data ?? [],
    },
  })
}
