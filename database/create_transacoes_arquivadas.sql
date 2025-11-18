-- Tabela para armazenar transações arquivadas por mês
CREATE TABLE IF NOT EXISTS transacoes_arquivadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor NUMERIC NOT NULL,
  origem TEXT NOT NULL,
  data DATE NOT NULL,
  observacao TEXT,
  categoria TEXT,
  mes_referencia TEXT NOT NULL, -- formato: 'YYYY-MM'
  total_entradas NUMERIC DEFAULT 0,
  total_saidas NUMERIC DEFAULT 0,
  data_arquivamento TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_transacoes_arquivadas_mes ON transacoes_arquivadas(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_transacoes_arquivadas_data ON transacoes_arquivadas(data);
CREATE INDEX IF NOT EXISTS idx_transacoes_arquivadas_tipo ON transacoes_arquivadas(tipo);

-- RLS (Row Level Security) - mesmas políticas das transações normais
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

COMMENT ON TABLE transacoes_arquivadas IS 'Armazena transações arquivadas organizadas por mês para manter o caixa principal limpo';
COMMENT ON COLUMN transacoes_arquivadas.mes_referencia IS 'Mês/ano de referência no formato YYYY-MM';
COMMENT ON COLUMN transacoes_arquivadas.total_entradas IS 'Total de entradas do mês arquivado';
COMMENT ON COLUMN transacoes_arquivadas.total_saidas IS 'Total de saídas do mês arquivado';
COMMENT ON COLUMN transacoes_arquivadas.data_arquivamento IS 'Data em que as transações foram arquivadas';
