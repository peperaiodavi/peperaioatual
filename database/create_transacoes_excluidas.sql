-- Tabela para histórico de transações excluídas do caixa
CREATE TABLE IF NOT EXISTS transacoes_excluidas (
  id UUID PRIMARY KEY,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor NUMERIC(10, 2) NOT NULL,
  origem VARCHAR(255) NOT NULL,
  data DATE NOT NULL,
  observacao TEXT,
  categoria VARCHAR(100),
  data_exclusao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  excluido_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar por data de exclusão
CREATE INDEX idx_transacoes_excluidas_data_exclusao ON transacoes_excluidas(data_exclusao DESC);

-- RLS (Row Level Security)
ALTER TABLE transacoes_excluidas ENABLE ROW LEVEL SECURITY;

-- Política: Todos autenticados podem visualizar o histórico
CREATE POLICY "Visualizar histórico de transações excluídas"
ON transacoes_excluidas FOR SELECT
TO authenticated
USING (true);

-- Política: Apenas usuários com permissão podem inserir no histórico
CREATE POLICY "Inserir transações excluídas"
ON transacoes_excluidas FOR INSERT
TO authenticated
WITH CHECK (true);
