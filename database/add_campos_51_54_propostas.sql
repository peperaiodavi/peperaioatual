-- Adicionar campos 5.1 (Data Base) e 5.4 (Prazo de Entrega) na tabela propostas

-- Verifica se as colunas já existem antes de adicionar
DO $$ 
BEGIN
    -- Adiciona data_base_proposta se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' AND column_name = 'data_base_proposta'
    ) THEN
        ALTER TABLE propostas ADD COLUMN data_base_proposta TEXT;
    END IF;

    -- Adiciona prazo_entrega se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'propostas' AND column_name = 'prazo_entrega'
    ) THEN
        ALTER TABLE propostas ADD COLUMN prazo_entrega TEXT;
    END IF;
END $$;

-- Comentários para documentação
COMMENT ON COLUMN propostas.data_base_proposta IS 'Campo 5.1 - Data base da proposta comercial';
COMMENT ON COLUMN propostas.prazo_entrega IS 'Campo 5.4 - Prazo de entrega dos produtos/serviços';
