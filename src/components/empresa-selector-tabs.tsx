'use client'

import { useState } from 'react'
import { useDelayedLoading } from '@/lib/hooks/use-delayed-loading'

type View = 'empresas' | 'holdings'

type Acesso = {
  empresa_id: string
  cargo: string
  empresas: { id: string; nome: string } | null
}

type Holding = { id: string; nome: string; cargo: string }

type Props = {
  lista: Acesso[]
  holdings: Holding[]
  compact: boolean
  selecionarEmpresa: (id: string) => Promise<void>
  selecionarHolding: (id: string) => Promise<void>
}

export default function EmpresaSelectorTabs({
  lista,
  holdings,
  compact,
  selecionarEmpresa,
  selecionarHolding,
}: Props) {
  const temEmpresas = lista.length > 0
  const temHoldings = holdings.length > 0
  const showTabs = temEmpresas && temHoldings

  const [view, setView] = useState<View>('empresas')
  const [pressed, setPressed] = useState<string | null>(null)
  const { startLoading } = useDelayedLoading()

  const fs = compact ? 15 : 16
  const gap = compact ? 10 : 12
  const badgePad = compact ? '5px 10px' : '6px 12px'
  const badgeFs = compact ? 11 : 12

  if (!temEmpresas && !temHoldings) {
    return (
      <div
        style={{
          padding: '18px 16px',
          borderRadius: 16,
          background: 'rgba(3,10,22,0.86)',
          border: '1px solid rgba(45,207,190,0.10)',
          color: 'rgba(227,236,248,0.72)',
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        Nenhuma empresa encontrada para o seu usuário.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {showTabs && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: 4,
            borderRadius: 16,
            background: 'rgba(2,11,24,0.55)',
            border: '1px solid rgba(45,207,190,0.12)',
          }}
        >
          {(['empresas', 'holdings'] as View[]).map((v) => {
            const active = view === v
            const isHolding = v === 'holdings'
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 12,
                  border: active ? '1px solid rgba(45,207,190,0.35)' : '1px solid transparent',
                  background: active ? 'rgba(45,207,190,0.12)' : 'transparent',
                  color: active ? '#2DCFBE' : 'rgba(227,236,248,0.46)',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 160ms ease',
                }}
              >
                {v === 'empresas' ? 'Empresas' : 'Holdings'}
              </button>
            )
          })}
        </div>
      )}

      {(!showTabs || view === 'empresas') && temEmpresas && (
        <div style={{ display: 'flex', flexDirection: 'column', gap, height: '52dvh', overflowY: 'auto', paddingRight: 2 }}>
          {lista.map((acesso) => (
            <form
              key={acesso.empresa_id}
              action={selecionarEmpresa.bind(null, acesso.empresa_id)}
              onSubmit={() => startLoading()}
            >
              <button
                type="submit"
                onPointerDown={() => setPressed(acesso.empresa_id)}
                onPointerUp={() => setPressed(null)}
                onPointerLeave={() => setPressed(null)}
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  borderRadius: 18,
                  cursor: 'pointer',
                  border: '1px solid rgba(45,207,190,0.12)',
                  background: 'linear-gradient(180deg, rgba(3,10,22,0.92) 0%, rgba(5,16,33,0.92) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  textAlign: 'left',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.02) inset, 0 10px 28px rgba(0,0,0,0.18)',
                  transform: pressed === acesso.empresa_id ? 'scale(0.96)' : 'scale(1)',
                  opacity: pressed === acesso.empresa_id ? 0.78 : 1,
                  transition: pressed === acesso.empresa_id
                    ? 'transform 80ms ease, opacity 80ms ease'
                    : 'transform 220ms cubic-bezier(0.34,1.56,0.64,1), opacity 220ms ease',
                }}
              >
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: compact ? 4 : 6 }}>
                  <span
                    style={{
                      fontSize: fs,
                      fontWeight: 700,
                      color: '#f8fbff',
                      letterSpacing: '-0.02em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {acesso.empresas?.nome ?? 'Empresa sem nome'}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(227,236,248,0.46)', fontWeight: 600 }}>
                    Acessar ambiente {compact ? '' : 'operacional'}
                  </span>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: badgePad,
                    borderRadius: 999,
                    background: 'rgba(45,207,190,0.08)',
                    border: '1px solid rgba(45,207,190,0.14)',
                    color: '#2DCFBE',
                    fontSize: badgeFs,
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {acesso.cargo}
                </div>
              </button>
            </form>
          ))}
        </div>
      )}

      {(!showTabs || view === 'holdings') && temHoldings && (
        <div style={{ display: 'flex', flexDirection: 'column', gap, height: '52dvh', overflowY: 'auto', paddingRight: 2 }}>
          {holdings.map((h) => (
            <form
              key={h.id}
              action={selecionarHolding.bind(null, h.id)}
              onSubmit={() => startLoading()}
            >
              <button
                type="submit"
                onPointerDown={() => setPressed(h.id)}
                onPointerUp={() => setPressed(null)}
                onPointerLeave={() => setPressed(null)}
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  borderRadius: 18,
                  cursor: 'pointer',
                  border: '1px solid rgba(45,207,190,0.12)',
                  background: 'linear-gradient(180deg, rgba(3,10,22,0.92) 0%, rgba(5,16,33,0.92) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  textAlign: 'left',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.02) inset, 0 10px 28px rgba(0,0,0,0.18)',
                  transform: pressed === h.id ? 'scale(0.96)' : 'scale(1)',
                  opacity: pressed === h.id ? 0.78 : 1,
                  transition: pressed === h.id
                    ? 'transform 80ms ease, opacity 80ms ease'
                    : 'transform 220ms cubic-bezier(0.34,1.56,0.64,1), opacity 220ms ease',
                }}
              >
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: compact ? 4 : 6 }}>
                  <span
                    style={{
                      fontSize: fs,
                      fontWeight: 700,
                      color: '#f8fbff',
                      letterSpacing: '-0.02em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {h.nome}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(227,236,248,0.46)', fontWeight: 600 }}>
                    Visão consolidada
                  </span>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: badgePad,
                    borderRadius: 999,
                    background: 'rgba(45,207,190,0.08)',
                    border: '1px solid rgba(45,207,190,0.14)',
                    color: '#2DCFBE',
                    fontSize: badgeFs,
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h.cargo}
                </div>
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  )
}
