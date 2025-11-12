-- =====================================================
-- DIAGNÓSTICO COMPLETO: Vinculação de Obras
-- =====================================================
-- Execute este script no Supabase SQL Editor para diagnosticar problemas
-- Data: 4 de novembro de 2025

-- ====================================
-- 1. VERIFICAR USUÁRIO ATUAL
-- ====================================
SELECT 
  '1️⃣ USUÁRIO ATUAL' as "🔍 VERIFICAÇÃO",
  id as "ID do Usuário",
  email as "Email",
  nome as "Nome",
  role as "Role",
  permissao as "Permissão"
FROM public.profiles 
WHERE id = auth.uid();

-- ====================================
-- 2. VERIFICAR OBRAS DISPONÍVEIS
-- ====================================
SELECT 
  '2️⃣ OBRAS DISPONÍVEIS' as "🔍 VERIFICAÇÃO",
  COUNT(*) as "Total de Obras"
FROM public.obras 
WHERE finalizada = false;

-- Listar obras
SELECT 
  '   └─ Detalhes' as "🔍 VERIFICAÇÃO",
  id as "ID",
  titulo as "Título",
  nome_cliente as "Cliente",
  finalizada as "Finalizada?"
FROM public.obras 
WHERE finalizada = false
ORDER BY titulo
LIMIT 10;

-- ====================================
-- 3. VERIFICAR FUNCIONÁRIOS
-- ====================================
SELECT 
  '3️⃣ FUNCIONÁRIOS (VISUALIZADORES)' as "🔍 VERIFICAÇÃO",
  COUNT(*) as "Total"
FROM public.profiles 
WHERE role = 'visualizador';

-- Listar funcionários
SELECT 
  '   └─ Detalhes' as "🔍 VERIFICAÇÃO",
  id as "ID",
  nome as "Nome",
  email as "Email",
  role as "Role"
FROM public.profiles 
WHERE role = 'visualizador'
ORDER BY nome
LIMIT 10;

-- ====================================
-- 4. VERIFICAR POLÍTICAS RLS (OBRAS)
-- ====================================
SELECT 
  '4️⃣ POLÍTICAS RLS - OBRAS' as "🔍 VERIFICAÇÃO",
  policyname as "Nome da Política",
  cmd as "Comando",
  permissive as "Permissivo?"
FROM pg_policies 
WHERE tablename = 'obras' 
AND schemaname = 'public';

-- ====================================
-- 5. VERIFICAR POLÍTICAS RLS (PROFILES)
-- ====================================
SELECT 
  '5️⃣ POLÍTICAS RLS - PROFILES' as "🔍 VERIFICAÇÃO",
  policyname as "Nome da Política",
  cmd as "Comando",
  permissive as "Permissivo?"
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public';

-- ====================================
-- 6. VERIFICAR CARDS DE OBRA EXISTENTES
-- ====================================
SELECT 
  '6️⃣ CARDS DE OBRA EXISTENTES' as "🔍 VERIFICAÇÃO",
  COUNT(*) as "Total de Cards"
FROM public.cards_de_obra;

-- Listar cards
SELECT 
  '   └─ Detalhes' as "🔍 VERIFICAÇÃO",
  titulo as "Título",
  nome_cliente as "Cliente",
  status as "Status",
  saldo_atual as "Saldo",
  total_gasto as "Gasto"
FROM public.cards_de_obra
ORDER BY created_at DESC
LIMIT 5;

-- ====================================
-- 7. TESTAR ACESSO DIRETO ÀS OBRAS
-- ====================================
-- Este SELECT simula o que o frontend está fazendo
SELECT 
  '7️⃣ TESTE DE ACESSO (OBRAS)' as "🔍 VERIFICAÇÃO",
  'Tentando SELECT em obras...' as "Status";

SELECT 
  id, 
  nome_cliente, 
  titulo, 
  finalizada
FROM public.obras
WHERE finalizada = false
ORDER BY titulo;

-- ====================================
-- 8. RESUMO E DIAGNÓSTICO
-- ====================================
SELECT 
  '8️⃣ RESUMO DIAGNÓSTICO' as "🔍 VERIFICAÇÃO",
  CASE 
    WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' 
    THEN '✅ Você é ADMIN'
    ELSE '❌ Você NÃO é admin'
  END as "Status do Usuário",
  
  CASE 
    WHEN (SELECT COUNT(*) FROM public.obras WHERE finalizada = false) > 0 
    THEN '✅ Tem obras disponíveis (' || (SELECT COUNT(*) FROM public.obras WHERE finalizada = false)::text || ')'
    ELSE '❌ Nenhuma obra não finalizada'
  END as "Status das Obras",
  
  CASE 
    WHEN (SELECT COUNT(*) FROM public.profiles WHERE role = 'visualizador') > 0 
    THEN '✅ Tem funcionários (' || (SELECT COUNT(*) FROM public.profiles WHERE role = 'visualizador')::text || ')'
    ELSE '❌ Nenhum funcionário cadastrado'
  END as "Status dos Funcionários",
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obras' AND schemaname = 'public')
    THEN '✅ Políticas RLS configuradas (' || (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'obras')::text || ')'
    ELSE '❌ Políticas RLS não configuradas'
  END as "Status das Políticas";

-- ====================================
-- 9. AÇÕES RECOMENDADAS
-- ====================================
SELECT 
  '9️⃣ AÇÕES RECOMENDADAS' as "🔍 VERIFICAÇÃO",
  CASE 
    WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'admin'
    THEN '⚠️ EXECUTAR: UPDATE public.profiles SET role = ''admin'', permissao = ''admin'' WHERE id = auth.uid();'
    
    WHEN (SELECT COUNT(*) FROM public.obras WHERE finalizada = false) = 0
    THEN '⚠️ AÇÃO: Cadastre obras na aba "Obras" do sistema'
    
    WHEN (SELECT COUNT(*) FROM public.profiles WHERE role = 'visualizador') = 0
    THEN '⚠️ AÇÃO: Crie usuários no Supabase Authentication e configure role = "visualizador"'
    
    WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'obras' AND schemaname = 'public')
    THEN '⚠️ EXECUTAR: Script database/fix_obras_rls_policies.sql'
    
    ELSE '✅ TUDO CONFIGURADO! Sistema pronto para vincular obras.'
  END as "Próximo Passo";

-- ====================================
-- FIM DO DIAGNÓSTICO
-- ====================================
SELECT 
  '✅ DIAGNÓSTICO COMPLETO' as "Status",
  'Revise os resultados acima' as "Mensagem";
