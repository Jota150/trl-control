'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Save, Settings2 } from 'lucide-react'

export default function TiposServicoPage() {
  const supabase = createClient()
  const [tipos, setTipos] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<any>(null)
  const [form, setForm] = useState({ nome: '', status: 'ativo' })
  const [loading, setLoading] = useState(false)

  const fetchTipos = useCallback(async () => {
    const { data } = await supabase.from('tipos_servico').select('*').order('nome')
    if (data) setTipos(data)
  }, [])

  useEffect(() => { fetchTipos() }, [fetchTipos])

  const openModal = (tipo?: any) => {
    setForm(tipo ? { nome: tipo.nome, status: tipo.status } : { nome: '', status: 'ativo' })
    setModal(tipo || true)
  }

  const save = async () => {
    setLoading(true)
    if (modal !== true && modal?.id) {
      await supabase.from('tipos_servico').update(form).eq('id', modal.id)
    } else {
      await supabase.from('tipos_servico').insert(form)
    }
    setLoading(false); setModal(null); fetchTipos()
  }

  const deleteTipo = async (id: string) => {
    if (!confirm('Excluir este tipo de serviço?')) return
    await supabase.from('tipos_servico').delete().eq('id', id)
    fetchTipos()
  }

  const filtered = tipos.filter(t => !search || t.nome.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Tipos de Servico</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Gerencie os tipos de serviço responsáveis pelas manutenções</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm" style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}>
          <Plus size={16} /> Novo Tipo de Servico
        </button>
      </div>

      <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tipos de serviço..."
          className="w-full bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }} />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <Settings2 size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Lista de Tipos de Servico ({filtered.length})</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nome','Status','Ações'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-white/[0.02]">
                <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{t.nome}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: t.status === 'ativo' ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)', color: t.status === 'ativo' ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {t.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openModal(t)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-muted)' }}><Pencil size={13} /></button>
                    <button onClick={() => deleteTipo(t.id)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: 'var(--accent-red)' }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{modal !== true && modal?.id ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}</h3>
              <button onClick={() => setModal(null)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Nome</label>
                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
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
