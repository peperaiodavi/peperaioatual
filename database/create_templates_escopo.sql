-- ============================================
-- TABELA: templates_escopo
-- Descrição: Armazena templates de escopos técnicos para geração automática de propostas
-- Criado em: 2024
-- ============================================

-- Criar tabela templates_escopo
CREATE TABLE IF NOT EXISTS public.templates_escopo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo_material TEXT NOT NULL,
  caracteristicas TEXT[] NOT NULL DEFAULT '{}',
  peculiaridades TEXT,
  escopo_base TEXT NOT NULL,
  usuario_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida por usuario_id
CREATE INDEX idx_templates_escopo_usuario ON public.templates_escopo(usuario_id);

-- Criar índice para busca por tipo de material
CREATE INDEX idx_templates_escopo_tipo_material ON public.templates_escopo(tipo_material);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.templates_escopo ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem visualizar apenas seus próprios templates
CREATE POLICY "Usuários visualizam próprios templates" ON public.templates_escopo
  FOR SELECT
  USING (usuario_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Política: Usuários podem inserir apenas templates com seu próprio usuario_id
CREATE POLICY "Usuários inserem próprios templates" ON public.templates_escopo
  FOR INSERT
  WITH CHECK (usuario_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Política: Usuários podem atualizar apenas seus próprios templates
CREATE POLICY "Usuários atualizam próprios templates" ON public.templates_escopo
  FOR UPDATE
  USING (usuario_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (usuario_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Política: Usuários podem deletar apenas seus próprios templates
CREATE POLICY "Usuários deletam próprios templates" ON public.templates_escopo
  FOR DELETE
  USING (usuario_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_templates_escopo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_templates_escopo_updated_at
  BEFORE UPDATE ON public.templates_escopo
  FOR EACH ROW
  EXECUTE FUNCTION update_templates_escopo_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.templates_escopo IS 'Templates de escopos técnicos para geração automática de propostas comerciais';
COMMENT ON COLUMN public.templates_escopo.nome IS 'Nome identificador do template (ex: "Portão Alumínio Premium")';
COMMENT ON COLUMN public.templates_escopo.tipo_material IS 'Tipo de material/produto (ex: "Portão de Alumínio", "Janela Blindex")';
COMMENT ON COLUMN public.templates_escopo.caracteristicas IS 'Array com características técnicas do produto';
COMMENT ON COLUMN public.templates_escopo.peculiaridades IS 'Peculiaridades e detalhes específicos do material';
COMMENT ON COLUMN public.templates_escopo.escopo_base IS 'Texto base do escopo que será personalizado pela IA';
COMMENT ON COLUMN public.templates_escopo.usuario_id IS 'ID do usuário proprietário do template';
