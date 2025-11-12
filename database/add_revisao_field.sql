-- Script para adicionar campo de revisão nas propostas
-- Execute este script no Supabase SQL Editor

-- Adiciona o campo numero_sequencial (o número incremental: 570, 571, 572...)
ALTER TABLE propostas 
ADD COLUMN IF NOT EXISTS numero_sequencial INTEGER;

-- Adiciona o campo numero_revisao (R01, R02, R03...)
ALTER TABLE propostas 
ADD COLUMN IF NOT EXISTS numero_revisao INTEGER DEFAULT 1;

-- Adiciona índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_propostas_numero_sequencial ON propostas(numero_sequencial DESC);

-- Adiciona comentários
COMMENT ON COLUMN propostas.numero_sequencial IS 'Número sequencial da proposta (ex: 570, 571, 572...)';
COMMENT ON COLUMN propostas.numero_revisao IS 'Número da revisão da proposta (1 = R01, 2 = R02, etc.)';

-- Cria função para gerar o próximo número sequencial
CREATE OR REPLACE FUNCTION get_next_proposta_numero()
RETURNS INTEGER AS $$
DECLARE
  max_numero INTEGER;
BEGIN
  -- Busca o maior número sequencial
  SELECT COALESCE(MAX(numero_sequencial), 569) INTO max_numero
  FROM propostas;
  
  -- Retorna o próximo número
  RETURN max_numero + 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_proposta_numero() IS 'Retorna o próximo número sequencial de proposta disponível';
