-- Deletar a tabela antiga se existir e criar nova
DROP TABLE IF EXISTS transacoes_arquivadas CASCADE;

-- Tabela para armazenar transações arquivadas por mês
CREATE TABLE transacoes_arquivadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor NUMERIC NOT NULL,
  origem TEXT NOT NULL,
  data DATE NOT NULL,
  observacao TEXT,
  categoria TEXT,
  mes_referencia TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX idx_transacoes_arquivadas_mes ON transacoes_arquivadas(mes_referencia);
CREATE INDEX idx_transacoes_arquivadas_data ON transacoes_arquivadas(data);
CREATE INDEX idx_transacoes_arquivadas_tipo ON transacoes_arquivadas(tipo);

-- RLS (Row Level Security)
ALTER TABLE transacoes_arquivadas ENABLE ROW LEVEL SECURITY;

-- Política de leitura (todos podem ler)
CREATE POLICY "Permitir leitura de transações arquivadas" ON transacoes_arquivadas
  FOR SELECT
  USING (true);

-- Política de inserção (apenas usuários autenticados)
CREATE POLICY "Permitir inserção de transações arquivadas" ON transacoes_arquivadas
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização (apenas usuários autenticados)
CREATE POLICY "Permitir atualização de transações arquivadas" ON transacoes_arquivadas
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política de deleção (apenas usuários autenticados)
CREATE POLICY "Permitir deleção de transações arquivadas" ON transacoes_arquivadas
  FOR DELETE
  USING (auth.role() = 'authenticated');
