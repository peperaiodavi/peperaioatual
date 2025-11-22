-- Adicionar campo arquivado à tabela transacoes
-- Este campo controla se a transação está arquivada (não aparece no caixa)
-- mas mantém o valor no saldo calculado

ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS arquivado BOOLEAN DEFAULT false;

-- Criar índice para melhor performance nas queries
CREATE INDEX IF NOT EXISTS idx_transacoes_arquivado 
ON transacoes(arquivado);

-- Comentário explicativo
COMMENT ON COLUMN transacoes.arquivado IS 
'Indica se a transação foi arquivada (oculta da visualização mas mantém no saldo)';
