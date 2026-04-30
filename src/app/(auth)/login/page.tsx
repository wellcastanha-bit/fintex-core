'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
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

    router.push('/empresas')
    router.refresh()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(45,207,190,0.16) 0%, rgba(45,207,190,0.04) 18%, transparent 42%), linear-gradient(180deg, #041328 0%, #031022 45%, #020b18 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        fontFamily: "'BaiJamjuree', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom right, rgba(45,207,190,0.04), transparent 28%, transparent 72%, rgba(45,207,190,0.03))',
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
          background: 'rgba(45,207,190,0.08)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 460,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          <Image
            src="/imagens/logo_foriv.png"
            alt="Fintex"
            width={160}
            height={52}
            priority
            style={{ height: 52, width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </div>

        <div
          style={{
            position: 'relative',
            borderRadius: 28,
            background:
              'linear-gradient(180deg, rgba(10,25,45,0.94) 0%, rgba(5,16,33,0.96) 100%)',
            border: '1px solid rgba(45,207,190,0.16)',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.03) inset, 0 24px 80px rgba(0,0,0,0.45), 0 0 40px rgba(45,207,190,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, rgba(45,207,190,0.08), transparent 24%, transparent 72%, rgba(45,207,190,0.04))',
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
              background: 'rgba(45,207,190,0.08)',
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
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 11px',
                  borderRadius: 999,
                  background: 'rgba(45,207,190,0.08)',
                  border: '1px solid rgba(45,207,190,0.16)',
                  color: '#2DCFBE',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  marginBottom: 18,
                }}
              >
                ACESSO SEGURO
              </div>

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
                Entrar na plataforma
              </h1>

              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'rgba(227,236,248,0.62)',
                }}
              >
                Acesse sua operação, acompanhe empresas e mantenha o controle em
                um só lugar.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    color: '#d8e7f5',
                  }}
                >
                  Email
                </label>

                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    height: 50,
                    padding: '0 16px',
                    fontSize: 14,
                    color: '#f8fbff',
                    background: 'rgba(3,10,22,0.9)',
                    border: '1px solid rgba(45,207,190,0.12)',
                    borderRadius: 14,
                    outline: 'none',
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.18)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(45,207,190,0.55)'
                    e.target.style.boxShadow =
                      '0 0 0 1px rgba(45,207,190,0.18) inset, 0 0 0 4px rgba(45,207,190,0.10), 0 8px 24px rgba(0,0,0,0.18)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(45,207,190,0.12)'
                    e.target.style.boxShadow =
                      '0 0 0 1px rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.18)'
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    color: '#d8e7f5',
                  }}
                >
                  Senha
                </label>

                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    height: 50,
                    padding: '0 16px',
                    fontSize: 14,
                    color: '#f8fbff',
                    background: 'rgba(3,10,22,0.9)',
                    border: '1px solid rgba(45,207,190,0.12)',
                    borderRadius: 14,
                    outline: 'none',
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.18)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(45,207,190,0.55)'
                    e.target.style.boxShadow =
                      '0 0 0 1px rgba(45,207,190,0.18) inset, 0 0 0 4px rgba(45,207,190,0.10), 0 8px 24px rgba(0,0,0,0.18)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(45,207,190,0.12)'
                    e.target.style.boxShadow =
                      '0 0 0 1px rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.18)'
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'rgba(120, 22, 22, 0.18)',
                    border: '1px solid rgba(248, 113, 113, 0.22)',
                    color: '#fca5a5',
                    fontSize: 13,
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
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: '0.01em',
                  boxShadow: loading
                    ? 'none'
                    : '0 12px 30px rgba(45,207,190,0.14), 0 0 18px rgba(45,207,190,0.10)',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  if (loading) return
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow =
                    '0 16px 34px rgba(45,207,190,0.18), 0 0 24px rgba(45,207,190,0.14)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = loading
                    ? 'none'
                    : '0 12px 30px rgba(45,207,190,0.14), 0 0 18px rgba(45,207,190,0.10)'
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