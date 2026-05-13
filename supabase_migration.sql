-- ================================================
-- TRL CONTROL - Schema Supabase
-- Execute este SQL no Supabase SQL Editor
-- ================================================

-- Enable realtime
alter publication supabase_realtime add table registros_falhas;
alter publication supabase_realtime add table equipamentos;

-- ================================================
-- TABELAS
-- ================================================

create table if not exists equipamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo text not null unique,
  setor text not null default 'Expedição',
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz default now()
);

create table if not exists bens (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  equipamento_id uuid not null references equipamentos(id) on delete cascade,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz default now()
);

create table if not exists falhas (
  id uuid primary key default gen_random_uuid(),
  codigo integer not null unique,
  nome text not null,
  categoria text not null default 'Sistema',
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  is_refeicao boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists tipos_servico (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz default now()
);

create table if not exists registros_falhas (
  id uuid primary key default gen_random_uuid(),
  equipamento_id uuid not null references equipamentos(id),
  bem_id uuid references bens(id),
  falha_id uuid not null references falhas(id),
  tipo_servico_id uuid not null references tipos_servico(id),
  observacao text,
  inicio timestamptz not null default now(),
  fim timestamptz,
  duracao integer, -- em segundos
  turno text not null,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'realizado')),
  is_refeicao boolean not null default false,
  data date not null default current_date,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  role text not null default 'operador' check (role in ('admin', 'operador')),
  created_at timestamptz default now()
);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

alter table equipamentos enable row level security;
alter table bens enable row level security;
alter table falhas enable row level security;
alter table tipos_servico enable row level security;
alter table registros_falhas enable row level security;
alter table profiles enable row level security;

-- Todos os usuários autenticados podem ler tudo
create policy "Authenticated read equipamentos" on equipamentos for select to authenticated using (true);
create policy "Authenticated write equipamentos" on equipamentos for all to authenticated using (true);

create policy "Authenticated read bens" on bens for select to authenticated using (true);
create policy "Authenticated write bens" on bens for all to authenticated using (true);

create policy "Authenticated read falhas" on falhas for select to authenticated using (true);
create policy "Authenticated write falhas" on falhas for all to authenticated using (true);

create policy "Authenticated read tipos_servico" on tipos_servico for select to authenticated using (true);
create policy "Authenticated write tipos_servico" on tipos_servico for all to authenticated using (true);

create policy "Authenticated read registros" on registros_falhas for select to authenticated using (true);
create policy "Authenticated insert registros" on registros_falhas for insert to authenticated with check (true);
create policy "Authenticated update registros" on registros_falhas for update to authenticated using (true);
create policy "Authenticated delete registros" on registros_falhas for delete to authenticated using (true);

create policy "Read own profile" on profiles for select to authenticated using (true);
create policy "Update own profile" on profiles for update to authenticated using (auth.uid() = id);

-- ================================================
-- TRIGGER: criar profile ao registrar usuário
-- ================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================
-- SEED: EQUIPAMENTOS
-- ================================================

insert into equipamentos (nome, codigo, setor) values
  ('TRL_01', 'TRL01', 'Expedição'),
  ('TRL_02', 'TRL02', 'Expedição'),
  ('CARROSSEL', 'CARR', 'Expedição')
on conflict (codigo) do nothing;

-- ================================================
-- SEED: BENS - Mesa Entrada (vinculados a TRL_01 e TRL_02 / CARROSSEL)
-- ================================================

-- Primeiro pegamos os IDs (usamos DO block para inserir dinamicamente)
do $$
declare
  v_trl01 uuid;
  v_trl02 uuid;
  v_carr  uuid;
begin
  select id into v_trl01 from equipamentos where codigo = 'TRL01';
  select id into v_trl02 from equipamentos where codigo = 'TRL02';
  select id into v_carr  from equipamentos where codigo = 'CARR';

  -- Bens Mesa Entrada (TRL_01 e TRL_02)
  insert into bens (nome, equipamento_id) values
    ('TR_02', v_trl01), ('TR_03', v_trl01), ('TM_04', v_trl01),
    ('TR_05', v_trl01), ('TR_06', v_trl01), ('TR_07', v_trl01),
    ('TM_08', v_trl01), ('TC_09', v_trl01), ('TM_10', v_trl01),
    ('TC_11', v_trl01), ('TC_12', v_trl01), ('TC_13', v_trl01),
    ('TR_14', v_trl01), ('TM_15', v_trl01), ('TC_16', v_trl01),
    ('TC_17', v_trl01), ('TC_18', v_trl01), ('TR_19', v_trl01),
    ('TM_20', v_trl01), ('TC_21', v_trl01), ('TC_22', v_trl01),
    ('TC_23', v_trl01), ('TR_24', v_trl01), ('TM_25', v_trl01),
    ('TC_26', v_trl01), ('TC_27', v_trl01), ('TC_28', v_trl01),
    ('TC_29', v_trl01), ('TM_30', v_trl01), ('TM_31', v_trl01);

  insert into bens (nome, equipamento_id) values
    ('TR_02', v_trl02), ('TR_03', v_trl02), ('TM_04', v_trl02),
    ('TR_05', v_trl02), ('TR_06', v_trl02), ('TR_07', v_trl02),
    ('TM_08', v_trl02), ('TC_09', v_trl02), ('TM_10', v_trl02),
    ('TC_11', v_trl02), ('TC_12', v_trl02), ('TC_13', v_trl02),
    ('TR_14', v_trl02), ('TM_15', v_trl02), ('TC_16', v_trl02),
    ('TC_17', v_trl02), ('TC_18', v_trl02), ('TR_19', v_trl02),
    ('TM_20', v_trl02), ('TC_21', v_trl02), ('TC_22', v_trl02),
    ('TC_23', v_trl02), ('TR_24', v_trl02), ('TM_25', v_trl02),
    ('TC_26', v_trl02), ('TC_27', v_trl02), ('TC_28', v_trl02),
    ('TC_29', v_trl02), ('TM_30', v_trl02), ('TM_31', v_trl02);

  -- Bens Mesa Saída (CARROSSEL)
  insert into bens (nome, equipamento_id) values
    ('TR_02', v_carr), ('TR_03', v_carr), ('TM_04', v_carr),
    ('TR_05', v_carr), ('TR_06', v_carr), ('TR_07', v_carr),
    ('TM_08', v_carr), ('TC_09', v_carr), ('TM_10', v_carr),
    ('TC_11', v_carr), ('TC_12', v_carr), ('TC_13', v_carr),
    ('TR_14', v_carr), ('TM_15', v_carr), ('TC_16', v_carr),
    ('TC_17', v_carr), ('TC_18', v_carr), ('TR_19', v_carr),
    ('TM_20', v_carr), ('TC_21', v_carr), ('TC_22', v_carr),
    ('TC_23', v_carr), ('TR_24', v_carr), ('TM_25', v_carr),
    ('TC_26', v_carr), ('TC_27', v_carr), ('TC_28', v_carr),
    ('TC_29', v_carr), ('TM_30', v_carr), ('TM_31', v_carr);
end;
$$;

-- ================================================
-- SEED: TIPOS DE SERVICO
-- ================================================

insert into tipos_servico (nome) values
  ('Mecanica'), ('Eletrica'), ('Eletronica'),
  ('Automacao'), ('TI'), ('Operacao')
on conflict (nome) do nothing;

-- ================================================
-- SEED: FALHAS (107 falhas)
-- ================================================

insert into falhas (codigo, nome, categoria, is_refeicao) values
(1, 'Timeout busca de home', 'Sistema', false),
(2, 'Defeito no variador do motor do transportador', 'Mecanica', false),
(3, 'Falha conexão potência', 'Eletrica', false),
(4, 'Variador Y não preparado (Inhibit o trouble)', 'Automacao', false),
(5, 'Movisafe translação excesso diferença posição', 'Automacao', false),
(6, 'Movisafe elevação Excesso diferença posição', 'Automacao', false),
(7, 'Relé segurança atuado', 'Eletrica', false),
(8, 'Erro pallet mal posicionado no rack no ciclo de carga', 'Operacao', false),
(9, 'Falha variador X', 'Automacao', false),
(10, 'Galibo carga lateral esquerda', 'Operacao', false),
(11, 'Movisafe translação fora dos limites', 'Automacao', false),
(12, 'Não definida', 'Sistema', false),
(13, 'Troca de manual - auto', 'Operacao', false),
(14, 'Relé segurança está em falha', 'Eletrica', false),
(15, 'Excesso limite permitido atrás (telêmetro)', 'Automacao', false),
(16, 'Movisafe translação detecta sobrelevação', 'Automacao', false),
(17, 'Galibo carga lateral direita', 'Operacao', false),
(18, 'Variador X não preparado (Inhibit o trouble)', 'Automacao', false),
(19, 'Defeito proteções do grupo de elevação', 'Mecanica', false),
(20, 'Posição Z não ao centro', 'Automacao', false),
(21, 'Falha variador Y', 'Automacao', false),
(22, 'Advertência - Erro Depósito', 'Sistema', false),
(23, 'Excesso limite permitido à baixo (telêmetro)', 'Automacao', false),
(24, 'Advertência - Erro Extração', 'Sistema', false),
(25, 'Galibo garfos esquerda', 'Operacao', false),
(26, 'Discrepância posição chaves', 'Automacao', false),
(27, 'Erro de seguimento encoder Z1 com motor', 'Automacao', false),
(28, 'Destino no elevação fora de limites abaixo', 'Automacao', false),
(29, 'Movisafe elevação detecta sobrelevação', 'Automacao', false),
(30, 'Falha alimentação +24Vcc no +AE', 'Eletrica', false),
(31, 'Falha alimentação +24Vcc no +CU', 'Eletrica', false),
(32, 'Falta Energia', 'Eletrica', false),
(33, 'Falta caminhão', 'Operacao', false),
(34, 'Falta sistema', 'Sistema', false),
(35, 'Ciclo carga com presença ativa', 'Operacao', false),
(36, 'Ciclo descarga sem presença a bordo', 'Operacao', false),
(37, 'Falha variador Z', 'Automacao', false),
(38, 'Motor Z1 bloqueado', 'Mecanica', false),
(39, 'Motor Z2 bloqueado', 'Mecanica', false),
(40, 'Pallet empurrado', 'Operacao', false),
(41, 'Excesso limite permitido à esquerda Z1', 'Automacao', false),
(42, 'Excesso limite permitido à direita Z1', 'Automacao', false),
(43, 'Excesso limite permitido à esquerda Z2', 'Automacao', false),
(44, 'Excesso limite permitido à direita Z2', 'Automacao', false),
(45, 'Posição pallet recolhida no espaço', 'Operacao', false),
(46, 'Relé de segurança desativado', 'Eletrica', false),
(47, 'Fabrica Parou', 'Operacao', false),
(48, 'Pallet empurrado no Carrossel', 'Operacao', false),
(49, 'Queda de Pallet no TRL_01', 'Operacao', false),
(50, 'Queda de Pallet no TRL_02', 'Operacao', false),
(51, 'Descrição Falhas', 'Sistema', false),
(52, 'Refeição', 'Operacao', true),
(53, 'Erro de seguimento encoder Z2 com motor', 'Automacao', false),
(54, 'Erro posição Z1 o Z2 não ao centro', 'Automacao', false),
(55, 'Proteção elétrica freio Z2', 'Eletrica', false),
(56, 'Proteção elétrica eixo garfos', 'Eletrica', false),
(57, 'Falta de fases alimentação armário CU', 'Eletrica', false),
(58, 'Falha ativação relé freio Z1', 'Eletrica', false),
(59, 'Falha potência corredor P0', 'Eletrica', false),
(60, 'Galibo garfos direita', 'Operacao', false),
(61, 'Defeito movimento simultaneo', 'Mecanica', false),
(62, 'Falta consentimento da mesa de carga', 'Operacao', false),
(63, 'Micro de final de curso abaixo', 'Eletrica', false),
(64, 'Defeito variador motor elevação', 'Automacao', false),
(65, 'Defeito termistáncia do motor de translação do transportador', 'Mecanica', false),
(66, 'Foi detectado o fim de curso com o Home simultaneamente', 'Automacao', false),
(67, 'Defeito disjuntor do motor do transportador', 'Eletrica', false),
(68, 'Presença de tracking com máquina em repouso', 'Automacao', false),
(69, 'Falta consentimento da mesa de descarga', 'Operacao', false),
(70, 'Galibo detectado durante o movimento de elevação', 'Operacao', false),
(71, 'Defeito de presença', 'Automacao', false),
(72, 'Timeout recepção de tracking', 'Sistema', false),
(73, 'Mover XY com garfos fora', 'Automacao', false),
(74, 'Timeout falta autorização transporte descarga', 'Sistema', false),
(75, 'Defeito referência de máquina', 'Automacao', false),
(76, 'Falha Timeout garfos', 'Automacao', false),
(77, 'Excesso tempo ciclo', 'Sistema', false),
(78, 'Falha ativação relé freio Z2', 'Eletrica', false),
(79, 'Excesso tempo função manutenção de posição', 'Automacao', false),
(80, 'Timeout de recepção de carga', 'Sistema', false),
(81, 'Erro seleção função', 'Sistema', false),
(82, 'Altura de tracking incorreta', 'Automacao', false),
(83, 'Sensor da mesa de entrada', 'Eletrica', false),
(84, 'Falha de Coordenada XYZ não habilitada', 'Automacao', false),
(85, 'Troca de largueiro', 'Mecanica', false),
(86, 'Estorou Corrente', 'Eletrica', false),
(87, 'Sensor da mesa', 'Eletrica', false),
(88, 'Limpeza TRL', 'Operacao', false),
(89, 'Ocupação', 'Operacao', false),
(90, 'Mesa de entrada', 'Operacao', false),
(91, 'Quebra do braço do redutor', 'Mecanica', false),
(92, 'Erro variador de translação', 'Automacao', false),
(93, 'Preventiva', 'Mecanica', false),
(94, 'Regular sensor', 'Eletrica', false),
(95, 'Inspeção mecânica', 'Mecanica', false),
(96, 'Timeout movimento de elevação', 'Sistema', false),
(97, 'Reiniciando Sistema', 'Sistema', false),
(98, 'Sem transpaleteira', 'Operacao', false),
(99, 'Falha de Presença na Mesa de Saída', 'Eletrica', false),
(100, 'Manutenção no cabo de aço', 'Mecanica', false),
(101, 'Cabo Frouxo', 'Mecanica', false),
(102, 'Mesa de entrada TRT-01 roletes soltos', 'Mecanica', false),
(103, 'Manutenção no cabo de aço', 'Mecanica', false),
(104, 'Manutenção no rolamento', 'Mecanica', false),
(105, 'Verificando barulho no rolamento do Y', 'Mecanica', false),
(106, 'Troca de largueiro', 'Mecanica', false),
(107, 'Acesso ao corredor', 'Operacao', false)
on conflict (codigo) do nothing;
