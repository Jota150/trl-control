'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Save, Wrench } from 'lucide-react'

const CATEGORIAS = ['Sistema','Mecanica','Eletrica','Eletronica','Automacao','Operacao','Refeicao']

export default function FalhasPage() {
  const supabase = createClient()
  const [falhas, setFalhas] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [modal, setModal] = useState<any>(null)
  const [form, setForm] = useState({ codigo: '', nome: '', categoria: 'Sistema', status: 'ativo' })
  const [loading, setLoading] = useState(false)

  const fetchFalhas = useCallback(async () => {
    const { data } = await supabase.from('falhas').select('*').order('codigo')
    if (data) setFalhas(data)
  }, [])

  useEffect(() => { fetchFalhas() }, [fetchFalhas])

  const openModal = (falha?: any) => {
    setForm(falha ? { codigo: String(falha.codigo), nome: falha.nome, categoria: falha.categoria, status: falha.status } : { codigo: '', nome: '', categoria: 'Sistema', status: 'ativo' })
    setModal(falha || true)
  }

  const save = async () => {
    setLoading(true)
    const payload = { ...form, codigo: Number(form.codigo) }
    if (modal !== true && modal?.id) {
      await supabase.from('falhas').update(payload).eq('id', modal.id)
    } else {
      await supabase.from('falhas').insert(payload)
    }
    setLoading(false); setModal(null); fetchFalhas()
  }

  const deleteFalha = async (id: string) => {
    if (!confirm('Excluir esta falha?')) return
    await supabase.from('falhas').delete().eq('id', id)
    fetchFalhas()
  }

  const catColors: Record<string, { bg: string; color: string }> = {
    Sistema: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
    Mecanica: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    Eletrica: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    Eletronica: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
    Automacao: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    Operacao: { bg: 'rgba(6,182,212,0.15)', color: '#06b6d4' },
    Refeicao: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  }

  const filtered = falhas.filter(f => {
    const matchSearch = !search || f.nome.toLowerCase().includes(search.toLowerCase()) || String(f.codigo).includes(search) || f.categoria.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || f.categoria === filterCat
    return matchSearch && matchCat
  })

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Cadastro de Falhas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Gerencie os tipos de falhas do sistema</p>
        </div>
        <button onClick={() => openModal()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, fontWeight: 600, fontSize: 14, background: 'var(--text-primary)', color: 'var(--bg)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Plus size={16} /> Nova Falha
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código, nome ou categoria..."
          style={{ flex: 1, minWidth: 200, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)' }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
          <option value="">Todas Categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <Wrench size={16} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Lista de Falhas ({filtered.length})</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Código','Nome','Categoria','Status','Ações'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => {
                const cat = catColors[f.categoria] || { bg: 'rgba(100,116,139,0.15)', color: '#64748b' }
                return (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>{f.codigo}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-primary)' }}>{f.nome}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: cat.bg, color: cat.color }}>{f.categoria}</span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: f.status === 'ativo' ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)', color: f.status === 'ativo' ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {f.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openModal(f)} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Pencil size={13} /></button>
                        <button onClick={() => deleteFalha(f.id)} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
          <div style={{ width: '100%', maxWidth: 420, borderRadius: 20, padding: 24, background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{modal !== true && modal?.id ? 'Editar Falha' : 'Nova Falha'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Código</label>
                <input type="number" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Nome</label>
                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Categoria</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 500, background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={save} disabled={loading} style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Save size={14} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
