-- ==============================================
-- FIX: POLÍTICAS RLS PARA TABELA OBRAS
-- ==============================================
-- Este script adiciona políticas RLS para permitir acesso à tabela obras
-- Data: 4 de novembro de 2025

-- Habilitar RLS na tabela obras (se ainda não estiver)
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Admin vê todas as obras" ON public.obras;
DROP POLICY IF EXISTS "Visualizador vê obras" ON public.obras;
DROP POLICY IF EXISTS "Admin pode criar obras" ON public.obras;
DROP POLICY IF EXISTS "Admin pode atualizar obras" ON public.obras;
DROP POLICY IF EXISTS "Admin pode deletar obras" ON public.obras;

-- POLICY 1: Admin vê todas as obras
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

-- POLICY 2: Visualizador vê todas as obras (necessário para vincular)
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

-- POLICY 3: Admin pode criar obras
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

-- POLICY 4: Admin pode atualizar obras
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

-- POLICY 5: Admin pode deletar obras
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

-- Verificação
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'obras'
ORDER BY policyname;
