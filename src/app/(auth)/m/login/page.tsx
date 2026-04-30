'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MobileLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/m/empresas')
    router.refresh()
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
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(45,207,190,0.16)',
              boxShadow: '0 0 0 1px rgba(45,207,190,0.05) inset, 0 18px 60px rgba(0,0,0,0.35)',
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 800, color: '#f8fbff', letterSpacing: '-0.05em' }}>
              Fin<span style={{ color: '#2DCFBE', textShadow: '0 0 18px rgba(45,207,190,0.35)' }}>tex</span>
            </span>
          </div>
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
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '7px 11px',
                  borderRadius: 999,
                  background: 'rgba(45,207,190,0.08)',
                  border: '1px solid rgba(45,207,190,0.16)',
                  color: '#2DCFBE',
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  marginBottom: 18,
                }}
              >
                ACESSO MOBILE
              </div>

              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: '#f8fbff',
                  marginBottom: 8,
                }}
              >
                Entrar na plataforma
              </div>

              <div style={{ fontSize: 15, color: 'rgba(227,236,248,0.62)', lineHeight: 1.6 }}>
                Acesse sua operação pelo celular.
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 15, fontWeight: 700, color: '#d8e7f5' }}>Email</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    height: 50,
                    padding: '0 16px',
                    fontSize: 18,
                    color: '#f8fbff',
                    background: 'rgba(3,10,22,0.9)',
                    border: '1px solid rgba(45,207,190,0.12)',
                    borderRadius: 14,
                    outline: 'none',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.02) inset',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 15, fontWeight: 700, color: '#d8e7f5' }}>Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    height: 50,
                    padding: '0 16px',
                    fontSize: 18,
                    color: '#f8fbff',
                    background: 'rgba(3,10,22,0.9)',
                    border: '1px solid rgba(45,207,190,0.12)',
                    borderRadius: 14,
                    outline: 'none',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.02) inset',
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'rgba(120,22,22,0.18)',
                    border: '1px solid rgba(248,113,113,0.22)',
                    color: '#fca5a5',
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  height: 52,
                  marginTop: 4,
                  border: '1px solid rgba(45,207,190,0.18)',
                  borderRadius: 16,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading
                    ? 'linear-gradient(180deg, rgba(21,67,79,0.8) 0%, rgba(10,46,55,0.8) 100%)'
                    : 'linear-gradient(180deg, rgba(45,207,190,0.22) 0%, rgba(20,145,173,0.34) 100%)',
                  color: loading ? 'rgba(210,226,232,0.6)' : '#eaffff',
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: '0.01em',
                  boxShadow: loading ? 'none' : '0 12px 30px rgba(45,207,190,0.14)',
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
