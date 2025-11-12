-- Script de criação de tabelas para financeiro pessoal do usuário
-- Execute este script ANTES de rodar o script de RLS

-- Criar tabela de transações pessoais
CREATE TABLE IF NOT EXISTS public.transacoes_pessoais (
  id_transacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
  descricao TEXT NOT NULL,
  valor NUMERIC(15, 2) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria TEXT DEFAULT 'Outro',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario ON public.transacoes_pessoais(id_usuario);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON public.transacoes_pessoais(data);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON public.transacoes_pessoais(tipo);

-- Criar tabela de dívidas pessoais
CREATE TABLE IF NOT EXISTS public.dividas_pessoais (
  id_divida UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC(15, 2) NOT NULL,
  data_vencimento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'atrasada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_dividas_usuario ON public.dividas_pessoais(id_usuario);
CREATE INDEX IF NOT EXISTS idx_dividas_status ON public.dividas_pessoais(status);

-- Criar view para resumo do usuário
CREATE OR REPLACE VIEW resumo_financeiro_pessoal AS
SELECT 
  id_usuario,
  COALESCE(SUM(CASE WHEN tipo = 'ENTRADA' THEN valor ELSE 0 END), 0) AS total_entradas,
  COALESCE(SUM(CASE WHEN tipo = 'SAIDA' THEN valor ELSE 0 END), 0) AS total_saidas,
  COALESCE(SUM(CASE WHEN tipo = 'ENTRADA' THEN valor ELSE -valor END), 0) AS saldo_atual,
  COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END), 0) AS total_dividas_pendentes
FROM transacoes_pessoais
GROUP BY id_usuario;

-- Fim do script
