-- ===============================================
-- SISTEMA DE ARQUIVAMENTO DE MESES NO CAIXA
-- ===============================================
-- Permite arquivar meses completos mantendo o saldo
-- e possibilita restauração posterior

-- 1. TABELA DE MESES ARQUIVADOS
CREATE TABLE IF NOT EXISTS meses_arquivados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INTEGER NOT NULL CHECK (ano >= 2000),
  saldo_inicial DECIMAL(12, 2) NOT NULL DEFAULT 0,
  saldo_final DECIMAL(12, 2) NOT NULL,
  total_entradas DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_saidas DECIMAL(12, 2) NOT NULL DEFAULT 0,
  quantidade_transacoes INTEGER NOT NULL DEFAULT 0,
  data_arquivamento TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  arquivado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(mes, ano)
);

-- 2. TABELA DE TRANSAÇÕES ARQUIVADAS
CREATE TABLE IF NOT EXISTS transacoes_arquivadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mes_arquivado_id UUID REFERENCES meses_arquivados(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados da transação original
  transacao_id_original UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor DECIMAL(12, 2) NOT NULL,
  origem TEXT NOT NULL,
  data DATE NOT NULL,
  observacao TEXT,
  categoria TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(transacao_id_original)
);

-- 3. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_meses_arquivados_mes_ano ON meses_arquivados(ano DESC, mes DESC);
CREATE INDEX IF NOT EXISTS idx_meses_arquivados_data ON meses_arquivados(data_arquivamento DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_arquivadas_mes ON transacoes_arquivadas(mes_arquivado_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_arquivadas_data ON transacoes_arquivadas(data);

-- 4. FUNCTION PARA ATUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION atualizar_updated_at_meses_arquivados()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGER PARA ATUALIZAR TIMESTAMP
DROP TRIGGER IF EXISTS trigger_atualizar_meses_arquivados ON meses_arquivados;
CREATE TRIGGER trigger_atualizar_meses_arquivados
  BEFORE UPDATE ON meses_arquivados
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_updated_at_meses_arquivados();

-- 6. RLS POLICIES
ALTER TABLE meses_arquivados ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_arquivadas ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ver meses arquivados
DROP POLICY IF EXISTS "Usuários podem ver meses arquivados" ON meses_arquivados;
CREATE POLICY "Usuários podem ver meses arquivados"
  ON meses_arquivados FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Usuários autenticados podem ver transações arquivadas
DROP POLICY IF EXISTS "Usuários podem ver transações arquivadas" ON transacoes_arquivadas;
CREATE POLICY "Usuários podem ver transações arquivadas"
  ON transacoes_arquivadas FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admin pode arquivar meses (INSERT)
DROP POLICY IF EXISTS "Admin pode arquivar meses" ON meses_arquivados;
CREATE POLICY "Admin pode arquivar meses"
  ON meses_arquivados FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM permissoes_usuario p
      WHERE p.usuario_id = auth.uid()
      AND (p.pode_gerenciar_permissoes = true OR p.pode_criar = true)
    )
  );

-- Admin pode adicionar transações arquivadas
DROP POLICY IF EXISTS "Admin pode adicionar transações arquivadas" ON transacoes_arquivadas;
CREATE POLICY "Admin pode adicionar transações arquivadas"
  ON transacoes_arquivadas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM permissoes_usuario p
      WHERE p.usuario_id = auth.uid()
      AND (p.pode_gerenciar_permissoes = true OR p.pode_criar = true)
    )
  );

-- Admin pode restaurar (DELETE)
DROP POLICY IF EXISTS "Admin pode restaurar meses" ON meses_arquivados;
CREATE POLICY "Admin pode restaurar meses"
  ON meses_arquivados FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM permissoes_usuario p
      WHERE p.usuario_id = auth.uid()
      AND (p.pode_gerenciar_permissoes = true OR p.pode_excluir = true)
    )
  );

-- 7. FUNÇÃO PARA ARQUIVAR UM MÊS
CREATE OR REPLACE FUNCTION arquivar_mes(
  p_mes INTEGER,
  p_ano INTEGER,
  p_observacoes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_saldo_inicial DECIMAL(12, 2);
  v_saldo_final DECIMAL(12, 2);
  v_total_entradas DECIMAL(12, 2);
  v_total_saidas DECIMAL(12, 2);
  v_quantidade INTEGER;
  v_mes_arquivado_id UUID;
  v_data_inicio DATE;
  v_data_fim DATE;
BEGIN
  -- Calcular datas do mês
  v_data_inicio := make_date(p_ano, p_mes, 1);
  v_data_fim := (v_data_inicio + INTERVAL '1 month - 1 day')::DATE;
  
  -- Verificar se já existe arquivamento para este mês
  IF EXISTS (SELECT 1 FROM meses_arquivados WHERE mes = p_mes AND ano = p_ano) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Este mês já foi arquivado'
    );
  END IF;
  
  -- Calcular saldo inicial (saldo do mês anterior)
  SELECT COALESCE(saldo_final, 0)
  INTO v_saldo_inicial
  FROM meses_arquivados
  WHERE ano = p_ano AND mes = p_mes - 1
  OR (p_mes = 1 AND ano = p_ano - 1 AND mes = 12)
  ORDER BY ano DESC, mes DESC
  LIMIT 1;
  
  IF v_saldo_inicial IS NULL THEN
    v_saldo_inicial := 0;
  END IF;
  
  -- Calcular totais do mês
  SELECT 
    COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0),
    COUNT(*)
  INTO v_total_entradas, v_total_saidas, v_quantidade
  FROM transacoes
  WHERE data >= v_data_inicio AND data <= v_data_fim;
  
  -- Calcular saldo final
  v_saldo_final := v_saldo_inicial + v_total_entradas - v_total_saidas;
  
  -- Criar registro do mês arquivado
  INSERT INTO meses_arquivados (
    mes, ano, saldo_inicial, saldo_final,
    total_entradas, total_saidas, quantidade_transacoes,
    arquivado_por, observacoes
  ) VALUES (
    p_mes, p_ano, v_saldo_inicial, v_saldo_final,
    v_total_entradas, v_total_saidas, v_quantidade,
    auth.uid(), p_observacoes
  )
  RETURNING id INTO v_mes_arquivado_id;
  
  -- Copiar transações para arquivo
  INSERT INTO transacoes_arquivadas (
    mes_arquivado_id, transacao_id_original,
    tipo, valor, origem, data, observacao, categoria
  )
  SELECT 
    v_mes_arquivado_id, id,
    tipo, valor, origem, data, observacao, categoria
  FROM transacoes
  WHERE data >= v_data_inicio AND data <= v_data_fim;
  
  -- Remover transações originais
  DELETE FROM transacoes
  WHERE data >= v_data_inicio AND data <= v_data_fim;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Mês arquivado com sucesso',
    'mes_arquivado_id', v_mes_arquivado_id,
    'quantidade_transacoes', v_quantidade,
    'saldo_final', v_saldo_final
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNÇÃO PARA RESTAURAR UM MÊS ARQUIVADO
CREATE OR REPLACE FUNCTION restaurar_mes(p_mes_arquivado_id UUID)
RETURNS JSON AS $$
DECLARE
  v_quantidade INTEGER;
BEGIN
  -- Restaurar transações
  INSERT INTO transacoes (
    id, tipo, valor, origem, data, observacao, categoria
  )
  SELECT 
    transacao_id_original, tipo, valor, origem, data, observacao, categoria
  FROM transacoes_arquivadas
  WHERE transacoes_arquivadas.mes_arquivado_id = p_mes_arquivado_id;
  
  GET DIAGNOSTICS v_quantidade = ROW_COUNT;
  
  -- Remover registro do arquivo
  DELETE FROM meses_arquivados WHERE id = p_mes_arquivado_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Mês restaurado com sucesso',
    'quantidade_transacoes', v_quantidade
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. VIEW PARA CONSULTA RÁPIDA
CREATE OR REPLACE VIEW v_meses_arquivados_resumo AS
SELECT 
  ma.id,
  ma.mes,
  ma.ano,
  to_char(make_date(ma.ano, ma.mes, 1), 'Month/YYYY') as periodo,
  ma.saldo_inicial,
  ma.saldo_final,
  ma.total_entradas,
  ma.total_saidas,
  ma.quantidade_transacoes,
  ma.data_arquivamento,
  u.email as arquivado_por_email,
  ma.observacoes
FROM meses_arquivados ma
LEFT JOIN auth.users u ON u.id = ma.arquivado_por
ORDER BY ma.ano DESC, ma.mes DESC;

-- 10. COMENTÁRIOS
COMMENT ON TABLE meses_arquivados IS 'Meses completos arquivados do caixa com resumo financeiro';
COMMENT ON TABLE transacoes_arquivadas IS 'Transações de meses arquivados - backup completo';
COMMENT ON FUNCTION arquivar_mes IS 'Arquiva um mês completo mantendo o saldo e permitindo restauração';
COMMENT ON FUNCTION restaurar_mes IS 'Restaura um mês arquivado trazendo as transações de volta';

-- ===============================================
-- FINALIZAÇÃO
-- ===============================================

-- Verificar instalação
SELECT 
  'Sistema de Arquivamento instalado!' as status,
  (SELECT COUNT(*) FROM meses_arquivados) as meses_arquivados,
  (SELECT COUNT(*) FROM transacoes_arquivadas) as transacoes_arquivadas;
