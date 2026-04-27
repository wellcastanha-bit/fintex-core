import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { setContextEmpresa, setContextHolding } from '@/lib/context'
import { getUserHoldings } from '@/lib/require-holding'
import EmpresaSelectorTabs from '@/components/empresa-selector-tabs'

type Acesso = {
  empresa_id: string
  cargo: string
  empresas: {
    id: string
    nome: string
  } | null
}

type PageProps = Record<string, never>

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

  if (error || !data) redirect('/empresas')

  await setContextEmpresa(empresaId)
  redirect('/pedidos')
}

async function selecionarHolding(holdingId: string) {
  'use server'

  await setContextHolding(holdingId)
  redirect('/dashboard')
}

export default async function EmpresasPage(_props: PageProps) {
  const user = await requireUser()
  const supabase = await createClient()

  const [empresasRes, holdingsRaw] = await Promise.all([
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
    empresas: item.empresas
      ? { id: item.empresas.id, nome: item.empresas.nome }
      : null,
  }))

  if (lista.length === 1 && holdingsRaw.length === 0) {
    await setContextEmpresa(lista[0].empresa_id)
    redirect('/pedidos')
  }


  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(79,220,255,0.16) 0%, rgba(79,220,255,0.04) 18%, transparent 42%), linear-gradient(180deg, #041328 0%, #031022 45%, #020b18 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom right, rgba(79,220,255,0.04), transparent 28%, transparent 72%, rgba(79,220,255,0.03))',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '-120px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'rgba(79,220,255,0.08)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 560,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              position: 'relative',
              padding: '12px 18px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(79,220,255,0.16)',
              boxShadow:
                '0 0 0 1px rgba(79,220,255,0.05) inset, 0 18px 60px rgba(0,0,0,0.35), 0 0 30px rgba(79,220,255,0.08)',
              backdropFilter: 'blur(14px)',
            }}
          >
            <span
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: '#f8fbff',
                letterSpacing: '-0.05em',
              }}
            >
              Fin
              <span
                style={{
                  color: '#4fdcff',
                  textShadow: '0 0 18px rgba(79,220,255,0.35)',
                }}
              >
                tex
              </span>
            </span>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            borderRadius: 28,
            background:
              'linear-gradient(180deg, rgba(10,25,45,0.94) 0%, rgba(5,16,33,0.96) 100%)',
            border: '1px solid rgba(79,220,255,0.16)',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.03) inset, 0 24px 80px rgba(0,0,0,0.45), 0 0 40px rgba(79,220,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, rgba(79,220,255,0.08), transparent 24%, transparent 72%, rgba(79,220,255,0.04))',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: -80,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'rgba(79,220,255,0.08)',
              filter: 'blur(70px)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'relative',
              padding: '34px 30px 30px',
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 28,
                  lineHeight: 1.05,
                  fontWeight: 800,
                  letterSpacing: '-0.05em',
                  color: '#f8fbff',
                }}
              >
                Selecionar empresa
              </h1>

              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'rgba(227,236,248,0.62)',
                }}
              >
                Escolha com qual operação deseja continuar no sistema.
              </p>
            </div>

            <EmpresaSelectorTabs
              lista={lista}
              holdings={holdingsRaw}
              compact={false}
              selecionarEmpresa={selecionarEmpresa}
              selecionarHolding={selecionarHolding}
            />
          </div>
        </div>
      </div>
    </div>
  )
}