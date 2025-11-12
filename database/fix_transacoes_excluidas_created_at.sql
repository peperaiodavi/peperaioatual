-- Corrige a tabela transacoes_excluidas adicionando o campo created_at se não existir

DO $$ 
BEGIN
    -- Adiciona created_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transacoes_excluidas' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE transacoes_excluidas 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Atualiza registros existentes com a data de exclusão como fallback
        UPDATE transacoes_excluidas 
        SET created_at = data_exclusao 
        WHERE created_at IS NULL;
        
        RAISE NOTICE 'Coluna created_at adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna created_at já existe.';
    END IF;
END $$;
