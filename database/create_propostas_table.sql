-- Script SQL para criar a tabela 'propostas' no Supabase

-- Cria a tabela propostas
CREATE TABLE IF NOT EXISTS propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nome TEXT NOT NULL,
  cliente_contato TEXT NOT NULL,
  proposta_numero TEXT NOT NULL,
  data_emissao TEXT NOT NULL,
  escopo_fornecimento TEXT NOT NULL,
  condicoes_pagamento TEXT NOT NULL,
  price_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  valor_total_extenso TEXT NOT NULL,
  prazo_garantia_meses TEXT NOT NULL,
  finalizada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cria índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_propostas_proposta_numero ON propostas(proposta_numero);
CREATE INDEX IF NOT EXISTS idx_propostas_cliente_nome ON propostas(cliente_nome);
CREATE INDEX IF NOT EXISTS idx_propostas_finalizada ON propostas(finalizada);
CREATE INDEX IF NOT EXISTS idx_propostas_created_at ON propostas(created_at DESC);

-- Adiciona comentários na tabela
COMMENT ON TABLE propostas IS 'Tabela para armazenar propostas comerciais geradas pelo sistema';
COMMENT ON COLUMN propostas.id IS 'ID único da proposta';
COMMENT ON COLUMN propostas.cliente_nome IS 'Nome da empresa cliente';
COMMENT ON COLUMN propostas.cliente_contato IS 'Nome do contato do cliente';
COMMENT ON COLUMN propostas.proposta_numero IS 'Número da proposta (ex: 2025 570-R04)';
COMMENT ON COLUMN propostas.data_emissao IS 'Data de emissão da proposta';
COMMENT ON COLUMN propostas.escopo_fornecimento IS 'Descrição completa do escopo de fornecimento';
COMMENT ON COLUMN propostas.condicoes_pagamento IS 'Condições de pagamento da proposta';
COMMENT ON COLUMN propostas.price_items IS 'Array JSON com os itens de preço (descrição, qtde, valor)';
COMMENT ON COLUMN propostas.valor_total_extenso IS 'Valor total da proposta por extenso';
COMMENT ON COLUMN propostas.prazo_garantia_meses IS 'Prazo de garantia em meses';
COMMENT ON COLUMN propostas.finalizada IS 'Indica se a proposta foi finalizada e convertida em obra';
COMMENT ON COLUMN propostas.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN propostas.updated_at IS 'Data da última atualização do registro';

-- Cria trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_propostas_updated_at
  BEFORE UPDATE ON propostas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilita Row Level Security (RLS) - IMPORTANTE para segurança no Supabase
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;

-- Cria políticas de segurança (ajuste conforme suas necessidades)
-- Permite que usuários autenticados vejam todas as propostas
CREATE POLICY "Usuários autenticados podem ver propostas"
  ON propostas
  FOR SELECT
  TO authenticated
  USING (true);

-- Permite que usuários autenticados criem propostas
CREATE POLICY "Usuários autenticados podem criar propostas"
  ON propostas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permite que usuários autenticados atualizem propostas
CREATE POLICY "Usuários autenticados podem atualizar propostas"
  ON propostas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permite que usuários autenticados deletem propostas
CREATE POLICY "Usuários autenticados podem deletar propostas"
  ON propostas
  FOR DELETE
  TO authenticated
  USING (true);
