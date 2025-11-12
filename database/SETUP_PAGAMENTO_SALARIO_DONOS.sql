-- ========================================
-- SISTEMA DE PAGAMENTO DE DONOS - SETUP COMPLETO
-- ========================================
-- Execute este script para configurar o sistema de pagamento

-- 1. Atualizar emails e salários dos donos
UPDATE funcionarios
SET 
  email = 'marcospaulopeperaio@gmail.com',
  salario_mensal = 5000.00
WHERE nome ILIKE '%marcos%' 
  AND categoria = 'dono';

UPDATE funcionarios
SET 
  email = 'isaacpeperaio@gmail.com',
  salario_mensal = 5000.00
WHERE nome ILIKE '%isaac%' 
  AND categoria = 'dono';

-- 2. Verificar se os donos foram atualizados
SELECT 
  id,
  nome,
  categoria,
  email,
  salario_mensal
FROM funcionarios
WHERE categoria = 'dono'
ORDER BY nome;

-- 3. Verificar se os profiles existem (tabela do Supabase Auth)
SELECT 
  id,
  email,
  nome
FROM profiles
WHERE email IN ('marcospaulopeperaio@gmail.com', 'isaacpeperaio@gmail.com')
ORDER BY email;

-- ========================================
-- IMPORTANTE: 
-- ========================================
-- Se os profiles não existirem, você precisa criar as contas de usuário através de:
-- 1. Supabase Dashboard → Authentication → Users → Add user
--    - Email: marcospaulopeperaio@gmail.com
--    - Password: (defina uma senha)
--    - Auto Confirm User: ✅ (marcar)
-- 
-- 2. Repita para: isaacpeperaio@gmail.com
--
-- Após criar os usuários, os profiles serão criados automaticamente
-- ========================================

-- 4. Verificar as saídas existentes dos donos
SELECT 
  f.nome,
  s.valor,
  s.data,
  s.observacao
FROM saidas_dono s
JOIN funcionarios f ON s.funcionario_id = f.id
WHERE f.categoria = 'dono'
ORDER BY s.data DESC
LIMIT 20;

-- 5. Calcular salário líquido atual (salário base - total saídas)
SELECT 
  f.nome,
  f.salario_mensal as salario_base,
  COALESCE(SUM(s.valor), 0) as total_saidas,
  (f.salario_mensal - COALESCE(SUM(s.valor), 0)) as salario_liquido
FROM funcionarios f
LEFT JOIN saidas_dono s ON s.funcionario_id = f.id
WHERE f.categoria = 'dono'
GROUP BY f.id, f.nome, f.salario_mensal
ORDER BY f.nome;

-- ========================================
-- COMO FUNCIONA O SISTEMA:
-- ========================================
-- 
-- 1. Salário Base: R$ 5.000,00 (configurado acima)
-- 
-- 2. Saídas: Cada vez que registrar uma "Saída" no card do dono,
--    o valor é DEBITADO do salário base
-- 
-- 3. Salário Líquido: Salário Base - Total de Saídas
--    Exemplo: R$ 5.000,00 - R$ 1.200,00 = R$ 3.800,00
-- 
-- 4. Pagamento: Ao clicar em "Efetuar Pagamento":
--    - Paga o Salário Líquido calculado
--    - Registra SAÍDA no caixa empresarial
--    - Registra ENTRADA no dashboard pessoal do dono
--    - RESETA todas as saídas (volta para R$ 5.000,00)
-- 
-- 5. Privacidade: Botão de ocultar/mostrar salário (ícone de olho)
-- 
-- ========================================
-- FLUXO COMPLETO DE EXEMPLO:
-- ========================================
-- 
-- MÊS 1:
-- ├─ Salário Base: R$ 5.000,00
-- ├─ Saída 1: R$ 500,00 (adiantamento)
-- ├─ Saída 2: R$ 300,00 (vale)
-- ├─ Salário Líquido: R$ 4.200,00
-- └─ [PAGAR] → Paga R$ 4.200,00 e reseta saídas
-- 
-- MÊS 2 (após pagamento):
-- ├─ Salário Base: R$ 5.000,00 (resetado)
-- ├─ Saída 1: R$ 800,00
-- ├─ Salário Líquido: R$ 4.200,00
-- └─ [PAGAR] → Paga R$ 4.200,00 e reseta saídas
-- 
-- ========================================

-- 6. Verificar último pagamento efetuado
SELECT 
  data,
  valor,
  origem,
  observacao
FROM transacoes
WHERE categoria = 'Pagamento Sócios'
  AND tipo = 'saida'
ORDER BY created_at DESC
LIMIT 10;

-- 7. Verificar se chegou no dashboard pessoal
SELECT 
  tp.data,
  tp.valor,
  tp.descricao,
  p.nome,
  p.email
FROM transacoes_pessoais tp
JOIN profiles p ON tp.id_usuario = p.id
WHERE p.email IN ('marcospaulopeperaio@gmail.com', 'isaacpeperaio@gmail.com')
  AND tp.tipo = 'ENTRADA'
ORDER BY tp.created_at DESC
LIMIT 10;

-- ========================================
-- TROUBLESHOOTING
-- ========================================

-- Se o pagamento não chegou no dashboard pessoal:

-- 1. Verificar se o email está correto na tabela funcionarios
SELECT id, nome, email FROM funcionarios WHERE categoria = 'dono';

-- 2. Verificar se existe um profile com esse email
SELECT id, email FROM profiles WHERE email IN (
  SELECT email FROM funcionarios WHERE categoria = 'dono'
);

-- 3. Se não existir profile, criar usuário no Supabase Auth primeiro!

-- 4. Verificar políticas RLS da tabela transacoes_pessoais
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'transacoes_pessoais';

-- ========================================
-- FIM DO SCRIPT
-- ========================================
