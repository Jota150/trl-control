'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Save, Cpu, ChevronDown, ChevronUp, Package } from 'lucide-react'

export default function EquipamentosPage() {
  const supabase = createClient()
  const [equipamentos, setEquipamentos] = useState<any[]>([])
  const [bens, setBens] = useState<Record<string, any[]>>({})
  const [expandedEquip, setExpandedEquip] = useState<string | null>(null)
  const [modal, setModal] = useState<{ type: 'equip' | 'bem'; data?: any; equipId?: string } | null>(null)
  const [form, setForm] = useState({ nome: '', codigo: '', setor: 'Expedição', status: 'ativo' })
  const [formBem, setFormBem] = useState({ nome: '', status: 'ativo' })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchEquipamentos = useCallback(async () => {
    const { data } = await supabase.from('equipamentos').select('*').order('nome')
    if (data) setEquipamentos(data)
  }, [])

  const fetchBens = async (equipId: string) => {
    const { data } = await supabase.from('bens').select('*').eq('equipamento_id', equipId).order('nome')
    if (data) setBens(prev => ({ ...prev, [equipId]: data }))
  }

  useEffect(() => { fetchEquipamentos() }, [fetchEquipamentos])

  const toggleExpand = (id: string) => {
    if (expandedEquip === id) { setExpandedEquip(null); return }
    setExpandedEquip(id)
    fetchBens(id)
  }

  const openEquipModal = (equip?: any) => {
    setForm(equip ? { nome: equip.nome, codigo: equip.codigo, setor: equip.setor, status: equip.status } : { nome: '', codigo: '', setor: 'Expedição', status: 'ativo' })
    setModal({ type: 'equip', data: equip })
  }

  const openBemModal = (equipId: string, bem?: any) => {
    setFormBem(bem ? { nome: bem.nome, status: bem.status } : { nome: '', status: 'ativo' })
    setModal({ type: 'bem', data: bem, equipId })
  }

  const saveEquip = async () => {
    setLoading(true)
    if (modal?.data) {
      await supabase.from('equipamentos').update(form).eq('id', modal.data.id)
    } else {
      await supabase.from('equipamentos').insert(form)
    }
    setLoading(false); setModal(null); fetchEquipamentos()
  }

  const saveBem = async () => {
    if (!modal?.equipId) return
    setLoading(true)
    if (modal?.data) {
      await supabase.from('bens').update(formBem).eq('id', modal.data.id)
    } else {
      await supabase.from('bens').insert({ ...formBem, equipamento_id: modal.equipId })
    }
    setLoading(false); setModal(null); fetchBens(modal.equipId)
  }

  const deleteEquip = async (id: string) => {
    if (!confirm('Excluir este equipamento? Todos os bens vinculados também serão removidos.')) return
    await supabase.from('equipamentos').delete().eq('id', id)
    fetchEquipamentos()
  }

  const deleteBem = async (id: string, equipId: string) => {
    if (!confirm('Excluir este bem?')) return
    await supabase.from('bens').delete().eq('id', id)
    fetchBens(equipId)
  }

  const filtered = equipamentos.filter(eq =>
    eq.nome.toLowerCase().includes(search.toLowerCase()) ||
    eq.codigo.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Equipamentos</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Gerencie os equipamentos e seus bens</p>
        </div>
        <button onClick={() => openEquipModal()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm" style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}>
          <Plus size={16} /> Novo Equipamento
        </button>
      </div>

      <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar equipamentos..."
          className="w-full bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }} />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <Cpu size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Lista de Equipamentos ({filtered.length})</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nome','Código','Setor','Status','Ações'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(eq => (
              <>
                <tr key={eq.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--text-primary)' }}>{eq.nome}</td>
                  <td className="px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>{eq.codigo}</td>
                  <td className="px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>{eq.setor}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: eq.status === 'ativo' ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)', color: eq.status === 'ativo' ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {eq.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleExpand(eq.id)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--accent-blue)' }}>
                        {expandedEquip === eq.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => openEquipModal(eq)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteEquip(eq.id)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--accent-red)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedEquip === eq.id && (
                  <tr key={`bens-${eq.id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td colSpan={5} className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Package size={14} style={{ color: 'var(--accent-blue)' }} />
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            Bens de {eq.nome} ({(bens[eq.id] || []).length})
                          </span>
                        </div>
                        <button onClick={() => openBemModal(eq.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--accent-blue)', color: '#fff' }}>
                          <Plus size={12} /> Adicionar Bem
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {(bens[eq.id] || []).map(b => (
                          <div key={b.id} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{b.nome}</span>
                            <div className="flex gap-1">
                              <button onClick={() => openBemModal(eq.id, b)} className="p-1 rounded hover:bg-white/10" style={{ color: 'var(--text-muted)' }}><Pencil size={11} /></button>
                              <button onClick={() => deleteBem(b.id, eq.id)} className="p-1 rounded hover:bg-white/10" style={{ color: 'var(--accent-red)' }}><Trash2 size={11} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {modal.type === 'equip' ? (modal.data ? 'Editar Equipamento' : 'Novo Equipamento') : (modal.data ? 'Editar Bem' : 'Novo Bem')}
              </h3>
              <button onClick={() => setModal(null)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            {modal.type === 'equip' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Nome</label>
                  <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Código</label>
                  <input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Setor</label>
                  <input value={form.setor} onChange={e => setForm({ ...form, setor: e.target.value })}
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
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Nome do Bem</label>
                  <input value={formBem.nome} onChange={e => setFormBem({ ...formBem, nome: e.target.value })}
                    placeholder="Ex: TC18, Mesa Entrada..."
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
                  <select value={formBem.status} onChange={e => setFormBem({ ...formBem, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>Cancelar</button>
              <button onClick={modal.type === 'equip' ? saveEquip : saveBem} disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: 'var(--accent)', color: '#000' }}>
                <Save size={14} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
