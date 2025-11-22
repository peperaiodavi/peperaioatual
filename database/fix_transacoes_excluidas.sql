-- Corrigir tabela transacoes_excluidas
-- Adicionar campo motivo_exclusao se não existir
ALTER TABLE transacoes_excluidas 
ADD COLUMN IF NOT EXISTS motivo_exclusao TEXT;

-- Corrigir o DEFAULT do ID para gerar UUID automaticamente
ALTER TABLE transacoes_excluidas 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Comentários explicativos
COMMENT ON COLUMN transacoes_excluidas.motivo_exclusao IS 
'Justificativa fornecida pelo usuário ao excluir a transação';

COMMENT ON TABLE transacoes_excluidas IS 
'Histórico de transações excluídas do caixa com justificativa';
