'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCurrentTurno, formatDuration, formatTime } from '@/lib/utils'
import { AlertTriangle, Coffee, CheckSquare, Loader2 } from 'lucide-react'

export default function LancamentosPage() {
  const supabase = createClient()
  const turno = getCurrentTurno()
  const hoje = new Date().toISOString().split('T')[0]

  const [equipamentos, setEquipamentos] = useState<any[]>([])
  const [falhas, setFalhas] = useState<any[]>([])
  const [tiposServico, setTiposServico] = useState<any[]>([])
  const [registrosAndamento, setRegistrosAndamento] = useState<any[]>([])
  const [tick, setTick] = useState(0)

  // Form state
  const [selectedEquip, setSelectedEquip] = useState('')
  const [selectedBem, setSelectedBem] = useState('')
  const [bens, setBens] = useState<any[]>([])
  const [searchFalha, setSearchFalha] = useState('')
  const [selectedFalha, setSelectedFalha] = useState('')
  const [selectedTipoServico, setSelectedTipoServico] = useState('')
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchData = useCallback(async () => {
    const [{ data: eq }, { data: fa }, { data: ts }, { data: regs }] = await Promise.all([
      supabase.from('equipamentos').select('*').eq('status', 'ativo').order('nome'),
      supabase.from('falhas').select('*').eq('status', 'ativo').order('codigo'),
      supabase.from('tipos_servico').select('*').eq('status', 'ativo').order('nome'),
      supabase.from('registros_falhas')
        .select('*, falha:falhas(nome, codigo), equipamento:equipamentos(nome), bem:bens(nome), tipo_servico:tipos_servico(nome)')
        .eq('status', 'em_andamento')
    ])
    if (eq) setEquipamentos(eq)
    if (fa) setFalhas(fa)
    if (ts) setTiposServico(ts)
    if (regs) setRegistrosAndamento(regs)
  }, [])

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('lancamentos-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros_falhas' }, () => fetchData())
      .subscribe()
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [fetchData])

  useEffect(() => {
    if (!selectedEquip) { setBens([]); setSelectedBem(''); return }
    supabase.from('bens').select('*').eq('equipamento_id', selectedEquip).eq('status', 'ativo').order('nome')
      .then(({ data }) => { if (data) setBens(data); setSelectedBem('') })
  }, [selectedEquip])

  useEffect(() => {
    if (!selectedFalha) return
    const falha = falhas.find(f => f.id === selectedFalha)
    if (falha) {
      const ts = tiposServico.find(t => t.nome.toLowerCase() === falha.categoria.toLowerCase())
      if (ts) setSelectedTipoServico(ts.id)
    }
  }, [selectedFalha, falhas, tiposServico])

  const falhasFiltradas = falhas.filter(f =>
    f.nome.toLowerCase().includes(searchFalha.toLowerCase()) ||
    String(f.codigo).includes(searchFalha) ||
    f.categoria.toLowerCase().includes(searchFalha.toLowerCase())
  )

  const equipHasFalhaAberta = (equipId: string) =>
    registrosAndamento.some(r => r.equipamento_id === equipId && !r.is_refeicao)

  const handleIniciarFalha = async () => {
    setError(''); setSuccess('')
    if (!selectedEquip || !selectedFalha || !selectedTipoServico) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    if (equipHasFalhaAberta(selectedEquip)) {
      setError('Este equipamento já possui uma falha aberta. Finalize-a primeiro.')
      return
    }
    const falha = falhas.find(f => f.id === selectedFalha)
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('registros_falhas').insert({
      equipamento_id: selectedEquip,
      bem_id: selectedBem || null,
      falha_id: selectedFalha,
      tipo_servico_id: selectedTipoServico,
      observacao: observacao || null,
      inicio: new Date().toISOString(),
      turno,
      status: 'em_andamento',
      is_refeicao: falha?.categoria === 'Refeicao',
      data: hoje,
      user_id: user?.id || null,
    })
    setLoading(false)
    if (err) { setError('Erro ao registrar falha: ' + err.message); return }
    setSuccess('Falha iniciada com sucesso!')
    setSelectedEquip(''); setSelectedBem(''); setSelectedFalha(''); setSearchFalha('')
    setSelectedTipoServico(''); setObservacao('')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleIniciarRefeicao = async () => {
    const falhaRefeicao = falhas.find(f => f.categoria === 'Refeicao' || f.codigo === 52)
    const tipoOp = tiposServico.find(t => t.nome === 'Operacao')
    if (!falhaRefeicao || !tipoOp) return
    const { data: { user } } = await supabase.auth.getUser()
    for (const eq of equipamentos) {
      await supabase.from('registros_falhas').insert({
        equipamento_id: eq.id,
        bem_id: null,
        falha_id: falhaRefeicao.id,
        tipo_servico_id: tipoOp.id,
        inicio: new Date().toISOString(),
        turno,
        status: 'em_andamento',
        is_refeicao: true,
        data: hoje,
        user_id: user?.id || null,
      })
    }
    setSuccess('Refeição iniciada para todos os equipamentos!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleFinalizar = async (id: string) => {
    const fim = new Date().toISOString()
    const reg = registrosAndamento.find(r => r.id === id)
    if (!reg) return
    const duracao = Math.floor((new Date(fim).getTime() - new Date(reg.inicio).getTime()) / 1000)
    await supabase.from('registros_falhas').update({ fim, duracao, status: 'realizado' }).eq('id', id)
  }

  const getEquipColor = (equipId: string) => {
    const temFalha = equipHasFalhaAberta(equipId)
    if (temFalha) return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', dot: '#ef4444', text: '#ef4444' }
    const temRefeicao = registrosAndamento.some(r => r.equipamento_id === equipId && r.is_refeicao)
    if (temRefeicao) return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', dot: '#f59e0b', text: '#f59e0b' }
    return { bg: 'rgba(34,197,94,0.05)', border: 'rgba(34,197,94,0.2)', dot: '#22c55e', text: '#22c55e' }
  }

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Lancamento de Falhas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Registre paradas e falhas dos equipamentos</p>
        </div>
        <div className="px-3 py-1.5 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Turno </span>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{turno}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Equipment status */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Status Equipamentos</h2>
          {equipamentos.map(eq => {
            const c = getEquipColor(eq.id)
            return (
              <button
                key={eq.id}
                onClick={() => setSelectedEquip(eq.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                style={{ background: selectedEquip === eq.id ? 'rgba(34,197,94,0.1)' : c.bg, border: `1px solid ${selectedEquip === eq.id ? 'rgba(34,197,94,0.4)' : c.border}` }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.dot }} />
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{eq.nome}</span>
              </button>
            )
          })}
        </div>

        {/* Right: Form */}
        <div className="col-span-2 space-y-4">
          {/* Refeição */}
          <div className="flex items-center justify-between px-5 py-4 rounded-2xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex items-center gap-3">
              <Coffee size={18} style={{ color: 'var(--accent-orange)' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Refeição</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Inicia parada de 1 hora em todos os equipamentos</p>
              </div>
            </div>
            <button
              onClick={handleIniciarRefeicao}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ background: 'var(--accent-orange)', color: '#000' }}
            >
              <Coffee size={14} /> Iniciar Refeição
            </button>
          </div>

          {/* Nova Falha Form */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: 'var(--accent-orange)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Lancar Nova Falha</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Equipamento</label>
                <select value={selectedEquip} onChange={e => setSelectedEquip(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                  <option value="">Selecione o equipamento</option>
                  {equipamentos.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.nome}{equipHasFalhaAberta(eq.id) ? ' (Em falha)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Bem</label>
                <select value={selectedBem} onChange={e => setSelectedBem(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
                  disabled={!selectedEquip}>
                  <option value="">Selecione o bem</option>
                  {bens.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Buscar Falha</label>
              <input
                value={searchFalha} onChange={e => { setSearchFalha(e.target.value); setSelectedFalha('') }}
                placeholder="Buscar por código, nome ou categoria..."
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
              />
              {searchFalha && (
                <div className="mt-1 rounded-xl overflow-hidden max-h-48 overflow-y-auto" style={{ background: 'var(--bg)', border: '1px solid var(--border-light)' }}>
                  {falhasFiltradas.slice(0, 20).map(f => (
                    <button key={f.id} onClick={() => { setSelectedFalha(f.id); setSearchFalha(`${f.codigo} - ${f.nome}`) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center justify-between"
                      style={{ color: 'var(--text-primary)' }}>
                      <span>{f.codigo} - {f.nome}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>{f.categoria}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Falha</label>
                <select value={selectedFalha} onChange={e => setSelectedFalha(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                  <option value="">Selecione a falha</option>
                  {falhas.map(f => <option key={f.id} value={f.id}>{f.codigo} - {f.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tipo de Servico</label>
                <select value={selectedTipoServico} onChange={e => setSelectedTipoServico(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                  <option value="">Selecione o tipo</option>
                  {tiposServico.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Observação</label>
              <textarea value={observacao} onChange={e => setObservacao(e.target.value)}
                placeholder="Observações adicionais..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
              />
            </div>

            {error && <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{error}</p>}
            {success && <p className="text-sm" style={{ color: 'var(--accent)' }}>{success}</p>}

            <button onClick={handleIniciarFalha} disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--accent-red)', color: '#fff', opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
              Iniciar Falha
            </button>
          </div>

          {/* Falhas em andamento */}
          {registrosAndamento.filter(r => !r.is_refeicao).length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} style={{ color: 'var(--accent-orange)' }} />
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Falhas em Andamento ({registrosAndamento.filter(r => !r.is_refeicao).length})
                </h3>
              </div>
              <div className="space-y-2">
                {registrosAndamento.filter(r => !r.is_refeicao).map(r => (
                  <div key={r.id} className="flex items-center justify-between px-3 py-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: 'var(--accent-red)' }}>{r.equipamento?.nome}</span>
                        {r.bem && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' }}>{r.bem.nome}</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {r.falha?.codigo} - {r.falha?.nome}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Início: {formatTime(r.inicio)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold timer-pulse" style={{ color: 'var(--accent-red)' }}>
                        {formatDuration(Math.floor((Date.now() - new Date(r.inicio).getTime()) / 1000) + tick - tick)}
                      </span>
                      <button onClick={() => handleFinalizar(r.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: 'var(--accent)', color: '#000' }}>
                        <CheckSquare size={12} /> Finalizar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
