-- =====================================================
-- TABELA: diarias
-- Descrição: Registra diárias de funcionários em obras
-- =====================================================

CREATE TABLE IF NOT EXISTS diarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_funcionario UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  id_obra UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
  observacao TEXT,
  pago BOOLEAN NOT NULL DEFAULT false,
  data_pagamento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_diarias_funcionario ON diarias(id_funcionario);
CREATE INDEX IF NOT EXISTS idx_diarias_obra ON diarias(id_obra);
CREATE INDEX IF NOT EXISTS idx_diarias_pago ON diarias(pago);
CREATE INDEX IF NOT EXISTS idx_diarias_data ON diarias(data);

-- RLS (Row Level Security)
ALTER TABLE diarias ENABLE ROW LEVEL SECURITY;

-- Política: Admin pode tudo
CREATE POLICY "Admin acesso total a diarias" ON diarias
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.permissao = 'admin'
    )
  );

-- Política: Todos usuários autenticados podem ver diárias (simplificada)
-- Nota: Ajuste conforme necessário se houver campo de vinculação usuário-funcionário
CREATE POLICY "Usuarios autenticados veem diarias" ON diarias
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- COMENTÁRIOS
COMMENT ON TABLE diarias IS 'Registro de diárias de funcionários em obras';
COMMENT ON COLUMN diarias.id_funcionario IS 'Funcionário que trabalhou';
COMMENT ON COLUMN diarias.id_obra IS 'Obra onde trabalhou';
COMMENT ON COLUMN diarias.data IS 'Data do dia trabalhado';
COMMENT ON COLUMN diarias.valor IS 'Valor da diária';
COMMENT ON COLUMN diarias.observacao IS 'Observações sobre o dia trabalhado';
COMMENT ON COLUMN diarias.pago IS 'Se a diária foi paga';
COMMENT ON COLUMN diarias.data_pagamento IS 'Data em que foi efetuado o pagamento';
