import { NextResponse } from 'next/server'
import { requireEmpresa } from '@/lib/require-empresa'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const { empresaId } = await requireEmpresa()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('empresas')
    .select('nome, cnpj, telefone, endereco')
    .eq('id', empresaId)
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, data })
}
