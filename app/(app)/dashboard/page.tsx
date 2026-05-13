'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDuration, getCurrentTurno } from '@/lib/utils'
import { AlertTriangle, Activity, Clock, TrendingDown, TrendingUp, Timer, Cog } from 'lucide-react'

export default function DashboardPage() {
  const supabase = createClient()
  const turno = getCurrentTurno()
  const hoje = new Date().toISOString().split('T')[0]
  const dataDisplay = new Date().toLocaleDateString('pt-BR')

  const [equipStatus, setEquipStatus] = useState<any[]>([])
  const [falhasHoje, setFalhasHoje] = useState(0)
  const [emAndamento, setEmAndamento] = useState(0)
  const [tempoParado, setTempoParado] = useState(0)
  const [mttr, setMttr] = useState(0)
  const [mtbf] = useState(8 * 3600)
  const [tempoMedio, setTempoMedio] = useState(0)
  const [rankingFalhas, setRankingFalhas] = useState<any[]>([])
  const [equipParadas, setEquipParadas] = useState<any[]>([])
  const [tick, setTick] = useState(0)

  const fetchAll = useCallback(async () => {
    const { data: equips } = await supabase.from('equipamentos').select('*').eq('status', 'ativo')
    const { data: regs } = await supabase
      .from('registros_falhas')
      .select('*, falha:falhas(nome, codigo), equipamento:equipamentos(nome, setor)')
      .eq('data', hoje)
      .eq('turno', turno)

    if (!equips || !regs) return

    const regsSemRefeicao = regs.filter((r: any) => !r.is_refeicao)
    const andamento = regsSemRefeicao.filter((r: any) => r.status === 'em_andamento')
    const realizados = regsSemRefeicao.filter((r: any) => r.status === 'realizado' && r.duracao)

    const statusMap = equips.map((eq: any) => {
      const falhaAtiva = andamento.find((r: any) => r.equipamento_id === eq.id)
      return {
        id: eq.id,
        nome: eq.nome,
        setor: eq.setor,
        operacional: !falhaAtiva,
        falhaAtualNome: falhaAtiva ? `${falhaAtiva.falha?.codigo} - ${falhaAtiva.falha?.nome}` : null,
        falhaInicio: falhaAtiva ? new Date(falhaAtiva.inicio).getTime() : null,
      }
    })
    setEquipStatus(statusMap)
    setFalhasHoje(regsSemRefeicao.length)
    setEmAndamento(andamento.length)

    const totalParado = realizados.reduce((acc: number, r: any) => acc + (r.duracao || 0), 0)
    setTempoParado(totalParado)
    setMttr(realizados.length > 0 ? Math.floor(totalParado / realizados.length) : 0)
    setTempoMedio(regsSemRefeicao.length > 0 ? Math.floor(totalParado / regsSemRefeicao.length) : 0)

    const falhaCount: Record<string, any> = {}
    regsSemRefeicao.forEach((r: any) => {
      const key = r.falha_id
      if (!falhaCount[key]) falhaCount[key] = { nome: r.falha?.nome || '', codigo: r.falha?.codigo || 0, count: 0 }
      falhaCount[key].count++
    })
    setRankingFalhas(Object.values(falhaCount).sort((a: any, b: any) => b.count - a.count).slice(0, 5))

    const equipCount: Record<string, any> = {}
    regsSemRefeicao.forEach((r: any) => {
      const key = r.equipamento_id
      if (!equipCount[key]) equipCount[key] = { nome: r.equipamento?.nome || '', setor: r.equipamento?.setor || '', count: 0 }
      equipCount[key].count++
    })
    setEquipParadas(Object.values(equipCount).sort((a: any, b: any) => b.count - a.count).slice(0, 5))
  }, [hoje, turno])

  useEffect(() => {
    fetchAll()
    const channel = supabase
      .channel('dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros_falhas' }, () => fetchAll())
      .subscribe()
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [fetchAll])

  const metrics = [
    { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', value: falhasHoje, label: 'Falhas Hoje', mono: false },
    { icon: Activity, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', value: emAndamento, label: 'Em Andamento', mono: false },
    { icon: Clock, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', value: formatDuration(tempoParado), label: 'Tempo Parado', mono: true },
    { icon: TrendingDown, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', value: formatDuration(mttr), label: 'MTTR', sub: 'Tempo Médio de Reparo', mono: true },
    { icon: TrendingUp, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', value: formatDuration(mtbf), label: 'MTBF', sub: 'Tempo Médio Entre Falhas', mono: true },
    { icon: Timer, color: '#a855f7', bg: 'rgba(168,85,247,0.1)', value: formatDuration(tempoMedio), label: 'Tempo Médio/Falha', mono: true },
  ]

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Centro de Controle Operacional · Transelevadores</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Turno Atual</p>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{turno}</p>
          </div>
          <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Data</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{dataDisplay}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Status dos Equipamentos</h2>
        <div className="grid grid-cols-3 gap-3">
          {equipStatus.map(eq => (
            <div key={eq.id} className="rounded-2xl p-4" style={{ background: eq.operacional ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${eq.operacional ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: eq.operacional ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}>
                    <Cog size={20} style={{ color: eq.operacional ? 'var(--accent)' : 'var(--accent-red)' }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{eq.nome}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{eq.setor}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: eq.operacional ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: eq.operacional ? 'var(--accent)' : 'var(--accent-red)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: eq.operacional ? 'var(--accent)' : 'var(--accent-red)' }} />
                  {eq.operacional ? 'Operando' : 'Parado'}
                </span>
              </div>
              {!eq.operacional && eq.falhaAtualNome && (
                <div className="mt-3 px-3 py-2 rounded-xl flex items-center justify-between" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <p className="text-xs truncate max-w-[60%]" style={{ color: 'var(--accent-red)' }}>{eq.falhaAtualNome}</p>
                  <p className="text-sm font-mono font-bold timer-pulse" style={{ color: 'var(--accent-red)' }}>
                    {eq.falhaInicio ? formatDuration(Math.floor((Date.now() - eq.falhaInicio) / 1000)) : '00:00:00'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {metrics.map(({ icon: Icon, color, bg, value, label, sub, mono }: any) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={16} style={{ color }} />
            </div>
            <p className={`text-xl font-bold ${mono ? 'font-mono' : ''}`} style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
            {sub && <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} style={{ color: 'var(--accent-red)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Ranking de Falhas</h3>
          </div>
          {rankingFalhas.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Nenhuma falha registrada hoje</p>
          ) : rankingFalhas.map((f, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-1.5" style={{ background: 'var(--bg)' }}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold w-5" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{f.nome}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Código: {f.codigo}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' }}>{f.count}x</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} style={{ color: 'var(--accent-orange)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Equipamentos com Mais Paradas</h3>
          </div>
          {equipParadas.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Nenhuma parada registrada hoje</p>
          ) : equipParadas.map((eq, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-1.5" style={{ background: 'var(--bg)' }}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold w-5" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{eq.nome}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{eq.setor}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-orange)' }}>{eq.count} falhas</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
