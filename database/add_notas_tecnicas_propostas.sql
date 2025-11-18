-- Adiciona campo notas_tecnicas na tabela propostas
-- Data: 12/11/2025
-- Descrição: Campo editável para permitir customização do item 3 (Notas Técnicas) do PDF

-- Adicionar coluna notas_tecnicas (nullable, para usar texto padrão quando null)
ALTER TABLE propostas
ADD COLUMN IF NOT EXISTS notas_tecnicas TEXT;

-- Comentário na coluna
COMMENT ON COLUMN propostas.notas_tecnicas IS 'Texto customizado para a seção "3-NOTAS TÉCNICAS" do PDF. Se NULL, usa texto padrão.';
