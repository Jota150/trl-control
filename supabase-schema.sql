-- ============================================================
-- TRL Control - Schema Supabase
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operador' CHECK (role IN ('admin','operador')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipamentos
CREATE TABLE IF NOT EXISTS public.equipamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  setor TEXT NOT NULL DEFAULT 'Expedição',
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bens (componentes vinculados a equipamentos)
CREATE TABLE IF NOT EXISTS public.bens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  equipamento_id UUID REFERENCES public.equipamentos(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Falhas
CREATE TABLE IF NOT EXISTS public.falhas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo INTEGER NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Sistema',
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tipos de Serviço
CREATE TABLE IF NOT EXISTS public.tipos_servico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registros de Falhas
CREATE TABLE IF NOT EXISTS public.registros_falhas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipamento_id UUID REFERENCES public.equipamentos(id) NOT NULL,
  bem_id UUID REFERENCES public.bens(id),
  falha_id UUID REFERENCES public.falhas(id) NOT NULL,
  tipo_servico_id UUID REFERENCES public.tipos_servico(id) NOT NULL,
  observacao TEXT,
  inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fim TIMESTAMPTZ,
  duracao INTEGER, -- seconds
  turno TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento','realizado')),
  is_refeicao BOOLEAN NOT NULL DEFAULT FALSE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.falhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_falhas ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Equipamentos: authenticated users can read/write
CREATE POLICY "equip_read" ON public.equipamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "equip_insert" ON public.equipamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "equip_update" ON public.equipamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "equip_delete" ON public.equipamentos FOR DELETE TO authenticated USING (true);

-- Bens
CREATE POLICY "bens_read" ON public.bens FOR SELECT TO authenticated USING (true);
CREATE POLICY "bens_insert" ON public.bens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "bens_update" ON public.bens FOR UPDATE TO authenticated USING (true);
CREATE POLICY "bens_delete" ON public.bens FOR DELETE TO authenticated USING (true);

-- Falhas
CREATE POLICY "falhas_read" ON public.falhas FOR SELECT TO authenticated USING (true);
CREATE POLICY "falhas_insert" ON public.falhas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "falhas_update" ON public.falhas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "falhas_delete" ON public.falhas FOR DELETE TO authenticated USING (true);

-- Tipos de Serviço
CREATE POLICY "ts_read" ON public.tipos_servico FOR SELECT TO authenticated USING (true);
CREATE POLICY "ts_insert" ON public.tipos_servico FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ts_update" ON public.tipos_servico FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ts_delete" ON public.tipos_servico FOR DELETE TO authenticated USING (true);

-- Registros: all authenticated can read all, insert own, update own
CREATE POLICY "reg_read_all" ON public.registros_falhas FOR SELECT TO authenticated USING (true);
CREATE POLICY "reg_insert" ON public.registros_falhas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "reg_update" ON public.registros_falhas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "reg_delete" ON public.registros_falhas FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Enable Realtime on registros_falhas
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_falhas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bens;

-- ============================================================
-- Trigger: create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Seed: Equipamentos
-- ============================================================
INSERT INTO public.equipamentos (nome, codigo, setor) VALUES
  ('TRL_01', 'TRL01', 'Expedição'),
  ('TRL_02', 'TRL02', 'Expedição'),
  ('CARROSSEL', 'CARR', 'Expedição')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- Seed: Bens do CARROSSEL (Mesa Entrada)
-- ============================================================
INSERT INTO public.bens (nome, equipamento_id)
SELECT b.nome, e.id
FROM (VALUES
  ('TR_02'),('TR_03'),('TM_04'),('TR_05'),('TR_06'),('TR_07'),('TM_08'),
  ('TC_09'),('TM_10'),('TC_11'),('TC_12'),('TC_13'),('TR_14'),('TM_15'),
  ('TC_16'),('TC_17'),('TC_18'),('TR_19'),('TM_20'),('TC_21'),('TC_22'),
  ('TC_23'),('TR_24'),('TM_25'),('TC_26'),('TC_27'),('TC_28'),('TC_29'),
  ('TM_30'),('TM_31')
) AS b(nome)
CROSS JOIN public.equipamentos e
WHERE e.codigo = 'CARR'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Tipos de Serviço
-- ============================================================
INSERT INTO public.tipos_servico (nome) VALUES
  ('Mecanica'),('Eletrica'),('Eletronica'),('Automacao'),('TI'),('Operacao')
ON CONFLICT (nome) DO NOTHING;

-- ============================================================
-- Seed: Falhas (107 falhas)
-- ============================================================
INSERT INTO public.falhas (codigo, nome, categoria) VALUES
(1,'Timeout busca de home','Sistema'),
(2,'Defeito no variador do motor do transportador','Mecanica'),
(3,'Falha conexão potência','Eletrica'),
(4,'Variador Y não preparado (Inhibit o trouble)','Automacao'),
(5,'Movisafe translação excesso diferença posição','Automacao'),
(6,'Movisafe elevação Excesso diferença posição','Automacao'),
(7,'Relé segurança atuado','Eletrica'),
(8,'Erro pallet mal posicionado no rack no ciclo de carga','Operacao'),
(9,'Falha variador X','Automacao'),
(10,'Galibo carga lateral esquerda','Operacao'),
(11,'Movisafe translação fora dos limites','Automacao'),
(12,'Não definida','Sistema'),
(13,'Troca de manual - auto','Operacao'),
(14,'Relé segurança está em falha','Eletrica'),
(15,'Excesso limite permitido atrás (telêmetro)','Automacao'),
(16,'Movisafe translação detecta sobrelevação','Automacao'),
(17,'Galibo carga lateral direita','Operacao'),
(18,'Variador X não preparado (Inhibit o trouble)','Automacao'),
(19,'Defeito proteções do grupo de elevação','Mecanica'),
(20,'Posição Z não ao centro','Automacao'),
(21,'Falha variador Y','Automacao'),
(22,'Advertência - Erro Depósito','Sistema'),
(23,'Excesso limite permitido à baixo (telêmetro)','Automacao'),
(24,'Advertência - Erro Extração','Sistema'),
(25,'Galibo garfos esquerda','Operacao'),
(26,'Discrepância posição chaves','Automacao'),
(27,'Erro de seguimento encoder Z1 com motor','Mecanica'),
(28,'Destino no elevação fora de limites abaixo','Automacao'),
(29,'Movisafe elevação detecta sobrelevação','Automacao'),
(30,'Falha alimentação +24Vcc no +AE','Eletrica'),
(31,'Falha alimentação +24Vcc no +CU','Eletrica'),
(32,'Falta Energia','Eletrica'),
(33,'Falta caminhão','Operacao'),
(34,'Falta sistema','Sistema'),
(35,'Ciclo carga com presença ativa','Operacao'),
(36,'Ciclo descarga sem presença a bordo','Operacao'),
(37,'Falha variador Z','Automacao'),
(38,'Motor Z1 bloqueado','Mecanica'),
(39,'Motor Z2 bloqueado','Mecanica'),
(40,'Pallet empurrado','Operacao'),
(41,'Excesso limite permitido à esquerda Z1','Automacao'),
(42,'Excesso limite permitido à direita Z1','Automacao'),
(43,'Excesso limite permitido à esquerda Z2','Automacao'),
(44,'Excesso limite permitido à direita Z2','Automacao'),
(45,'Posição pallet recolhida no espaço','Operacao'),
(46,'Relé de segurança desativado','Eletrica'),
(47,'Fabrica Parou','Operacao'),
(48,'Pallet empurrado no Carrosel','Operacao'),
(49,'Queda de Pallet no TRL_01','Operacao'),
(50,'Queda de Pallet no TRL_02','Operacao'),
(51,'Descrição Falhas','Sistema'),
(52,'Refeição','Operacao'),
(53,'Erro de seguimento encoder Z2 com motor','Mecanica'),
(54,'Erro posição Z1 o Z2 não ao centro','Automacao'),
(55,'Proteção elétrica freio Z2','Eletrica'),
(56,'Proteção elétrica eixo garfos','Eletrica'),
(57,'Falta de fases alimentação armário CU','Eletrica'),
(58,'Falha ativação relé freio Z1','Eletrica'),
(59,'Falha potência corredor P0','Eletrica'),
(60,'Galibo garfos direita','Operacao'),
(61,'Defeito movimento simultaneo','Mecanica'),
(62,'Falta consentimento da mesa de carga','Operacao'),
(63,'Micro de final de curso abaixo','Mecanica'),
(64,'Defeito variador motor elevação','Automacao'),
(65,'Defeito termistáncia do motor de translação do transportador','Mecanica'),
(66,'Foi detectado o fim de curso com o Home simultaneamente','Automacao'),
(67,'Defeito disjuntor do motor do transportador','Eletrica'),
(68,'Presença de tracking com máquina em repouso','Sistema'),
(69,'Falta consentimento da mesa de descarga','Operacao'),
(70,'Galibo detectado durante o movimento de elevação','Operacao'),
(71,'Defeito de presença','Mecanica'),
(72,'Timeout recepção de tracking','Sistema'),
(73,'Mover XY com garfos fora','Operacao'),
(74,'Timeout falta autorização transporte descarga','Sistema'),
(75,'Defeito referência de máquina','Sistema'),
(76,'Falha Timeout garfos','Sistema'),
(77,'Excesso tempo ciclo','Sistema'),
(78,'Falha ativação relé freio Z2','Eletrica'),
(79,'Excesso tempo função manutenção de posição','Sistema'),
(80,'Timeout de recepção de carga','Sistema'),
(81,'Erro seleção função','Sistema'),
(82,'Altura de tracking incorreta','Sistema'),
(83,'Sensor da mesa de entrada','Mecanica'),
(84,'Falha de Coordenada XYZ não habilitada','Sistema'),
(85,'Troca de largueiro','Mecanica'),
(86,'Estorou Corrente','Eletrica'),
(87,'Sensor da mesa','Mecanica'),
(88,'Limpeza TRL','Operacao'),
(89,'Ocupação','Operacao'),
(90,'Mesa de entrada','Operacao'),
(91,'Quebra do braço do redutor','Mecanica'),
(92,'Erro variador de translação','Automacao'),
(93,'Preventiva','Mecanica'),
(94,'Regular sensor','Mecanica'),
(95,'Inspeção mecânica','Mecanica'),
(96,'Timeout movimento de elevação','Sistema'),
(97,'Reiniciando Sistema','Sistema'),
(98,'Sem transpaleteira','Operacao'),
(99,'Falha de Presença na Mesa de Saída','Mecanica'),
(100,'Manutenção no cabo de aço','Mecanica'),
(101,'Cabo Frouxo','Mecanica'),
(102,'Mesa de entrada TRT-01 roletes soltos','Mecanica'),
(103,'Manutenção no cabo de aço','Mecanica'),
(104,'Manutenção no rolamento','Mecanica'),
(105,'Verificando barulho no rolamento do Y','Mecanica'),
(106,'Troca de largueiro','Mecanica'),
(107,'Acesso ao corredor','Operacao')
ON CONFLICT (codigo) DO NOTHING;
