export interface Profile {
  id: string
  nome: string
  email: string
  role: 'admin' | 'operador'
  created_at: string
}

export interface Equipamento {
  id: string
  nome: string
  codigo: string
  setor: string
  status: 'ativo' | 'inativo'
  created_at: string
}

export interface Bem {
  id: string
  nome: string
  equipamento_id: string
  status: 'ativo' | 'inativo'
  created_at: string
  equipamento?: Equipamento
}

export interface Falha {
  id: string
  codigo: number
  nome: string
  categoria: string
  status: 'ativo' | 'inativo'
  created_at: string
}

export interface TipoServico {
  id: string
  nome: string
  status: 'ativo' | 'inativo'
  created_at: string
}

export interface RegistroFalha {
  id: string
  equipamento_id: string
  bem_id: string | null
  falha_id: string
  tipo_servico_id: string
  observacao: string | null
  inicio: string
  fim: string | null
  duracao: number | null
  turno: string
  status: 'em_andamento' | 'realizado'
  is_refeicao: boolean
  data: string
  user_id: string
  created_at: string
  equipamento?: Equipamento
  bem?: Bem
  falha?: Falha
  tipo_servico?: TipoServico
}
