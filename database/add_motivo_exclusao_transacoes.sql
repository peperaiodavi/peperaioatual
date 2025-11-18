-- Adiciona campo motivo_exclusao na tabela transacoes_excluidas
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE transacoes_excluidas 
ADD COLUMN IF NOT EXISTS motivo_exclusao TEXT;

-- Adiciona comentário no campo
COMMENT ON COLUMN transacoes_excluidas.motivo_exclusao IS 'Justificativa do motivo da exclusão da transação';
