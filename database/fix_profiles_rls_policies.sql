-- ==============================================
-- FIX: POLÍTICAS RLS PARA TABELA USUARIOS
-- ==============================================
-- Este script adiciona políticas RLS para permitir acesso à tabela usuarios
-- Data: 5 de novembro de 2025

-- Habilitar RLS na tabela usuarios (se ainda não estiver)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admin vê todos os perfis" ON public.usuarios;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admin pode atualizar qualquer perfil" ON public.usuarios;

-- POLICY 1: Usuários podem ver seu próprio perfil
CREATE POLICY "Usuários podem ver próprio perfil"
  ON public.usuarios
  FOR SELECT
  USING (auth.uid() = id);

-- POLICY 2: Admin vê todos os perfis
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

-- POLICY 3: Usuários podem atualizar próprio perfil
CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.usuarios
  FOR UPDATE
  USING (auth.uid() = id);

-- POLICY 4: Admin pode atualizar qualquer perfil
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

-- POLICY 5: Permitir INSERT para novos usuários (signup)
CREATE POLICY "Permitir INSERT de novos perfis"
  ON public.usuarios
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verificação
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'usuarios'
ORDER BY policyname;
