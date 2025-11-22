-- ========================================
-- FIX DE PERMISSÕES PARA PEPIA
-- Liberar acesso completo para leitura
-- ========================================

-- 1. TRANSAÇÕES - Adicionar política de SELECT
DROP POLICY IF EXISTS "pepia_select_transacoes" ON transacoes;
CREATE POLICY "pepia_select_transacoes" ON transacoes
  FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

-- Verificar se já existe política de SELECT, se não existir, criar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transacoes' 
    AND policyname LIKE '%select%'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Usuarios podem ver suas transacoes" ON transacoes
      FOR SELECT
      TO authenticated
      USING (usuario_id = auth.uid());
  END IF;
END $$;

-- 2. OBRAS - Adicionar política de SELECT
DROP POLICY IF EXISTS "pepia_select_obras" ON obras;
CREATE POLICY "pepia_select_obras" ON obras
  FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'obras' 
    AND policyname LIKE '%select%'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Usuarios podem ver suas obras" ON obras
      FOR SELECT
      TO authenticated
      USING (usuario_id = auth.uid());
  END IF;
END $$;

-- 3. PROPOSTAS - Adicionar política de SELECT
DROP POLICY IF EXISTS "pepia_select_propostas" ON propostas;
CREATE POLICY "pepia_select_propostas" ON propostas
  FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'propostas' 
    AND policyname LIKE '%select%'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Usuarios podem ver suas propostas" ON propostas
      FOR SELECT
      TO authenticated
      USING (usuario_id = auth.uid());
  END IF;
END $$;

-- 4. FUNCIONÁRIOS - Adicionar política de SELECT
DROP POLICY IF EXISTS "pepia_select_funcionarios" ON funcionarios;
CREATE POLICY "pepia_select_funcionarios" ON funcionarios
  FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'funcionarios' 
    AND policyname LIKE '%select%'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Usuarios podem ver seus funcionarios" ON funcionarios
      FOR SELECT
      TO authenticated
      USING (usuario_id = auth.uid());
  END IF;
END $$;

-- 5. COMPROMISSOS - Adicionar política de SELECT
DROP POLICY IF EXISTS "pepia_select_compromissos" ON compromissos;
CREATE POLICY "pepia_select_compromissos" ON compromissos
  FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'compromissos' 
    AND policyname LIKE '%select%'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Usuarios podem ver seus compromissos" ON compromissos
      FOR SELECT
      TO authenticated
      USING (usuario_id = auth.uid());
  END IF;
END $$;

-- 6. DÍVIDAS - Adicionar política de SELECT
DROP POLICY IF EXISTS "pepia_select_dividas" ON dividas;
CREATE POLICY "pepia_select_dividas" ON dividas
  FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dividas' 
    AND policyname LIKE '%select%'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Usuarios podem ver suas dividas" ON dividas
      FOR SELECT
      TO authenticated
      USING (usuario_id = auth.uid());
  END IF;
END $$;

-- 7. RECEBIDOS - Adicionar política de SELECT
DROP POLICY IF EXISTS "pepia_select_recebidos" ON recebidos;
CREATE POLICY "pepia_select_recebidos" ON recebidos
  FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recebidos' 
    AND policyname LIKE '%select%'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Usuarios podem ver seus recebidos" ON recebidos
      FOR SELECT
      TO authenticated
      USING (usuario_id = auth.uid());
  END IF;
END $$;

-- 8. GASTOS_OBRA - Política especial (pode não ter usuario_id)
DROP POLICY IF EXISTS "pepia_select_gastos_obra" ON gastos_obra;
CREATE POLICY "pepia_select_gastos_obra" ON gastos_obra
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM obras 
      WHERE obras.id = gastos_obra.obra_id 
      AND obras.usuario_id = auth.uid()
    )
  );

-- ========================================
-- VERIFICAR POLÍTICAS CRIADAS
-- ========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN (
  'transacoes', 'obras', 'propostas', 'funcionarios', 
  'compromissos', 'dividas', 'recebidos', 'gastos_obra'
)
ORDER BY tablename, cmd;

-- ========================================
-- INSTRUÇÕES
-- ========================================
-- 1. Abra o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole ESTE SCRIPT COMPLETO
-- 4. Execute
-- 5. Recarregue a página do sistema
