# TRL Control — Sistema de Falhas

Sistema de controle operacional para Transelevadores com **tempo real**, **autenticação de usuários** e banco de dados **Supabase**.

---

## 🚀 Stack

- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Tailwind CSS**
- **TypeScript**

---

## ⚙️ Setup — Passo a Passo

### 1. Supabase — Criar Projeto

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor** e execute o arquivo `supabase_schema.sql` (na raiz deste projeto)
3. Isso vai criar todas as tabelas, índices, políticas RLS, triggers e dados iniciais

### 2. Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

Você encontra esses valores em: **Supabase → Settings → API**

### 3. Criar Usuários

No Supabase, vá em **Authentication → Users → Add User** e crie os usuários do sistema.

Ou use a função de convite: **Authentication → Users → Invite User**

### 4. Instalar e Rodar

```bash
npm install
npm run dev
```

### 5. Deploy no Vercel

1. Faça push do projeto para o **GitHub**
2. Importe o repositório no [vercel.com](https://vercel.com)
3. Configure as variáveis de ambiente no painel do Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy automático!

---

## 📋 Funcionalidades

| Tela | Descrição |
|------|-----------|
| **Login** | Autenticação segura via Supabase Auth |
| **Dashboard** | Status em tempo real dos equipamentos, métricas MTTR/MTBF, rankings |
| **Lançamentos** | Registrar falhas, iniciar/finalizar paradas, refeição coletiva |
| **Histórico** | Visualizar, editar e exportar todos os registros (Excel) |
| **Equipamentos** | CRUD de equipamentos + gestão de **Bens** vinculados |
| **Falhas** | CRUD das 107 falhas cadastradas |
| **Tipos de Serviço** | CRUD dos tipos de serviço |

---

## 🔄 Tempo Real

O sistema usa **Supabase Realtime** para sincronizar dados entre usuários:
- Quando um usuário lança uma falha, **todos os outros veem instantaneamente**
- O Dashboard atualiza automaticamente ao detectar mudanças
- Timers ao vivo nos equipamentos em falha

---

## 🏗️ Bens

Cada equipamento pode ter múltiplos **Bens** (componentes):

| Equipamento | Exemplos de Bens |
|-------------|-----------------|
| TRL_01 | Mesa Entrada, TR_02, TC_18, Mesa Saida... |
| TRL_02 | Mesa Entrada, TR_02, TC_18, Mesa Saida... |
| CARROSSEL | Mesa Entrada, TR_02, TC_18, Mesa Saida... |

Ao lançar uma falha, o operador informa **qual bem** apresentou o problema.

---

## 🍽️ Refeição

- A parada de Refeição inicia em **todos os equipamentos simultâneamente**
- **NÃO aparece** no Dashboard como falha operacional
- **Aparece** no Histórico com label "Refeição"

---

## 📊 Turnos

| Turno | Horário |
|-------|---------|
| T1 | 06:00 – 13:59 |
| T2 | 14:00 – 21:59 |
| T3 | 22:00 – 05:59 |

---

## 🔐 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Apenas usuários autenticados podem acessar/modificar dados
- Middleware protege todas as rotas da aplicação
