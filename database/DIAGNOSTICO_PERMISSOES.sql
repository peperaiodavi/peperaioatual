-- ============================================
-- DIAGNÓSTICO DO SISTEMA DE PERMISSÕES
-- ============================================
-- Execute este script para verificar o estado das permissões

-- 1. VERIFICAR SE A TABELA EXISTE
SELECT 
  'Tabela permissoes_usuario' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'permissoes_usuario'
  ) THEN '✅ Existe' ELSE '❌ Não existe' END as status;

-- 2. LISTAR TODOS OS USUÁRIOS E SUAS PERMISSÕES
SELECT 
  u.id,
  u.email,
  us.nome,
  us.permissao as tipo_usuario,
  p.pode_acessar_obras,
  p.pode_acessar_caixa,
  p.pode_acessar_dashboard,
  p.usuario_id as id_permissao
FROM auth.users u
LEFT JOIN usuarios us ON us.id = u.id
LEFT JOIN permissoes_usuario p ON p.usuario_id = u.id
ORDER BY us.nome;

-- 3. VERIFICAR PERMISSÕES ESPECÍFICAS DO ISAAC
-- SUBSTITUA 'isaac@exemplo.com' pelo email real do Isaac
SELECT 
  'Permissões do Isaac' as info,
  p.*
FROM auth.users u
LEFT JOIN permissoes_usuario p ON p.usuario_id = u.id
WHERE u.email ILIKE '%isaac%';

-- 4. VERIFICAR POLÍTICAS RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'permissoes_usuario';

-- 5. TESTAR UPDATE MANUAL (EXECUTE DEPOIS DE PEGAR O ID DO ISAAC)
-- Substitua 'UUID-DO-ISAAC' pelo ID real
/*
UPDATE permissoes_usuario
SET 
  pode_acessar_obras = true,
  pode_acessar_caixa = true,
  pode_acessar_dashboard = true,
  updated_at = NOW()
WHERE usuario_id = 'UUID-DO-ISAAC';
*/

-- 6. VERIFICAR SE O UPDATE FUNCIONOU
/*
SELECT 
  u.email,
  p.pode_acessar_obras,
  p.pode_acessar_caixa,
  p.updated_at
FROM permissoes_usuario p
JOIN auth.users u ON u.id = p.usuario_id
WHERE p.usuario_id = 'UUID-DO-ISAAC';
*/

-- 7. CRIAR PERMISSÕES SE NÃO EXISTIR
-- Execute isto se o Isaac não tiver registro em permissoes_usuario
/*
INSERT INTO permissoes_usuario (
  usuario_id,
  pode_acessar_dashboard,
  pode_acessar_caixa,
  pode_acessar_obras,
  pode_acessar_orcamento,
  pode_acessar_propostas,
  pode_acessar_compromissos,
  pode_acessar_cards_obra,
  pode_acessar_funcionarios,
  pode_acessar_minhas_obras,
  pode_acessar_calendario,
  pode_criar_proposta,
  pode_editar_proposta,
  pode_excluir_proposta,
  pode_visualizar,
  pode_visualizar_saldo,
  pode_visualizar_valores_proposta
)
SELECT 
  id,
  true, -- dashboard
  true, -- caixa
  true, -- obras
  true, -- orcamento
  true, -- propostas
  true, -- compromissos
  true, -- cards_obra
  true, -- funcionarios
  true, -- minhas_obras
  true, -- calendario
  true, -- criar_proposta
  true, -- editar_proposta
  true, -- excluir_proposta
  true, -- visualizar
  true, -- visualizar_saldo
  true  -- visualizar_valores_proposta
FROM auth.users
WHERE email ILIKE '%isaac%'
AND NOT EXISTS (
  SELECT 1 FROM permissoes_usuario WHERE usuario_id = auth.users.id
);
*/

-- 8. VERIFICAR TRIGGERS
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'permissoes_usuario';

-- 9. CONTAR PERMISSÕES POR USUÁRIO
SELECT 
  u.email,
  COUNT(CASE WHEN p.pode_acessar_obras = true THEN 1 END) as tem_obras,
  COUNT(CASE WHEN p.pode_acessar_caixa = true THEN 1 END) as tem_caixa
FROM auth.users u
LEFT JOIN permissoes_usuario p ON p.usuario_id = u.id
GROUP BY u.email
ORDER BY u.email;

-- ============================================
-- COMANDOS ÚTEIS PARA DEBUG
-- ============================================

-- Ver todas as colunas da tabela permissoes_usuario
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'permissoes_usuario'
ORDER BY ordinal_position;

-- Ver última atualização de cada registro
SELECT 
  u.email,
  p.updated_at,
  p.created_at
FROM permissoes_usuario p
JOIN auth.users u ON u.id = p.usuario_id
ORDER BY p.updated_at DESC;
