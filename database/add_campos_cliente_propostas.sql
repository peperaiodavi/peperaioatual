-- =====================================================
-- Adicionar campos CNPJ e Endereço na tabela propostas
-- =====================================================

ALTER TABLE propostas 
ADD COLUMN IF NOT EXISTS cliente_cnpj VARCHAR(20),
ADD COLUMN IF NOT EXISTS cliente_endereco TEXT;

-- COMENTÁRIOS
COMMENT ON COLUMN propostas.cliente_cnpj IS 'CNPJ do cliente';
COMMENT ON COLUMN propostas.cliente_endereco IS 'Endereço completo do cliente';
