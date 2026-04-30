import Image from 'next/image'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { setContextEmpresa, setContextHolding } from '@/lib/context'
import { getUserHoldings } from '@/lib/require-holding'
import EmpresaSelectorTabs from '@/components/empresa-selector-tabs'

type Acesso = {
  empresa_id: string
  cargo: string
  empresas: { id: string; nome: string } | null
}

async function selecionarEmpresa(empresaId: string) {
  'use server'

  const user = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('acessos_empresas')
    .select('empresa_id')
    .eq('usuario_id', user.id)
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .single()

  if (error || !data) redirect('/m/empresas')

  await setContextEmpresa(empresaId)
  redirect('/m')
}

async function selecionarHolding(holdingId: string) {
  'use server'

  await setContextHolding(holdingId)
  redirect('/m')
}

export default async function MobileEmpresasPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const [empresasRes, holdings] = await Promise.all([
    supabase
      .from('acessos_empresas')
      .select('empresa_id, cargo, empresas(id, nome)')
      .eq('usuario_id', user.id)
      .eq('ativo', true),
    getUserHoldings(user.id),
  ])

  const lista: Acesso[] = (empresasRes.data ?? []).map((item: any) => ({
    empresa_id: item.empresa_id,
    cargo: item.cargo,
    empresas: item.empresas ? { id: item.empresas.id, nome: item.empresas.nome } : null,
  }))

  if (lista.length === 1 && holdings.length === 0) {
    redirect(`/api/select-empresa?id=${lista[0].empresa_id}&next=/m`)
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background:
          'radial-gradient(circle at top, rgba(45,207,190,0.16) 0%, rgba(45,207,190,0.04) 18%, transparent 42%), linear-gradient(180deg, #041328 0%, #031022 45%, #020b18 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(32px, env(safe-area-inset-top)) 20px max(32px, env(safe-area-inset-bottom))',
        fontFamily: "'BaiJamjuree', sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Image
            src="/imagens/logo_foriv.png"
            alt="Fintex"
            width={130}
            height={42}
            priority
            style={{ height: 42, width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </div>

        <div
          style={{
            borderRadius: 28,
            background: 'linear-gradient(180deg, rgba(10,25,45,0.94) 0%, rgba(5,16,33,0.96) 100%)',
            border: '1px solid rgba(45,207,190,0.16)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset, 0 24px 80px rgba(0,0,0,0.45)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(45,207,190,0.08), transparent 24%, transparent 72%, rgba(45,207,190,0.04))',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', padding: '34px 24px 28px' }}>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: '#f8fbff',
                  marginBottom: 8,
                }}
              >
                Selecionar empresa
              </div>
              <div style={{ fontSize: 15, color: 'rgba(227,236,248,0.62)', lineHeight: 1.6 }}>
                Escolha com qual operação deseja continuar.
              </div>
            </div>

            <EmpresaSelectorTabs
              lista={lista}
              holdings={holdings}
              compact={true}
              selecionarEmpresa={selecionarEmpresa}
              selecionarHolding={selecionarHolding}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
