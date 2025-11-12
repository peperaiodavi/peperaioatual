-- ==============================================================
-- SISTEMA FINANCEIRO COMPLETO - PEPERAIO
-- ==============================================================
-- Este script cria a estrutura completa para:
-- 1. Finanças Pessoais (todos os usuários)
-- 2. Caixa de Adiantamento (visualizadores)
-- 3. Cards de Obra - Centro de Custo (projetos)
-- ==============================================================

-- --- TIPOS ENUM (STATUS) ---
DO $$ BEGIN
  CREATE TYPE tx_type AS ENUM ('ENTRADA', 'SAIDA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE expense_status AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM (
    'PENDENTE',       -- Aguardando primeira verba
    'EM_ANDAMENTO',
    'AGUARDANDO_VERBA',
    'EM_ANALISE',     -- Finalizado pelo visualizador, aguardando Admin
    'FINALIZADO',
    'CANCELADO'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fund_request_status AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'visualizador');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- --- ATUALIZAR TABELA DE PERFIS ---
-- Adicionar coluna 'role' se não existir
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'visualizador';

-- ==============================================================
-- 1. MÓDULO DE FINANÇAS PESSOAIS (PARA TODOS OS USUÁRIOS)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.transacoes_pessoais (
  id_transacao uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo         tx_type NOT NULL,
  descricao    text NOT NULL,
  valor        float8 NOT NULL,
  data         timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_transacoes_pessoais_usuario ON public.transacoes_pessoais(id_usuario);
CREATE INDEX IF NOT EXISTS idx_transacoes_pessoais_data ON public.transacoes_pessoais(data DESC);

-- ==============================================================
-- 2. CAIXA DE ADIANTAMENTO (PARA VISUALIZADORES)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.caixa_adiantamento (
  id_caixa     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario   uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  saldo        float8 NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.despesas_adiantamento (
  id_despesa      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_caixa        uuid NOT NULL REFERENCES public.caixa_adiantamento(id_caixa) ON DELETE CASCADE,
  descricao       text NOT NULL,
  valor           float8 NOT NULL,
  data            timestamptz NOT NULL DEFAULT now(),
  url_comprovante text NOT NULL, -- URL do Supabase Storage
  status          expense_status NOT NULL DEFAULT 'PENDENTE',
  notas_admin     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_despesas_adiantamento_caixa ON public.despesas_adiantamento(id_caixa);
CREATE INDEX IF NOT EXISTS idx_despesas_adiantamento_status ON public.despesas_adiantamento(status);

-- ==============================================================
-- 3. CATEGORIAS DE GASTO (CONTROLADO PELO ADMIN)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.categorias_de_gasto (
  id_categoria uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text NOT NULL UNIQUE,
  cor          text DEFAULT '#60a5fa', -- Cor para UI
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Inserir categorias padrão
INSERT INTO public.categorias_de_gasto (nome, cor) VALUES
  ('Matéria-Prima', '#3b82f6'),
  ('Combustível', '#ef4444'),
  ('Alimentação', '#f59e0b'),
  ('Terceirizados', '#8b5cf6'),
  ('Ferramentas', '#10b981'),
  ('Transporte', '#06b6d4'),
  ('Outros', '#6b7280')
ON CONFLICT (nome) DO NOTHING;

-- ==============================================================
-- 4. CARDS DE OBRA (CENTRO DE CUSTO)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.cards_de_obra (
  id_card       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        text NOT NULL,
  nome_cliente  text NOT NULL,
  status        project_status NOT NULL DEFAULT 'PENDENTE',
  
  -- Orçamento e Financeiro
  valor_venda_orcamento float8 NOT NULL,
  saldo_atual           float8 NOT NULL DEFAULT 0,
  total_gasto           float8 NOT NULL DEFAULT 0,
  
  -- Relacionamentos
  id_visualizador_responsavel uuid NOT NULL REFERENCES public.profiles(id),
  
  -- Timestamps
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  finalizado_em timestamptz,
  aprovado_em   timestamptz
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cards_obra_responsavel ON public.cards_de_obra(id_visualizador_responsavel);
CREATE INDEX IF NOT EXISTS idx_cards_obra_status ON public.cards_de_obra(status);

-- ==============================================================
-- 5. DESPESAS DE OBRA (GASTOS ESPECÍFICOS DE UM CARD)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.despesas_de_obra (
  id_despesa      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card         uuid NOT NULL REFERENCES public.cards_de_obra(id_card) ON DELETE CASCADE,
  id_categoria    uuid NOT NULL REFERENCES public.categorias_de_gasto(id_categoria),
  
  descricao       text NOT NULL,
  valor           float8 NOT NULL,
  data            timestamptz NOT NULL DEFAULT now(),
  url_comprovante text NOT NULL, -- URL do Supabase Storage
  
  -- Status de aprovação pelo Admin
  status          expense_status NOT NULL DEFAULT 'PENDENTE',
  notas_admin     text,
  
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_despesas_obra_card ON public.despesas_de_obra(id_card);
CREATE INDEX IF NOT EXISTS idx_despesas_obra_status ON public.despesas_de_obra(status);

-- ==============================================================
-- 6. SOLICITAÇÕES DE VERBA (PARA UM CARD DE OBRA)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.solicitacoes_de_verba (
  id_solicitacao uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card        uuid NOT NULL REFERENCES public.cards_de_obra(id_card) ON DELETE CASCADE,
  id_solicitante uuid NOT NULL REFERENCES public.profiles(id),
  
  valor          float8 NOT NULL,
  justificativa  text NOT NULL,
  status         fund_request_status NOT NULL DEFAULT 'PENDENTE',
  
  data_solicitacao timestamptz NOT NULL DEFAULT now(),
  data_resolucao   timestamptz,
  notas_admin      text
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_verba_card ON public.solicitacoes_de_verba(id_card);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_verba_status ON public.solicitacoes_de_verba(status);

-- ==============================================================
-- FUNÇÕES E TRIGGERS
-- ==============================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para cards_de_obra
DROP TRIGGER IF EXISTS update_cards_obra_updated_at ON public.cards_de_obra;
CREATE TRIGGER update_cards_obra_updated_at
  BEFORE UPDATE ON public.cards_de_obra
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para caixa_adiantamento
DROP TRIGGER IF EXISTS update_caixa_adiantamento_updated_at ON public.caixa_adiantamento;
CREATE TRIGGER update_caixa_adiantamento_updated_at
  BEFORE UPDATE ON public.caixa_adiantamento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURANÇA
-- ==============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.transacoes_pessoais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_adiantamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas_adiantamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_de_gasto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards_de_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas_de_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_de_verba ENABLE ROW LEVEL SECURITY;

-- --- POLÍTICAS: TRANSAÇÕES PESSOAIS ---
-- Cada usuário vê APENAS suas próprias transações
DROP POLICY IF EXISTS "Usuários veem apenas suas transações pessoais" ON public.transacoes_pessoais;
CREATE POLICY "Usuários veem apenas suas transações pessoais"
  ON public.transacoes_pessoais
  FOR SELECT
  USING (auth.uid() = id_usuario);

DROP POLICY IF EXISTS "Usuários inserem apenas suas transações pessoais" ON public.transacoes_pessoais;
CREATE POLICY "Usuários inserem apenas suas transações pessoais"
  ON public.transacoes_pessoais
  FOR INSERT
  WITH CHECK (auth.uid() = id_usuario);

DROP POLICY IF EXISTS "Usuários atualizam apenas suas transações pessoais" ON public.transacoes_pessoais;
CREATE POLICY "Usuários atualizam apenas suas transações pessoais"
  ON public.transacoes_pessoais
  FOR UPDATE
  USING (auth.uid() = id_usuario);

DROP POLICY IF EXISTS "Usuários deletam apenas suas transações pessoais" ON public.transacoes_pessoais;
CREATE POLICY "Usuários deletam apenas suas transações pessoais"
  ON public.transacoes_pessoais
  FOR DELETE
  USING (auth.uid() = id_usuario);

-- --- POLÍTICAS: CAIXA DE ADIANTAMENTO ---
-- Admin vê todos, visualizador vê apenas o seu
DROP POLICY IF EXISTS "Admin vê todos os caixas de adiantamento" ON public.caixa_adiantamento;
CREATE POLICY "Admin vê todos os caixas de adiantamento"
  ON public.caixa_adiantamento
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Visualizador vê seu próprio caixa" ON public.caixa_adiantamento;
CREATE POLICY "Visualizador vê seu próprio caixa"
  ON public.caixa_adiantamento
  FOR SELECT
  USING (auth.uid() = id_usuario);

DROP POLICY IF EXISTS "Admin gerencia caixas de adiantamento" ON public.caixa_adiantamento;
CREATE POLICY "Admin gerencia caixas de adiantamento"
  ON public.caixa_adiantamento
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- --- POLÍTICAS: DESPESAS DE ADIANTAMENTO ---
DROP POLICY IF EXISTS "Admin vê todas as despesas de adiantamento" ON public.despesas_adiantamento;
CREATE POLICY "Admin vê todas as despesas de adiantamento"
  ON public.despesas_adiantamento
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Visualizador vê suas despesas de adiantamento" ON public.despesas_adiantamento;
CREATE POLICY "Visualizador vê suas despesas de adiantamento"
  ON public.despesas_adiantamento
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.caixa_adiantamento
      WHERE id_caixa = despesas_adiantamento.id_caixa
      AND id_usuario = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Visualizador insere despesas em seu caixa" ON public.despesas_adiantamento;
CREATE POLICY "Visualizador insere despesas em seu caixa"
  ON public.despesas_adiantamento
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.caixa_adiantamento
      WHERE id_caixa = despesas_adiantamento.id_caixa
      AND id_usuario = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin gerencia despesas de adiantamento" ON public.despesas_adiantamento;
CREATE POLICY "Admin gerencia despesas de adiantamento"
  ON public.despesas_adiantamento
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- --- POLÍTICAS: CATEGORIAS DE GASTO ---
-- Todos leem, apenas admin modifica
DROP POLICY IF EXISTS "Todos podem ver categorias" ON public.categorias_de_gasto;
CREATE POLICY "Todos podem ver categorias"
  ON public.categorias_de_gasto
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin gerencia categorias" ON public.categorias_de_gasto;
CREATE POLICY "Admin gerencia categorias"
  ON public.categorias_de_gasto
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- --- POLÍTICAS: CARDS DE OBRA ---
DROP POLICY IF EXISTS "Admin vê todos os cards" ON public.cards_de_obra;
CREATE POLICY "Admin vê todos os cards"
  ON public.cards_de_obra
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Visualizador vê seus cards" ON public.cards_de_obra;
CREATE POLICY "Visualizador vê seus cards"
  ON public.cards_de_obra
  FOR SELECT
  USING (auth.uid() = id_visualizador_responsavel);

DROP POLICY IF EXISTS "Visualizador atualiza seus cards" ON public.cards_de_obra;
CREATE POLICY "Visualizador atualiza seus cards"
  ON public.cards_de_obra
  FOR UPDATE
  USING (auth.uid() = id_visualizador_responsavel);

DROP POLICY IF EXISTS "Admin gerencia todos os cards" ON public.cards_de_obra;
CREATE POLICY "Admin gerencia todos os cards"
  ON public.cards_de_obra
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- --- POLÍTICAS: DESPESAS DE OBRA ---
DROP POLICY IF EXISTS "Admin vê todas as despesas de obra" ON public.despesas_de_obra;
CREATE POLICY "Admin vê todas as despesas de obra"
  ON public.despesas_de_obra
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Visualizador vê despesas de seus cards" ON public.despesas_de_obra;
CREATE POLICY "Visualizador vê despesas de seus cards"
  ON public.despesas_de_obra
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cards_de_obra
      WHERE id_card = despesas_de_obra.id_card
      AND id_visualizador_responsavel = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Visualizador insere despesas em seus cards" ON public.despesas_de_obra;
CREATE POLICY "Visualizador insere despesas em seus cards"
  ON public.despesas_de_obra
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cards_de_obra
      WHERE id_card = despesas_de_obra.id_card
      AND id_visualizador_responsavel = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Visualizador deleta despesas de seus cards" ON public.despesas_de_obra;
CREATE POLICY "Visualizador deleta despesas de seus cards"
  ON public.despesas_de_obra
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cards_de_obra
      WHERE id_card = despesas_de_obra.id_card
      AND id_visualizador_responsavel = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin gerencia despesas de obra" ON public.despesas_de_obra;
CREATE POLICY "Admin gerencia despesas de obra"
  ON public.despesas_de_obra
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- --- POLÍTICAS: SOLICITAÇÕES DE VERBA ---
DROP POLICY IF EXISTS "Admin vê todas as solicitações" ON public.solicitacoes_de_verba;
CREATE POLICY "Admin vê todas as solicitações"
  ON public.solicitacoes_de_verba
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Visualizador vê suas solicitações" ON public.solicitacoes_de_verba;
CREATE POLICY "Visualizador vê suas solicitações"
  ON public.solicitacoes_de_verba
  FOR SELECT
  USING (auth.uid() = id_solicitante);

DROP POLICY IF EXISTS "Visualizador cria solicitações" ON public.solicitacoes_de_verba;
CREATE POLICY "Visualizador cria solicitações"
  ON public.solicitacoes_de_verba
  FOR INSERT
  WITH CHECK (auth.uid() = id_solicitante);

DROP POLICY IF EXISTS "Admin gerencia solicitações" ON public.solicitacoes_de_verba;
CREATE POLICY "Admin gerencia solicitações"
  ON public.solicitacoes_de_verba
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================
-- BUCKET DE STORAGE PARA COMPROVANTES
-- ==============================================================
-- Execute isto manualmente no Storage do Supabase:
-- 1. Crie um bucket chamado "comprovantes"
-- 2. Configure as políticas:
--    - Visualizadores podem fazer upload em suas próprias pastas
--    - Admin pode fazer upload e visualizar tudo
-- ==============================================================

-- ==============================================================
-- FIM DO SCRIPT
-- ==============================================================
-- Execute este script no SQL Editor do Supabase.
-- Após execução:
-- 1. Verifique se todas as tabelas foram criadas
-- 2. Confira se os enums foram criados
-- 3. Teste as políticas RLS
-- 4. Configure o bucket "comprovantes" no Storage
-- ==============================================================
