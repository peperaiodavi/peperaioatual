-- Adicionar campo id_original para mapear de volta à transação original
-- Isso permite restaurar corretamente

ALTER TABLE transacoes_arquivadas 
ADD COLUMN IF NOT EXISTS id_original UUID;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_arquivadas_id_original 
ON transacoes_arquivadas(id_original);

-- Comentário explicativo
COMMENT ON COLUMN transacoes_arquivadas.id_original IS 
'ID da transação original na tabela transacoes, usado para restauração';
