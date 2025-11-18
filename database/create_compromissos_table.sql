-- Criar tabela de compromissos
-- Data: 12/11/2025
-- Descrição: Sistema de calendário com alertas de compromissos

-- Tabela de compromissos
CREATE TABLE IF NOT EXISTS compromissos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_compromisso TIMESTAMP WITH TIME ZONE NOT NULL,
  cliente TEXT,
  local TEXT,
  notificado BOOLEAN DEFAULT FALSE,
  concluido BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_compromissos_data ON compromissos(data_compromisso);
CREATE INDEX IF NOT EXISTS idx_compromissos_user ON compromissos(user_id);
CREATE INDEX IF NOT EXISTS idx_compromissos_concluido ON compromissos(concluido);

-- RLS (Row Level Security)
ALTER TABLE compromissos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Usuários podem ver seus próprios compromissos" ON compromissos;
CREATE POLICY "Usuários podem ver seus próprios compromissos"
  ON compromissos FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus próprios compromissos" ON compromissos;
CREATE POLICY "Usuários podem criar seus próprios compromissos"
  ON compromissos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios compromissos" ON compromissos;
CREATE POLICY "Usuários podem atualizar seus próprios compromissos"
  ON compromissos FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios compromissos" ON compromissos;
CREATE POLICY "Usuários podem deletar seus próprios compromissos"
  ON compromissos FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE compromissos IS 'Calendário de compromissos e visitas a clientes';
COMMENT ON COLUMN compromissos.titulo IS 'Título do compromisso';
COMMENT ON COLUMN compromissos.descricao IS 'Descrição detalhada do compromisso';
COMMENT ON COLUMN compromissos.data_compromisso IS 'Data e hora do compromisso';
COMMENT ON COLUMN compromissos.cliente IS 'Nome do cliente relacionado';
COMMENT ON COLUMN compromissos.local IS 'Local da visita/compromisso';
COMMENT ON COLUMN compromissos.notificado IS 'Se o usuário já foi notificado sobre este compromisso';
COMMENT ON COLUMN compromissos.concluido IS 'Se o compromisso já foi concluído';
