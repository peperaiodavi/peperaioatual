-- ==========================================================
-- 🔧 FIX COMPLETO: RLS para Obras + Usuarios + Diagnóstico
-- ==========================================================
-- Execute este script COMPLETO no Supabase SQL Editor
-- Data: 5 de novembro de 2025

-- ==============================================
-- PARTE 1: RLS PARA TABELA OBRAS
-- ==============================================

ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin vê todas as obras" ON public.obras;
DROP POLICY IF EXISTS "Visualizador vê obras" ON public.obras;
DROP POLICY IF EXISTS "Admin pode criar obras" ON public.obras;
DROP POLICY IF EXISTS "Admin pode atualizar obras" ON public.obras;
DROP POLICY IF EXISTS "Admin pode deletar obras" ON public.obras;

CREATE POLICY "Admin vê todas as obras"
  ON public.obras
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'admin'
    )
  );

CREATE POLICY "Visualizador vê obras"
  ON public.obras
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'visualizador'
    )
  );

CREATE POLICY "Admin pode criar obras"
  ON public.obras
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'admin'
    )
  );

CREATE POLICY "Admin pode atualizar obras"
  ON public.obras
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'admin'
    )
  );

CREATE POLICY "Admin pode deletar obras"
  ON public.obras
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'admin'
    )
  );

-- ==============================================
-- PARTE 2: RLS PARA TABELA USUARIOS
-- ==============================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admin vê todos os perfis" ON public.usuarios;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admin pode atualizar qualquer perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir INSERT de novos perfis" ON public.usuarios;

CREATE POLICY "Usuários podem ver próprio perfil"
  ON public.usuarios
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin vê todos os perfis"
  ON public.usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'admin'
    )
  );

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.usuarios
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin pode atualizar qualquer perfil"
  ON public.usuarios
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'admin'
    )
  );

CREATE POLICY "Permitir INSERT de novos perfis"
  ON public.usuarios
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ==============================================
-- PARTE 3: VERIFICAR USUÁRIO ATUAL
-- ==============================================

SELECT 
  '👤 SEU USUÁRIO ATUAL' as info,
  email, 
  nome,
  permissao
FROM public.usuarios 
WHERE id = auth.uid();

-- ==============================================
-- PARTE 4: VERIFICAÇÃO COMPLETA
-- ==============================================

-- Verificar políticas de OBRAS
SELECT 
  '🏗️  POLÍTICAS - OBRAS' as info,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'obras';

-- Verificar políticas de USUARIOS
SELECT 
  '👥 POLÍTICAS - USUARIOS' as info,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'usuarios';

-- Verificar obras disponíveis
SELECT 
  '📋 OBRAS DISPONÍVEIS' as info,
  COUNT(*) as total
FROM public.obras 
WHERE finalizada = false;

-- Listar obras (máximo 5)
SELECT 
  '   └─ Detalhes das Obras' as info,
  titulo,
  nome_cliente,
  finalizada
FROM public.obras 
WHERE finalizada = false
LIMIT 5;

-- Verificar funcionários
SELECT 
  '👷 FUNCIONÁRIOS (VISUALIZADORES)' as info,
  COUNT(*) as total
FROM public.usuarios 
WHERE permissao = 'visualizador';

-- Listar funcionários (máximo 5)
SELECT 
  '   └─ Detalhes dos Funcionários' as info,
  nome,
  email,
  permissao
FROM public.usuarios 
WHERE permissao = 'visualizador'
LIMIT 5;

-- Listar TODOS usuários
SELECT 
  '📋 TODOS OS USUÁRIOS' as info,
  nome,
  email,
  permissao
FROM public.usuarios
ORDER BY permissao, nome;

-- ==============================================
-- RESULTADO FINAL
-- ==============================================

SELECT 
  '✅ CONFIGURAÇÃO COMPLETA!' as status,
  'Recarregue a página (F5) e tente vincular novamente' as proxima_acao;
