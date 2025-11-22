-- ===============================================
-- SISTEMA DE PERMISSÕES GRANULARES
-- ===============================================
-- Sistema completo de controle de permissões por página e ação
-- Permite que proprietários gerenciem acesso de usuários

-- 1. TABELA DE PERMISSÕES POR PÁGINA
CREATE TABLE IF NOT EXISTS permissoes_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Permissões por página
  pode_acessar_dashboard BOOLEAN DEFAULT true,
  pode_acessar_caixa BOOLEAN DEFAULT true,
  pode_acessar_obras BOOLEAN DEFAULT true,
  pode_acessar_orcamento BOOLEAN DEFAULT true,
  pode_acessar_propostas BOOLEAN DEFAULT true,
  pode_acessar_compromissos BOOLEAN DEFAULT true,
  pode_acessar_cards_obra BOOLEAN DEFAULT true,
  pode_acessar_funcionarios BOOLEAN DEFAULT false,
  pode_acessar_minhas_obras BOOLEAN DEFAULT true,
  pode_acessar_calendario BOOLEAN DEFAULT true,
  
  -- Permissões de ações globais
  pode_criar BOOLEAN DEFAULT false,
  pode_editar BOOLEAN DEFAULT false,
  pode_excluir BOOLEAN DEFAULT false,
  pode_visualizar BOOLEAN DEFAULT true,
  pode_exportar BOOLEAN DEFAULT false,
  pode_gerenciar_permissoes BOOLEAN DEFAULT false,
  
  -- Permissões específicas de Caixa
  pode_criar_transacao BOOLEAN DEFAULT false,
  pode_editar_transacao BOOLEAN DEFAULT false,
  pode_excluir_transacao BOOLEAN DEFAULT false,
  pode_visualizar_saldo BOOLEAN DEFAULT true,
  pode_gerenciar_categorias BOOLEAN DEFAULT false,
  
  -- Permissões específicas de Obras
  pode_criar_obra BOOLEAN DEFAULT false,
  pode_editar_obra BOOLEAN DEFAULT false,
  pode_excluir_obra BOOLEAN DEFAULT false,
  pode_finalizar_obra BOOLEAN DEFAULT false,
  pode_gerenciar_gastos_obra BOOLEAN DEFAULT false,
  
  -- Permissões específicas de Orçamento
  pode_criar_orcamento BOOLEAN DEFAULT false,
  pode_editar_orcamento BOOLEAN DEFAULT false,
  pode_aprovar_orcamento BOOLEAN DEFAULT false,
  
  -- Permissões específicas de Propostas
  pode_criar_proposta BOOLEAN DEFAULT false,
  pode_editar_proposta BOOLEAN DEFAULT false,
  pode_excluir_proposta BOOLEAN DEFAULT false,
  pode_visualizar_valores_proposta BOOLEAN DEFAULT true,
  
  -- Permissões específicas de Funcionários
  pode_criar_funcionario BOOLEAN DEFAULT false,
  pode_editar_funcionario BOOLEAN DEFAULT false,
  pode_excluir_funcionario BOOLEAN DEFAULT false,
  pode_gerenciar_pagamentos BOOLEAN DEFAULT false,
  pode_registrar_diarias BOOLEAN DEFAULT false,
  
  -- Permissões específicas de Cards de Obra
  pode_criar_card_obra BOOLEAN DEFAULT false,
  pode_editar_card_obra BOOLEAN DEFAULT false,
  pode_transferir_verba BOOLEAN DEFAULT false,
  pode_finalizar_card BOOLEAN DEFAULT false,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(usuario_id)
);

-- 2. FUNÇÃO PARA CRIAR PERMISSÕES PADRÃO
CREATE OR REPLACE FUNCTION criar_permissoes_padrao()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se é o primeiro usuário (proprietário)
  IF NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    -- Primeiro usuário = Proprietário (todas permissões)
    INSERT INTO permissoes_usuario (
      usuario_id,
      pode_acessar_dashboard, pode_acessar_caixa, pode_acessar_obras,
      pode_acessar_orcamento, pode_acessar_propostas, pode_acessar_compromissos,
      pode_acessar_cards_obra, pode_acessar_funcionarios, pode_acessar_minhas_obras,
      pode_acessar_calendario, pode_criar, pode_editar, pode_excluir,
      pode_visualizar, pode_exportar, pode_gerenciar_permissoes,
      pode_criar_transacao, pode_editar_transacao, pode_excluir_transacao,
      pode_visualizar_saldo, pode_gerenciar_categorias, pode_criar_obra,
      pode_editar_obra, pode_excluir_obra, pode_finalizar_obra,
      pode_gerenciar_gastos_obra, pode_criar_orcamento, pode_editar_orcamento,
      pode_aprovar_orcamento, pode_criar_proposta, pode_editar_proposta,
      pode_excluir_proposta, pode_visualizar_valores_proposta,
      pode_criar_funcionario, pode_editar_funcionario, pode_excluir_funcionario,
      pode_gerenciar_pagamentos, pode_registrar_diarias, pode_criar_card_obra,
      pode_editar_card_obra, pode_transferir_verba, pode_finalizar_card
    ) VALUES (
      NEW.id,
      true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, true, true, true, true
    );
  ELSE
    -- Usuários subsequentes = Visualizador (acesso a todas abas, mas apenas visualizar)
    INSERT INTO permissoes_usuario (
      usuario_id,
      pode_acessar_dashboard, pode_acessar_caixa, pode_acessar_obras,
      pode_acessar_orcamento, pode_acessar_propostas, pode_acessar_compromissos,
      pode_acessar_cards_obra, pode_acessar_funcionarios, pode_acessar_minhas_obras,
      pode_acessar_calendario, pode_visualizar, pode_visualizar_saldo,
      pode_criar_proposta, pode_editar_proposta, pode_excluir_proposta,
      pode_visualizar_valores_proposta
    ) VALUES (
      NEW.id,
      true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGER PARA CRIAR PERMISSÕES AUTOMATICAMENTE
DROP TRIGGER IF EXISTS trigger_criar_permissoes_padrao ON auth.users;
CREATE TRIGGER trigger_criar_permissoes_padrao
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION criar_permissoes_padrao();

-- 4. FUNCTION PARA ATUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION atualizar_updated_at_permissoes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGER PARA ATUALIZAR TIMESTAMP
DROP TRIGGER IF EXISTS trigger_atualizar_permissoes ON permissoes_usuario;
CREATE TRIGGER trigger_atualizar_permissoes
  BEFORE UPDATE ON permissoes_usuario
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_updated_at_permissoes();

-- 6. RLS POLICIES
ALTER TABLE permissoes_usuario ENABLE ROW LEVEL SECURITY;

-- Proprietários podem ver e gerenciar todas as permissões
DROP POLICY IF EXISTS "Proprietários podem ver todas as permissões" ON permissoes_usuario;
CREATE POLICY "Proprietários podem ver todas as permissões"
  ON permissoes_usuario FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM permissoes_usuario p
      WHERE p.usuario_id = auth.uid()
      AND p.pode_gerenciar_permissoes = true
    )
  );

DROP POLICY IF EXISTS "Proprietários podem atualizar permissões" ON permissoes_usuario;
CREATE POLICY "Proprietários podem atualizar permissões"
  ON permissoes_usuario FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM permissoes_usuario p
      WHERE p.usuario_id = auth.uid()
      AND p.pode_gerenciar_permissoes = true
    )
  );

-- Usuários podem ver apenas suas próprias permissões
DROP POLICY IF EXISTS "Usuários podem ver suas permissões" ON permissoes_usuario;
CREATE POLICY "Usuários podem ver suas permissões"
  ON permissoes_usuario FOR SELECT
  USING (usuario_id = auth.uid());

-- 7. FUNÇÃO AUXILIAR PARA VERIFICAR PERMISSÃO
CREATE OR REPLACE FUNCTION tem_permissao(campo_permissao TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  tem_perm BOOLEAN;
BEGIN
  EXECUTE format('SELECT %I FROM permissoes_usuario WHERE usuario_id = $1', campo_permissao)
  INTO tem_perm
  USING auth.uid();
  
  RETURN COALESCE(tem_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. VIEW PARA FACILITAR CONSULTAS
CREATE OR REPLACE VIEW v_usuarios_com_permissoes AS
SELECT 
  u.id,
  u.email,
  COALESCE(us.nome, u.email) as nome,
  COALESCE(us.avatar_url, '') as avatar_url,
  us.permissao as tipo_permissao_legada,
  p.*
FROM auth.users u
LEFT JOIN usuarios us ON us.id = u.id
LEFT JOIN permissoes_usuario p ON p.usuario_id = u.id;

-- 9. INDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_permissoes_usuario_id ON permissoes_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_permissoes_gerenciar ON permissoes_usuario(pode_gerenciar_permissoes);

-- 10. COMENTÁRIOS
COMMENT ON TABLE permissoes_usuario IS 'Controle granular de permissões por usuário e ação';
COMMENT ON COLUMN permissoes_usuario.pode_gerenciar_permissoes IS 'Usuário pode gerenciar permissões de outros usuários (proprietário)';
COMMENT ON FUNCTION tem_permissao IS 'Verifica se o usuário atual tem uma permissão específica';

-- ===============================================
-- MIGRAÇÃO DE DADOS EXISTENTES
-- ===============================================

-- Criar permissões para usuários existentes baseado no campo permissao da tabela usuarios
INSERT INTO permissoes_usuario (
  usuario_id,
  pode_acessar_dashboard, pode_acessar_caixa, pode_acessar_obras,
  pode_acessar_orcamento, pode_acessar_propostas, pode_acessar_compromissos,
  pode_acessar_cards_obra, pode_acessar_funcionarios, pode_acessar_minhas_obras,
  pode_acessar_calendario, pode_criar, pode_editar, pode_excluir,
  pode_visualizar, pode_exportar, pode_gerenciar_permissoes,
  pode_criar_transacao, pode_editar_transacao, pode_excluir_transacao,
  pode_visualizar_saldo, pode_gerenciar_categorias, pode_criar_obra,
  pode_editar_obra, pode_excluir_obra, pode_finalizar_obra,
  pode_gerenciar_gastos_obra, pode_criar_orcamento, pode_editar_orcamento,
  pode_aprovar_orcamento, pode_criar_proposta, pode_editar_proposta,
  pode_excluir_proposta, pode_visualizar_valores_proposta,
  pode_criar_funcionario, pode_editar_funcionario, pode_excluir_funcionario,
  pode_gerenciar_pagamentos, pode_registrar_diarias, pode_criar_card_obra,
  pode_editar_card_obra, pode_transferir_verba, pode_finalizar_card
)
SELECT 
  u.id,
  -- ACESSO A PÁGINAS: Todos podem acessar todas as abas
  true, -- dashboard (todos)
  true, -- caixa (todos podem ver)
  true, -- obras (todos podem ver)
  true, -- orcamento (todos podem ver)
  true, -- propostas (todos)
  true, -- compromissos (todos)
  true, -- cards_obra (todos podem ver)
  true, -- funcionarios (todos podem ver)
  true, -- minhas_obras (todos)
  true, -- calendario (todos)
  (u.permissao = 'admin'), -- criar
  (u.permissao = 'admin'), -- editar
  (u.permissao = 'admin'), -- excluir
  true, -- visualizar (todos)
  (u.permissao = 'admin'), -- exportar
  (u.permissao = 'admin'), -- gerenciar_permissoes
  (u.permissao = 'admin'), -- criar_transacao
  (u.permissao = 'admin'), -- editar_transacao
  (u.permissao = 'admin'), -- excluir_transacao
  true, -- visualizar_saldo (todos podem ver)
  (u.permissao = 'admin'), -- gerenciar_categorias
  (u.permissao = 'admin'), -- criar_obra
  (u.permissao = 'admin'), -- editar_obra
  (u.permissao = 'admin'), -- excluir_obra
  (u.permissao = 'admin'), -- finalizar_obra
  (u.permissao = 'admin'), -- gerenciar_gastos_obra
  (u.permissao = 'admin'), -- criar_orcamento
  (u.permissao = 'admin'), -- editar_orcamento
  (u.permissao = 'admin'), -- aprovar_orcamento
  true, -- criar_proposta (todos - PROPOSTAS/PDF tem acesso completo)
  true, -- editar_proposta (todos - PROPOSTAS/PDF tem acesso completo)
  true, -- excluir_proposta (todos - PROPOSTAS/PDF tem acesso completo)
  true, -- visualizar_valores_proposta
  (u.permissao = 'admin'), -- criar_funcionario
  (u.permissao = 'admin'), -- editar_funcionario
  (u.permissao = 'admin'), -- excluir_funcionario
  (u.permissao = 'admin'), -- gerenciar_pagamentos
  (u.permissao = 'admin'), -- registrar_diarias
  (u.permissao = 'admin'), -- criar_card_obra
  (u.permissao = 'admin'), -- editar_card_obra
  (u.permissao = 'admin'), -- transferir_verba
  (u.permissao = 'admin')  -- finalizar_card
FROM usuarios u
WHERE NOT EXISTS (
  SELECT 1 FROM permissoes_usuario p WHERE p.usuario_id = u.id
);

-- ===============================================
-- LOG DE ALTERAÇÕES DE PERMISSÕES (AUDITORIA)
-- ===============================================

CREATE TABLE IF NOT EXISTS log_permissoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_alterado_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usuario_responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  campo_alterado TEXT NOT NULL,
  valor_antigo BOOLEAN,
  valor_novo BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_log_permissoes_usuario ON log_permissoes(usuario_alterado_id);
CREATE INDEX IF NOT EXISTS idx_log_permissoes_data ON log_permissoes(created_at);

-- Trigger para registrar alterações
CREATE OR REPLACE FUNCTION registrar_alteracao_permissao()
RETURNS TRIGGER AS $$
BEGIN
  -- Registra cada campo que foi alterado
  IF OLD.pode_gerenciar_permissoes != NEW.pode_gerenciar_permissoes THEN
    INSERT INTO log_permissoes (usuario_alterado_id, usuario_responsavel_id, campo_alterado, valor_antigo, valor_novo)
    VALUES (NEW.usuario_id, auth.uid(), 'pode_gerenciar_permissoes', OLD.pode_gerenciar_permissoes, NEW.pode_gerenciar_permissoes);
  END IF;
  
  -- Adicione mais campos conforme necessário
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_permissoes ON permissoes_usuario;
CREATE TRIGGER trigger_log_permissoes
  AFTER UPDATE ON permissoes_usuario
  FOR EACH ROW
  EXECUTE FUNCTION registrar_alteracao_permissao();

-- ===============================================
-- PRESETS DE PERMISSÕES
-- ===============================================

-- Função para aplicar preset de Proprietário
CREATE OR REPLACE FUNCTION aplicar_preset_proprietario(p_usuario_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE permissoes_usuario SET
    pode_acessar_dashboard = true,
    pode_acessar_caixa = true,
    pode_acessar_obras = true,
    pode_acessar_orcamento = true,
    pode_acessar_propostas = true,
    pode_acessar_compromissos = true,
    pode_acessar_cards_obra = true,
    pode_acessar_funcionarios = true,
    pode_acessar_minhas_obras = true,
    pode_acessar_calendario = true,
    pode_criar = true,
    pode_editar = true,
    pode_excluir = true,
    pode_visualizar = true,
    pode_exportar = true,
    pode_gerenciar_permissoes = true,
    pode_criar_transacao = true,
    pode_editar_transacao = true,
    pode_excluir_transacao = true,
    pode_visualizar_saldo = true,
    pode_gerenciar_categorias = true,
    pode_criar_obra = true,
    pode_editar_obra = true,
    pode_excluir_obra = true,
    pode_finalizar_obra = true,
    pode_gerenciar_gastos_obra = true,
    pode_criar_orcamento = true,
    pode_editar_orcamento = true,
    pode_aprovar_orcamento = true,
    pode_criar_proposta = true,
    pode_editar_proposta = true,
    pode_excluir_proposta = true,
    pode_visualizar_valores_proposta = true,
    pode_criar_funcionario = true,
    pode_editar_funcionario = true,
    pode_excluir_funcionario = true,
    pode_gerenciar_pagamentos = true,
    pode_registrar_diarias = true,
    pode_criar_card_obra = true,
    pode_editar_card_obra = true,
    pode_transferir_verba = true,
    pode_finalizar_card = true
  WHERE usuario_id = p_usuario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para aplicar preset de Visualizador
-- Visualizador: Pode acessar TODAS as abas mas APENAS VISUALIZAR (exceto Propostas/PDF)
CREATE OR REPLACE FUNCTION aplicar_preset_visualizador(p_usuario_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE permissoes_usuario SET
    -- ACESSO A TODAS AS PÁGINAS (só visualizar)
    pode_acessar_dashboard = true,
    pode_acessar_caixa = true,          -- ✅ Pode ver
    pode_acessar_obras = true,          -- ✅ Pode ver
    pode_acessar_orcamento = true,      -- ✅ Pode ver
    pode_acessar_propostas = true,      -- ✅ Pode ver e criar
    pode_acessar_compromissos = true,   -- ✅ Pode ver
    pode_acessar_cards_obra = true,     -- ✅ Pode ver
    pode_acessar_funcionarios = true,   -- ✅ Pode ver
    pode_acessar_minhas_obras = true,   -- ✅ Pode ver
    pode_acessar_calendario = true,     -- ✅ Pode ver
    
    -- AÇÕES GLOBAIS: APENAS VISUALIZAR
    pode_criar = false,                 -- ❌ Não pode criar
    pode_editar = false,                -- ❌ Não pode editar
    pode_excluir = false,               -- ❌ Não pode excluir
    pode_visualizar = true,             -- ✅ Pode visualizar tudo
    pode_exportar = false,              -- ❌ Não pode exportar
    pode_gerenciar_permissoes = false,  -- ❌ Não pode gerenciar permissões
    
    -- CAIXA: APENAS VISUALIZAR
    pode_criar_transacao = false,       -- ❌ Não pode criar transação
    pode_editar_transacao = false,      -- ❌ Não pode editar transação
    pode_excluir_transacao = false,     -- ❌ Não pode excluir transação
    pode_visualizar_saldo = true,       -- ✅ Pode visualizar saldo
    pode_gerenciar_categorias = false,  -- ❌ Não pode gerenciar categorias
    
    -- OBRAS: APENAS VISUALIZAR
    pode_criar_obra = false,            -- ❌ Não pode criar obra
    pode_editar_obra = false,           -- ❌ Não pode editar obra
    pode_excluir_obra = false,          -- ❌ Não pode excluir obra
    pode_finalizar_obra = false,        -- ❌ Não pode finalizar obra
    pode_gerenciar_gastos_obra = false, -- ❌ Não pode gerenciar gastos
    
    -- ORÇAMENTO: APENAS VISUALIZAR
    pode_criar_orcamento = false,       -- ❌ Não pode criar orçamento
    pode_editar_orcamento = false,      -- ❌ Não pode editar orçamento
    pode_aprovar_orcamento = false,     -- ❌ Não pode aprovar orçamento
    
    -- PROPOSTAS/PDF: ACESSO COMPLETO (EXCEÇÃO)
    pode_criar_proposta = true,         -- ✅ Pode criar proposta
    pode_editar_proposta = true,        -- ✅ Pode editar proposta
    pode_excluir_proposta = true,       -- ✅ Pode excluir proposta
    pode_visualizar_valores_proposta = true, -- ✅ Pode visualizar valores
    
    -- FUNCIONÁRIOS: APENAS VISUALIZAR
    pode_criar_funcionario = false,     -- ❌ Não pode criar funcionário
    pode_editar_funcionario = false,    -- ❌ Não pode editar funcionário
    pode_excluir_funcionario = false,   -- ❌ Não pode excluir funcionário
    pode_gerenciar_pagamentos = false,  -- ❌ Não pode gerenciar pagamentos
    pode_registrar_diarias = false,     -- ❌ Não pode registrar diárias
    
    -- CARDS DE OBRA: APENAS VISUALIZAR
    pode_criar_card_obra = false,       -- ❌ Não pode criar card
    pode_editar_card_obra = false,      -- ❌ Não pode editar card
    pode_transferir_verba = false,      -- ❌ Não pode transferir verba
    pode_finalizar_card = false         -- ❌ Não pode finalizar card
  WHERE usuario_id = p_usuario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- FINALIZAÇÃO
-- ===============================================

COMMENT ON DATABASE postgres IS 'Sistema de permissões granulares instalado com sucesso!';

-- Para verificar as permissões de um usuário:
-- SELECT * FROM permissoes_usuario WHERE usuario_id = auth.uid();

-- Para verificar se tem uma permissão específica:
-- SELECT tem_permissao('pode_criar_obra');
