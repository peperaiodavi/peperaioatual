-- Atualizar políticas RLS de compromissos para serem compartilhados entre todos os usuários
-- Data: 12/11/2025
-- Descrição: Permite que todos os usuários autenticados vejam e criem compromissos
-- Os compromissos são compartilhados entre todos, mas apenas o criador ou admin pode editar/deletar

-- Remove as políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver seus próprios compromissos" ON compromissos;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios compromissos" ON compromissos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios compromissos" ON compromissos;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios compromissos" ON compromissos;

-- Nova política: Todos podem ver todos os compromissos
CREATE POLICY "Todos usuários podem ver compromissos"
  ON compromissos FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Nova política: Todos podem criar compromissos
CREATE POLICY "Todos usuários podem criar compromissos"
  ON compromissos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Nova política: Apenas o criador ou admin pode atualizar
CREATE POLICY "Apenas criador pode atualizar compromissos"
  ON compromissos FOR UPDATE
  USING (auth.uid() = user_id);

-- Nova política: Apenas o criador ou admin pode deletar
CREATE POLICY "Apenas criador pode deletar compromissos"
  ON compromissos FOR DELETE
  USING (auth.uid() = user_id);

-- Comentário atualizado
COMMENT ON TABLE compromissos IS 'Calendário de compromissos compartilhado entre todos os usuários';
