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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Cadastro de Falhas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Gerencie os tipos de falhas do sistema</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm" style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}>
          <Plus size={16} /> Nova Falha
        </button>
      </div>

      <div className="flex gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código, nome ou categoria..."
          className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-1 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
          <option value="">Todas Categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <Wrench size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Lista de Falhas ({filtered.length})</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Código','Nome','Categoria','Status','Ações'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => {
              const cat = catColors[f.categoria] || { bg: 'rgba(100,116,139,0.15)', color: '#64748b' }
              return (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>{f.codigo}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-primary)' }}>{f.nome}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: cat.bg, color: cat.color }}>{f.categoria}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: f.status === 'ativo' ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)', color: f.status === 'ativo' ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {f.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openModal(f)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-muted)' }}><Pencil size={13} /></button>
                      <button onClick={() => deleteFalha(f.id)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: 'var(--accent-red)' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{modal !== true && modal?.id ? 'Editar Falha' : 'Nova Falha'}</h3>
              <button onClick={() => setModal(null)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Código</label>
                <input type="number" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Nome</label>
                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>Cancelar</button>
              <button onClick={save} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: 'var(--accent)', color: '#000' }}>
                <Save size={14} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
