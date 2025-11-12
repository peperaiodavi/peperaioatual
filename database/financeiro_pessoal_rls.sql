-- Políticas RLS para garantir exclusividade dos dados pessoais por usuário

-- Ativar RLS nas tabelas pessoais
ALTER TABLE transacoes_pessoais ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividas_pessoais ENABLE ROW LEVEL SECURITY;

-- Permitir que cada usuário veja apenas suas transações pessoais
DROP POLICY IF EXISTS usuario_ve_suas_transacoes ON transacoes_pessoais;
CREATE POLICY usuario_ve_suas_transacoes ON transacoes_pessoais
  FOR SELECT
  USING (id_usuario = auth.uid());

-- Permitir que cada usuário insira apenas transações para si
DROP POLICY IF EXISTS usuario_insere_suas_transacoes ON transacoes_pessoais;
CREATE POLICY usuario_insere_suas_transacoes ON transacoes_pessoais
  FOR INSERT
  WITH CHECK (id_usuario = auth.uid());

-- Permitir que cada usuário atualize apenas suas transações
DROP POLICY IF EXISTS usuario_atualiza_suas_transacoes ON transacoes_pessoais;
CREATE POLICY usuario_atualiza_suas_transacoes ON transacoes_pessoais
  FOR UPDATE
  USING (id_usuario = auth.uid());

-- Permitir que cada usuário delete apenas suas transações
DROP POLICY IF EXISTS usuario_deleta_suas_transacoes ON transacoes_pessoais;
CREATE POLICY usuario_deleta_suas_transacoes ON transacoes_pessoais
  FOR DELETE
  USING (id_usuario = auth.uid());

-- Repetir para dividas_pessoais
DROP POLICY IF EXISTS usuario_ve_suas_dividas ON dividas_pessoais;
CREATE POLICY usuario_ve_suas_dividas ON dividas_pessoais
  FOR SELECT
  USING (id_usuario = auth.uid());

DROP POLICY IF EXISTS usuario_insere_suas_dividas ON dividas_pessoais;
CREATE POLICY usuario_insere_suas_dividas ON dividas_pessoais
  FOR INSERT
  WITH CHECK (id_usuario = auth.uid());

DROP POLICY IF EXISTS usuario_atualiza_suas_dividas ON dividas_pessoais;
CREATE POLICY usuario_atualiza_suas_dividas ON dividas_pessoais
  FOR UPDATE
  USING (id_usuario = auth.uid());

DROP POLICY IF EXISTS usuario_deleta_suas_dividas ON dividas_pessoais;
CREATE POLICY usuario_deleta_suas_dividas ON dividas_pessoais
  FOR DELETE
  USING (id_usuario = auth.uid());

-- Fim do script
