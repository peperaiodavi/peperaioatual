-- =====================================================
-- SETUP COMPLETO DO BANCO DE DADOS - PEPERAIO
-- =====================================================
-- Este script cria TODAS as tabelas necessárias
-- Execute no Supabase SQL Editor (ordem: TABLES → RLS → TRIGGERS)
-- =====================================================

-- =====================================================
-- EXTENSÕES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA: usuarios (sistema de usuários)
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  permissao TEXT CHECK (permissao IN ('admin', 'visualizador')) DEFAULT 'visualizador',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. TABELA: profiles (perfis de autenticação)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  permissao TEXT CHECK (permissao IN ('admin', 'visualizador')) DEFAULT 'visualizador',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. TABELA: funcionarios (gestão de pessoal)
-- =====================================================
CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  categoria TEXT CHECK (categoria IN ('clt', 'contrato', 'dono')) NOT NULL,
  cargo TEXT NOT NULL,
  salario_mensal NUMERIC,
  valor_diaria NUMERIC,
  avatar_url TEXT,
  data_pagamento_clt DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. TABELA: vales (adiantamentos de funcionários)
-- =====================================================
CREATE TABLE IF NOT EXISTS vales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vales_funcionario ON vales(funcionario_id);

-- =====================================================
-- 5. TABELA: saidas_donos (retiradas dos proprietários)
-- =====================================================
CREATE TABLE IF NOT EXISTS saidas_donos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  data DATE NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saidas_donos_funcionario ON saidas_donos(funcionario_id);

-- =====================================================
-- 6. TABELA: obras (projetos principais)
-- =====================================================
CREATE TABLE IF NOT EXISTS obras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  orcamento NUMERIC NOT NULL DEFAULT 0,
  lucro NUMERIC DEFAULT 0,
  valor_recebido NUMERIC DEFAULT 0,
  finalizada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 7. TABELA: gastos_obra (despesas das obras principais)
-- =====================================================
CREATE TABLE IF NOT EXISTS gastos_obra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id UUID REFERENCES obras(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gastos_obra_obra_id ON gastos_obra(obra_id);
CREATE INDEX IF NOT EXISTS idx_gastos_obra_data ON gastos_obra(data);

-- =====================================================
-- 8. TABELA: pagamentos_obra (receitas das obras)
-- =====================================================
CREATE TABLE IF NOT EXISTS pagamentos_obra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id UUID REFERENCES obras(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_obra_obra_id ON pagamentos_obra(obra_id);

-- =====================================================
-- 9. TABELA: diarias (diárias de funcionários contrato)
-- =====================================================
CREATE TABLE IF NOT EXISTS diarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_funcionario UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  id_obra UUID REFERENCES obras(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  valor NUMERIC NOT NULL,
  observacao TEXT,
  pago BOOLEAN DEFAULT FALSE,
  data_pagamento DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diarias_funcionario ON diarias(id_funcionario);
CREATE INDEX IF NOT EXISTS idx_diarias_obra ON diarias(id_obra);
CREATE INDEX IF NOT EXISTS idx_diarias_pago ON diarias(pago);
CREATE INDEX IF NOT EXISTS idx_diarias_data ON diarias(data);

-- =====================================================
-- 10. TABELA: transacoes (caixa principal)
-- =====================================================
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT CHECK (tipo IN ('entrada', 'saida')) NOT NULL,
  valor NUMERIC NOT NULL,
  origem TEXT NOT NULL,
  data DATE NOT NULL,
  observacao TEXT,
  categoria TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes(data DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria ON transacoes(categoria);

-- =====================================================
-- 11. TABELA: transacoes_arquivadas (histórico arquivado)
-- =====================================================
CREATE TABLE IF NOT EXISTS transacoes_arquivadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor NUMERIC NOT NULL,
  origem TEXT NOT NULL,
  data DATE NOT NULL,
  observacao TEXT,
  categoria TEXT,
  mes_referencia TEXT NOT NULL,
  total_entradas NUMERIC DEFAULT 0,
  total_saidas NUMERIC DEFAULT 0,
  data_arquivamento TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transacoes_arquivadas_mes ON transacoes_arquivadas(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_transacoes_arquivadas_data ON transacoes_arquivadas(data);
CREATE INDEX IF NOT EXISTS idx_transacoes_arquivadas_tipo ON transacoes_arquivadas(tipo);

-- =====================================================
-- 12. TABELA: transacoes_excluidas (lixeira de transações)
-- =====================================================
CREATE TABLE IF NOT EXISTS transacoes_excluidas (
  id UUID PRIMARY KEY,
  tipo TEXT CHECK (tipo IN ('entrada', 'saida')) NOT NULL,
  valor NUMERIC NOT NULL,
  origem TEXT NOT NULL,
  data DATE NOT NULL,
  observacao TEXT,
  categoria TEXT,
  motivo_exclusao TEXT,
  data_exclusao TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transacoes_excluidas_data_exclusao ON transacoes_excluidas(data_exclusao DESC);

-- =====================================================
-- 13. TABELA: categorias (categorias de transações)
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT UNIQUE NOT NULL,
  tipo TEXT CHECK (tipo IN ('entrada', 'saida', 'ambos')) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO categorias (nome, tipo) VALUES
  ('Serviços Prestados', 'entrada'),
  ('Venda de Produtos', 'entrada'),
  ('Investimentos', 'entrada'),
  ('Empréstimo', 'entrada'),
  ('Outros Recebimentos', 'entrada'),
  ('Salários', 'saida'),
  ('Fornecedores', 'saida'),
  ('Aluguel', 'saida'),
  ('Contas', 'saida'),
  ('Impostos', 'saida'),
  ('Combustível', 'saida'),
  ('Alimentação', 'saida'),
  ('Materiais', 'saida'),
  ('Diárias', 'saida'),
  ('Diárias Contrato', 'saida'),
  ('Outros Gastos', 'saida')
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- 14. TABELA: recebiveis (contas a receber)
-- =====================================================
CREATE TABLE IF NOT EXISTS recebiveis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente TEXT NOT NULL,
  valor_total NUMERIC NOT NULL,
  valor_pago NUMERIC DEFAULT 0,
  data_criacao DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 15. TABELA: pagamentos_recebivel (pagamentos de recebiveis)
-- =====================================================
CREATE TABLE IF NOT EXISTS pagamentos_recebivel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recebivel_id UUID REFERENCES recebiveis(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_recebivel_recebivel_id ON pagamentos_recebivel(recebivel_id);

-- =====================================================
-- 16. TABELA: dividas (contas a pagar)
-- =====================================================
CREATE TABLE IF NOT EXISTS dividas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  valor_total NUMERIC NOT NULL,
  valor_pago NUMERIC DEFAULT 0,
  data_vencimento DATE NOT NULL,
  tipo TEXT CHECK (tipo IN ('simples', 'parcelada')) DEFAULT 'simples',
  total_parcelas INTEGER,
  datas_parcelas DATE[],
  parcelas_pagas BOOLEAN[],
  status TEXT CHECK (status IN ('em_dia', 'atrasado', 'quitado')) DEFAULT 'em_dia',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dividas_status ON dividas(status);
CREATE INDEX IF NOT EXISTS idx_dividas_data_vencimento ON dividas(data_vencimento);

-- =====================================================
-- 17. TABELA: compromissos (agenda/calendário)
-- =====================================================
CREATE TABLE IF NOT EXISTS compromissos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  data DATE NOT NULL,
  hora TIME,
  descricao TEXT,
  tipo TEXT CHECK (tipo IN ('reuniao', 'tarefa', 'evento', 'lembrete')) DEFAULT 'lembrete',
  prioridade TEXT CHECK (prioridade IN ('baixa', 'media', 'alta')) DEFAULT 'media',
  concluido BOOLEAN DEFAULT FALSE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  compartilhado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compromissos_data ON compromissos(data);
CREATE INDEX IF NOT EXISTS idx_compromissos_usuario ON compromissos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_compromissos_concluido ON compromissos(concluido);

-- =====================================================
-- 18. TABELA: propostas (propostas comerciais)
-- =====================================================
CREATE TABLE IF NOT EXISTS propostas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_sequencial INTEGER UNIQUE,
  nome_cliente TEXT NOT NULL,
  telefone_cliente TEXT,
  email_cliente TEXT,
  endereco_obra TEXT,
  tipo_obra TEXT,
  descricao_servicos TEXT NOT NULL,
  prazo_execucao TEXT,
  forma_pagamento TEXT,
  observacoes TEXT,
  valor_total NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('rascunho', 'enviada', 'aprovada', 'rejeitada', 'cancelada')) DEFAULT 'rascunho',
  data_emissao DATE DEFAULT CURRENT_DATE,
  data_validade DATE,
  criado_por UUID REFERENCES auth.users(id),
  notas_tecnicas TEXT,
  campo_51 TEXT,
  campo_52 TEXT,
  campo_53 TEXT,
  campo_54 TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);
CREATE INDEX IF NOT EXISTS idx_propostas_numero ON propostas(numero_sequencial);
CREATE INDEX IF NOT EXISTS idx_propostas_cliente ON propostas(nome_cliente);

-- Tabela auxiliar para sequência
CREATE TABLE IF NOT EXISTS propostas_sequencia (
  id INTEGER PRIMARY KEY DEFAULT 1,
  ultimo_numero INTEGER DEFAULT 0,
  CHECK (id = 1)
);

INSERT INTO propostas_sequencia (id, ultimo_numero) 
VALUES (1, 0) 
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 19. TABELA: categorias_de_gasto (categorias de obra)
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias_de_gasto (
  id_categoria UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT UNIQUE NOT NULL,
  cor TEXT DEFAULT '#60a5fa',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO categorias_de_gasto (nome, cor) VALUES
  ('Matéria-Prima', '#3b82f6'),
  ('Combustível', '#ef4444'),
  ('Alimentação', '#f59e0b'),
  ('Terceirizados', '#8b5cf6'),
  ('Ferramentas', '#10b981'),
  ('Transporte', '#06b6d4'),
  ('Funcionário', '#ec4899'),
  ('Outros', '#6b7280')
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- 20. TABELA: cards_de_obra (centro de custo por projeto)
-- =====================================================
CREATE TABLE IF NOT EXISTS cards_de_obra (
  id_card UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  nome_cliente TEXT NOT NULL,
  status TEXT CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'AGUARDANDO_VERBA', 'EM_ANALISE', 'FINALIZADO', 'CANCELADO')) DEFAULT 'PENDENTE',
  valor_venda_orcamento NUMERIC NOT NULL,
  saldo_atual NUMERIC DEFAULT 0,
  total_gasto NUMERIC DEFAULT 0,
  id_visualizador_responsavel UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  finalizado_em TIMESTAMP,
  aprovado_em TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cards_obra_responsavel ON cards_de_obra(id_visualizador_responsavel);
CREATE INDEX IF NOT EXISTS idx_cards_obra_status ON cards_de_obra(status);

-- =====================================================
-- 21. TABELA: despesas_de_obra (gastos dentro dos cards)
-- =====================================================
CREATE TABLE IF NOT EXISTS despesas_de_obra (
  id_despesa UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_card UUID REFERENCES cards_de_obra(id_card) ON DELETE CASCADE,
  id_categoria UUID REFERENCES categorias_de_gasto(id_categoria),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data TIMESTAMP DEFAULT NOW(),
  url_comprovante TEXT NOT NULL,
  status TEXT CHECK (status IN ('PENDENTE', 'APROVADO', 'REPROVADO')) DEFAULT 'PENDENTE',
  notas_admin TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_despesas_obra_card ON despesas_de_obra(id_card);
CREATE INDEX IF NOT EXISTS idx_despesas_obra_status ON despesas_de_obra(status);

-- =====================================================
-- 22. TABELA: solicitacoes_de_verba (pedidos de transferência)
-- =====================================================
CREATE TABLE IF NOT EXISTS solicitacoes_de_verba (
  id_solicitacao UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_card UUID REFERENCES cards_de_obra(id_card) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  justificativa TEXT NOT NULL,
  status TEXT CHECK (status IN ('PENDENTE', 'APROVADO', 'REPROVADO')) DEFAULT 'PENDENTE',
  notas_admin TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  respondido_em TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_verba_card ON solicitacoes_de_verba(id_card);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_verba_status ON solicitacoes_de_verba(status);

-- =====================================================
-- RLS (ROW LEVEL SECURITY) - POLÍTICAS DE ACESSO
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE vales ENABLE ROW LEVEL SECURITY;
ALTER TABLE saidas_donos ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_arquivadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_excluidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE recebiveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_recebivel ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividas ENABLE ROW LEVEL SECURITY;
ALTER TABLE compromissos ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_de_gasto ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards_de_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas_de_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_de_verba ENABLE ROW LEVEL SECURITY;

-- Políticas: Permitir leitura para usuários autenticados (ajuste conforme necessidade)
CREATE POLICY "Permitir leitura para autenticados" ON usuarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON funcionarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON vales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON saidas_donos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON obras FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON gastos_obra FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON pagamentos_obra FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON diarias FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON transacoes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON transacoes_arquivadas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON transacoes_excluidas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON categorias FOR SELECT USING (true);
CREATE POLICY "Permitir leitura para autenticados" ON recebiveis FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON pagamentos_recebivel FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON dividas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON compromissos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON propostas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON categorias_de_gasto FOR SELECT USING (true);
CREATE POLICY "Permitir leitura para autenticados" ON cards_de_obra FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON despesas_de_obra FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir leitura para autenticados" ON solicitacoes_de_verba FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas: Permitir inserção para autenticados
CREATE POLICY "Permitir inserção para autenticados" ON usuarios FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON funcionarios FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON vales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON saidas_donos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON obras FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON gastos_obra FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON pagamentos_obra FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON diarias FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON transacoes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON transacoes_arquivadas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON transacoes_excluidas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON recebiveis FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON pagamentos_recebivel FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON dividas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON compromissos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON propostas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON cards_de_obra FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON despesas_de_obra FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção para autenticados" ON solicitacoes_de_verba FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas: Permitir atualização para autenticados
CREATE POLICY "Permitir atualização para autenticados" ON usuarios FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON profiles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON funcionarios FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON vales FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON saidas_donos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON obras FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON gastos_obra FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON pagamentos_obra FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON diarias FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON transacoes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON transacoes_arquivadas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON transacoes_excluidas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON recebiveis FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON pagamentos_recebivel FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON dividas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON compromissos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON propostas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON cards_de_obra FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON despesas_de_obra FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização para autenticados" ON solicitacoes_de_verba FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas: Permitir deleção para autenticados
CREATE POLICY "Permitir deleção para autenticados" ON usuarios FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON profiles FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON funcionarios FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON vales FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON saidas_donos FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON obras FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON gastos_obra FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON pagamentos_obra FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON diarias FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON transacoes FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON transacoes_arquivadas FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON transacoes_excluidas FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON recebiveis FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON pagamentos_recebivel FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON dividas FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON compromissos FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON propostas FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON cards_de_obra FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON despesas_de_obra FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção para autenticados" ON solicitacoes_de_verba FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- TRIGGERS (automatizações)
-- =====================================================

-- Trigger: Atualizar numero_sequencial em propostas
CREATE OR REPLACE FUNCTION gerar_numero_proposta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_sequencial IS NULL THEN
    UPDATE propostas_sequencia SET ultimo_numero = ultimo_numero + 1 WHERE id = 1;
    NEW.numero_sequencial := (SELECT ultimo_numero FROM propostas_sequencia WHERE id = 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gerar_numero_proposta
BEFORE INSERT ON propostas
FOR EACH ROW
EXECUTE FUNCTION gerar_numero_proposta();

-- Trigger: Atualizar updated_at em propostas
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_propostas_updated_at
BEFORE UPDATE ON propostas
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at();

-- Trigger: Atualizar updated_at em cards_de_obra
CREATE TRIGGER trigger_atualizar_cards_updated_at
BEFORE UPDATE ON cards_de_obra
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at();

-- =====================================================
-- COMENTÁRIOS (documentação)
-- =====================================================

COMMENT ON TABLE transacoes IS 'Caixa principal - entradas e saídas financeiras';
COMMENT ON TABLE transacoes_arquivadas IS 'Histórico arquivado por mês para manter o caixa limpo';
COMMENT ON TABLE transacoes_excluidas IS 'Lixeira de transações excluídas com motivo de exclusão';
COMMENT ON TABLE funcionarios IS 'Gestão de pessoal - CLT, Contrato e Donos';
COMMENT ON TABLE diarias IS 'Controle de diárias de funcionários por contrato';
COMMENT ON TABLE obras IS 'Projetos principais com orçamento e lucro';
COMMENT ON TABLE cards_de_obra IS 'Centro de custo - projetos gerenciados por visualizadores';
COMMENT ON TABLE despesas_de_obra IS 'Gastos específicos dentro de cada card de obra';
COMMENT ON TABLE propostas IS 'Propostas comerciais com numeração automática';
COMMENT ON TABLE compromissos IS 'Agenda e calendário de eventos';
COMMENT ON TABLE dividas IS 'Contas a pagar - simples ou parceladas';
COMMENT ON TABLE recebiveis IS 'Contas a receber de clientes';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- Após executar, verifique:
-- 1. Tabelas criadas: SELECT * FROM information_schema.tables WHERE table_schema = 'public';
-- 2. Políticas RLS: SELECT * FROM pg_policies WHERE schemaname = 'public';
-- 3. Triggers: SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';
-- =====================================================
