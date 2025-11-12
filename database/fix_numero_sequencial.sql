-- Script para garantir que o número sequencial sempre incremente
-- Execute este script no Supabase SQL Editor

-- ⚠️ IMPORTANTE: Números NÃO são reutilizados após exclusão!
-- Exemplo de comportamento:
--   1. Criar proposta → 570
--   2. Deletar proposta 570
--   3. Criar nova proposta → 571 (não volta para 570!)
-- 
-- Isso é PROPOSITAL para evitar:
--   - Duplicação de números em documentos já enviados
--   - Perda de rastreabilidade
--   - Confusão em auditorias e histórico

-- Cria uma tabela para controlar o último número sequencial usado
CREATE TABLE IF NOT EXISTS propostas_sequencia (
  id INTEGER PRIMARY KEY DEFAULT 1,
  ultimo_numero INTEGER NOT NULL DEFAULT 569,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insere o registro inicial (se não existir)
INSERT INTO propostas_sequencia (id, ultimo_numero)
VALUES (1, 569)
ON CONFLICT (id) DO NOTHING;

-- Atualiza para o maior número atual se já existirem propostas
UPDATE propostas_sequencia
SET ultimo_numero = COALESCE(
  (SELECT MAX(numero_sequencial) FROM propostas WHERE numero_sequencial IS NOT NULL),
  569
)
WHERE id = 1;

-- Cria função para obter e incrementar o próximo número
CREATE OR REPLACE FUNCTION get_next_numero_sequencial()
RETURNS INTEGER AS $$
DECLARE
  novo_numero INTEGER;
BEGIN
  -- Atualiza e retorna o próximo número em uma única operação atômica
  UPDATE propostas_sequencia
  SET ultimo_numero = ultimo_numero + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING ultimo_numero INTO novo_numero;
  
  RETURN novo_numero;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE propostas_sequencia IS 'Controla o último número sequencial usado para propostas';
COMMENT ON FUNCTION get_next_numero_sequencial() IS 'Retorna o próximo número sequencial disponível (sempre incrementa, nunca reutiliza)';
