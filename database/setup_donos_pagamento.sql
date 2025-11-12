-- Script para configurar sistema de pagamento dos donos
-- Este script deve ser executado para vincular os donos (Marcos e Isaac) aos usuários do sistema

-- 1. Atualizar dados dos donos na tabela funcionarios
-- Marcos Paulo
UPDATE funcionarios
SET 
  email = 'marcospaulopeperaio@gmail.com',
  salario_mensal = 5000.00
WHERE nome ILIKE '%marcos%' 
  AND categoria = 'dono';

-- Isaac
UPDATE funcionarios
SET 
  email = 'isaacpeperaio@gmail.com',
  salario_mensal = 5000.00
WHERE nome ILIKE '%isaac%' 
  AND categoria = 'dono';

-- 2. Vincular usuario_id dos donos (usando tabela profiles do Supabase Auth)
-- Marcos Paulo
UPDATE funcionarios f
SET usuario_id = p.id
FROM profiles p
WHERE p.email = 'marcospaulopeperaio@gmail.com'
  AND f.email = 'marcospaulopeperaio@gmail.com'
  AND f.categoria = 'dono';

-- Isaac
UPDATE funcionarios f
SET usuario_id = p.id
FROM profiles p
WHERE p.email = 'isaacpeperaio@gmail.com'
  AND f.email = 'isaacpeperaio@gmail.com'
  AND f.categoria = 'dono';

-- 3. Verificar se as atualizações foram bem-sucedidas
SELECT 
  f.id,
  f.nome,
  f.categoria,
  f.email,
  f.usuario_id,
  f.salario_mensal,
  p.email as profile_email,
  p.nome as profile_nome
FROM funcionarios f
LEFT JOIN profiles p ON f.usuario_id = p.id
WHERE f.categoria = 'dono'
ORDER BY f.nome;

-- 4. Verificar se os perfis existem na tabela profiles
SELECT 
  id,
  email,
  nome,
  permissoes
FROM profiles
WHERE email IN ('marcospaulopeperaio@gmail.com', 'isaacpeperaio@gmail.com')
ORDER BY email;

-- IMPORTANTE: Se os usuários não existirem na tabela profiles, você precisa:
-- 1. Criar as contas através do sistema de autenticação (Sign Up)
-- 2. Ou executar manualmente (se tiver acesso ao Supabase Auth):
-- 
-- Após criar os usuários via Auth, os profiles serão criados automaticamente
-- através do trigger do Supabase Auth.
