-- =====================================================
-- FIX: Garantir que usuários podem DELETAR transações
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- Problema: DELETE de transações não está funcionando ao arquivar

-- 1. Verificar políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'transacoes'
ORDER BY cmd;

-- 2. Remover política de DELETE antiga se existir
DROP POLICY IF EXISTS "Usuários podem deletar suas transações" ON transacoes;
DROP POLICY IF EXISTS "Users can delete their own transacoes" ON transacoes;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON transacoes;

-- 3. Criar política de DELETE permissiva
CREATE POLICY "Enable delete for authenticated users" 
ON transacoes
FOR DELETE
TO authenticated
USING (true);

-- 4. Verificar se RLS está habilitado
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- 5. Verificar políticas após a criação
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'transacoes'
ORDER BY cmd;

-- 6. Testar DELETE (DESCOMENTE PARA TESTAR)
-- SELECT COUNT(*) as total_antes FROM transacoes;
-- DELETE FROM transacoes WHERE id = 'id-de-teste'; -- Substitua por um ID real para testar
-- SELECT COUNT(*) as total_depois FROM transacoes;
