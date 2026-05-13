'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import { History, FileSpreadsheet, FileText, Pencil, Trash2, X, Save } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function HistoricoPage() {
  const supabase = createClient()
  const [registros, setRegistros] = useState<any[]>([])
  const [equipamentos, setEquipamentos] = useState<any[]>([])
  const [falhas, setFalhas] = useState<any[]>([])
  const [tiposServico, setTiposServico] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterData, setFilterData] = useState('')
  const [filterEquip, setFilterEquip] = useState('')
  const [filterFalha, setFilterFalha] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [editando, setEditando] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    let q = supabase.from('registros_falhas')
      .select('*, equipamento:equipamentos(nome, setor), bem:bens(nome), falha:falhas(nome, codigo), tipo_servico:tipos_servico(nome)')
      .order('inicio', { ascending: false })

    if (filterData) q = q.eq('data', filterData)
    if (filterEquip) q = q.eq('equipamento_id', filterEquip)
    if (filterFalha) q = q.eq('falha_id', filterFalha)
    if (filterStatus) q = q.eq('status', filterStatus)

    const { data } = await q
    if (data) setRegistros(data)
  }, [filterData, filterEquip, filterFalha, filterStatus])

  useEffect(() => {
    supabase.from('equipamentos').select('*').eq('status', 'ativo').order('nome').then(({ data }) => { if (data) setEquipamentos(data) })
    supabase.from('falhas').select('*').eq('status', 'ativo').order('codigo').then(({ data }) => { if (data) setFalhas(data) })
    supabase.from('tipos_servico').select('*').eq('status', 'ativo').order('nome').then(({ data }) => { if (data) setTiposServico(data) })
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const channel = supabase.channel('historico-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros_falhas' }, () => fetchData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchData])

  const registrosFiltrados = registros.filter(r => {
    if (!search) return true
    const s = search.toLowerCase()
    return r.equipamento?.nome?.toLowerCase().includes(s) ||
      r.falha?.nome?.toLowerCase().includes(s) ||
      String(r.falha?.codigo).includes(s) ||
      r.tipo_servico?.nome?.toLowerCase().includes(s)
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este registro?')) return
    await supabase.from('registros_falhas').delete().eq('id', id)
    fetchData()
  }

  const handleSaveEdit = async () => {
    if (!editando) return
    setLoading(true)
    const duracao = editando.fim && editando.inicio
      ? Math.floor((new Date(editando.fim).getTime() - new Date(editando.inicio).getTime()) / 1000)
      : null
    await supabase.from('registros_falhas').update({
      equipamento_id: editando.equipamento_id,
      falha_id: editando.falha_id,
      tipo_servico_id: editando.tipo_servico_id,
      inicio: editando.inicio,
      fim: editando.fim || null,
      duracao,
      status: editando.fim ? 'realizado' : 'em_andamento',
      observacao: editando.observacao || null,
    }).eq('id', editando.id)
    setLoading(false)
    setEditando(null)
    fetchData()
  }

  const exportExcel = () => {
    const data = registrosFiltrados.map(r => ({
      Data: formatDate(r.data),
      Equipamento: r.equipamento?.nome || '',
      Bem: r.bem?.nome || '',
      Falha: `${r.falha?.codigo} - ${r.falha?.nome}`,
      'Tipo Serviço': r.tipo_servico?.nome || '',
      Início: formatTime(r.inicio),
      Fim: r.fim ? formatTime(r.fim) : '',
      Duração: r.duracao ? formatDuration(r.duracao) : '',
      Turno: r.turno,
      Status: r.status === 'realizado' ? 'Realizado' : 'Em Andamento',
      Observação: r.observacao || '',
      Refeição: r.is_refeicao ? 'Sim' : 'Não',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico')
    XLSX.writeFile(wb, `historico_falhas_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`)
  }

  const statusLabel = (s: string, isRef: boolean) => {
    if (isRef) return { label: 'Refeição', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
    if (s === 'realizado') return { label: 'Realizado', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' }
    return { label: 'Em Andamento', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' }
  }

  const toLocalDatetime = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Historico de Falhas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Visualize e edite os registros de paradas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <FileSpreadsheet size={15} /> Excel
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
          className="flex-1 min-w-40 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
        <input type="date" value={filterData} onChange={e => setFilterData(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
        <select value={filterEquip} onChange={e => setFilterEquip(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
          <option value="">Todos Equipamentos</option>
          {equipamentos.map(eq => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
        </select>
        <select value={filterFalha} onChange={e => setFilterFalha(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
          <option value="">Todas Falhas</option>
          {falhas.map(f => <option key={f.id} value={f.id}>{f.codigo} - {f.nome}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
          <option value="">Todos Status</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="realizado">Realizado</option>
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <History size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Registros ({registrosFiltrados.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Data','Equipamento','Bem','Falha','Tipo Serviço','Início','Fim','Duração','Turno','Status','Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum registro encontrado</td></tr>
              ) : registrosFiltrados.map(r => {
                const st = statusLabel(r.status, r.is_refeicao)
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(r.data)}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{r.equipamento?.nome}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{r.bem?.nome || '-'}</td>
                    <td className="px-4 py-3 text-xs max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>
                      <span className="truncate block">{r.falha?.codigo} - {r.falha?.nome}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{r.tipo_servico?.nome}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{formatTime(r.inicio)}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{r.fim ? formatTime(r.fim) : '-'}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{r.duracao ? formatDuration(r.duracao) : '-'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{r.turno}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditando({ ...r, inicio: toLocalDatetime(r.inicio), fim: r.fim ? toLocalDatetime(r.fim) : '' })}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--accent-red)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Editar Registro de Falha</h3>
              <button onClick={() => setEditando(null)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Equipamento</label>
                <select value={editando.equipamento_id} onChange={e => setEditando({ ...editando, equipamento_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                  {equipamentos.map(eq => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Falha</label>
                <select value={editando.falha_id} onChange={e => setEditando({ ...editando, falha_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                  {falhas.map(f => <option key={f.id} value={f.id}>{f.codigo} - {f.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Tipo de Serviço</label>
                <select value={editando.tipo_servico_id} onChange={e => setEditando({ ...editando, tipo_servico_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                  {tiposServico.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Hora Início</label>
                  <input type="datetime-local" value={editando.inicio} onChange={e => setEditando({ ...editando, inicio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Hora Fim</label>
                  <input type="datetime-local" value={editando.fim || ''} onChange={e => setEditando({ ...editando, fim: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Observação</label>
                <textarea value={editando.observacao || ''} onChange={e => setEditando({ ...editando, observacao: e.target.value })}
                  rows={2} className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditando(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>Cancelar</button>
              <button onClick={handleSaveEdit} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: 'var(--accent)', color: '#000' }}>
                <Save size={14} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
