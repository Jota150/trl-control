'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, AlertTriangle, History, Settings2, Wrench, Cpu, LogOut, Volume2, Sun } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lancamentos', label: 'Lancamentos', icon: AlertTriangle },
  { href: '/historico', label: 'Historico', icon: History },
  { href: '/equipamentos', label: 'Equipamentos', icon: Cpu },
  { href: '/falhas', label: 'Falhas', icon: Wrench },
  { href: '/tipos-servico', label: 'Tipos de Servico', icon: Settings2 },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()

  const logout = async () => {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside style={{
      width: 208, display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0,
      background: 'var(--surface)', borderRight: '1px solid var(--border)'
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', flexShrink: 0 }}>
          <Settings2 size={16} color="var(--green)" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', lineHeight: 1.2 }}>TRL Control</p>
          <p style={{ fontSize: 11, color: 'var(--txt3)' }}>Sistema de Falhas</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
              fontSize: 13, fontWeight: active ? 600 : 400, textDecoration: 'none',
              background: active ? 'rgba(34,197,94,0.1)' : 'transparent',
              color: active ? 'var(--green)' : 'var(--txt2)',
              border: active ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent',
              transition: 'all 0.15s'
            }}>
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          {[Sun, Volume2].map((Icon, i) => (
            <button key={i} style={{ flex: 1, padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={15} />
            </button>
          ))}
        </div>
        <button onClick={logout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10,
          fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)'
        }}>
          <LogOut size={15} /> Sair
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--txt3)', marginTop: 6 }}>v1.0.0 · Centro de Controle</p>
      </div>
    </aside>
  )
}
