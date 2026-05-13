'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings2, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou senha inválidos.')
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 360, padding: '0 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', marginBottom: 16 }}>
            <Settings2 size={24} color="#22c55e" />
          </div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700 }}>TRL Control</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sistema de Falhas</p>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Entrar</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Acesse o centro de controle operacional</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>Senha</label>
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => setShow(!show)}
                style={{ position: 'absolute', right: 12, bottom: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 14, border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
            <button type="submit" disabled={loading}
              style={{ padding: '12px', borderRadius: 10, background: '#22c55e', color: '#000', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>v1.0.0 · Centro de Controle</p>
      </div>
    </div>
  )
}
