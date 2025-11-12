# 🔧 TROUBLESHOOTING - Pagamento não vai para Dashboard Pessoal

## ❌ Problema: "Registrou em caixa mas não foi pro dashboard pessoal"

### 🔍 Diagnóstico

Execute este SQL no Supabase para diagnosticar:

```sql
-- 1. Verificar se os donos têm usuario_id configurado
SELECT 
  id,
  nome,
  email,
  usuario_id,
  categoria
FROM funcionarios
WHERE categoria = 'dono';
```

**✅ Resultado esperado**: `usuario_id` deve estar preenchido (não NULL)

**❌ Se NULL**: Continue para a solução abaixo

---

### 🛠️ SOLUÇÃO

#### Passo 1: Verificar se os perfis existem

```sql
SELECT id, email, nome
FROM profiles
WHERE email IN ('marcospaulopeperaio@gmail.com', 'isaacpeperaio@gmail.com');
```

**Se retornar vazio**, os usuários não existem! Vá para **Passo 2**.

**Se retornar dados**, vá direto para **Passo 3**.

---

#### Passo 2: Criar os usuários (se não existem)

**Opção A - Via Interface (RECOMENDADO)**:
1. Abra o Supabase Dashboard
2. Vá em **Authentication** → **Users**
3. Clique em **Add user** → **Create new user**
4. Preencha:
   - Email: `marcospaulopeperaio@gmail.com`
   - Password: `senha_temporaria_123`
   - Auto Confirm User: ✅ Marcado
5. Clique **Create user**
6. Repita para Isaac: `isaacpeperaio@gmail.com`

**Opção B - Via SQL (Avançado)**:
```sql
-- Apenas se você tiver acesso direto ao auth.users
-- Normalmente isso é feito via dashboard
```

---

#### Passo 3: Vincular usuario_id aos funcionários

Depois que os usuários existirem no Supabase Auth, execute:

```sql
-- Marcos Paulo
UPDATE funcionarios f
SET 
  email = 'marcospaulopeperaio@gmail.com',
  salario_mensal = 5000.00,
  usuario_id = (SELECT id FROM profiles WHERE email = 'marcospaulopeperaio@gmail.com')
WHERE nome ILIKE '%marcos%' 
  AND categoria = 'dono';

-- Isaac
UPDATE funcionarios f
SET 
  email = 'isaacpeperaio@gmail.com',
  salario_mensal = 5000.00,
  usuario_id = (SELECT id FROM profiles WHERE email = 'isaacpeperaio@gmail.com')
WHERE nome ILIKE '%isaac%' 
  AND categoria = 'dono';

-- Verificar
SELECT 
  f.nome,
  f.email,
  f.usuario_id,
  p.email as profile_email
FROM funcionarios f
LEFT JOIN profiles p ON f.usuario_id = p.id
WHERE f.categoria = 'dono';
```

**✅ Resultado esperado**: 
- `usuario_id` preenchido
- `profile_email` igual ao `email` do funcionário

---

#### Passo 4: Testar novamente

1. Volte para a página **Funcionários**
2. Expanda o card de Marcos ou Isaac
3. Clique **"Efetuar Pagamento"**
4. Preencha um valor de teste (ex: R$ 100,00)
5. Clique **"Confirmar Transferência"**
6. **Abra o console do navegador** (F12)
7. Verifique se aparece: `✅ Transação pessoal criada: [...]`

---

### 🧪 Verificar se funcionou

```sql
-- Ver últimas transações pessoais
SELECT 
  tp.id_transacao,
  tp.tipo,
  tp.descricao,
  tp.valor,
  tp.data,
  p.nome,
  p.email
FROM transacoes_pessoais tp
JOIN profiles p ON tp.id_usuario = p.id
WHERE p.email IN ('marcospaulopeperaio@gmail.com', 'isaacpeperaio@gmail.com')
ORDER BY tp.created_at DESC
LIMIT 10;
```

**✅ Se aparecer a transação**: FUNCIONOU! 🎉

**❌ Se não aparecer**: Continue para **Erros Comuns**

---

## 🚨 Erros Comuns

### Erro: "foreign key violation"
**Causa**: `usuario_id` não existe na tabela `profiles`

**Solução**: Execute o Passo 1 para verificar se os perfis existem

---

### Erro: "new row violates row-level security policy"
**Causa**: RLS (Row Level Security) está bloqueando a inserção

**Solução - Temporária (para testar)**:
```sql
-- ATENÇÃO: Só use em desenvolvimento!
DROP POLICY IF EXISTS "Usuários inserem apenas suas transações pessoais" ON transacoes_pessoais;

CREATE POLICY "Admin pode inserir transações pessoais"
  ON transacoes_pessoais FOR INSERT
  WITH CHECK (true); -- Permite todos (APENAS PARA TESTE)
```

**Solução - Definitiva (para produção)**:
```sql
-- Permitir que admins insiram transações para outros usuários
DROP POLICY IF EXISTS "Usuários inserem apenas suas transações pessoais" ON transacoes_pessoais;

CREATE POLICY "Usuários e admins podem inserir transações"
  ON transacoes_pessoais FOR INSERT
  WITH CHECK (
    id_usuario = auth.uid() -- Usuário inserindo própria transação
    OR 
    EXISTS ( -- Ou é admin
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND permissoes = 'admin'
    )
  );
```

---

### Erro: "column 'data' is type timestamptz"
**Causa**: Estava enviando data como string simples

**Solução**: ✅ JÁ CORRIGIDO! Agora converte para ISO timestamp:
```typescript
data: new Date(data).toISOString()
```

---

## 📋 Checklist Final

Após seguir todos os passos, verifique:

- [ ] Usuários existem na tabela `profiles` (Authentication)
- [ ] Funcionários têm `usuario_id` preenchido
- [ ] Funcionários têm `email` preenchido
- [ ] Email do funcionário = Email do profile
- [ ] Transação aparece em `transacoes_pessoais`
- [ ] RLS policies permitem inserção
- [ ] Toast de sucesso aparece: "Pagamento efetuado!"
- [ ] Console mostra: `✅ Transação pessoal criada`

---

## 🎯 Teste Completo

```sql
-- Query para ver o fluxo completo de um pagamento
SELECT 
  'Saída Caixa Empresa' as tipo,
  t.data,
  t.valor,
  t.origem,
  t.categoria,
  t.observacao
FROM transacoes t
WHERE t.categoria = 'Pagamento Sócios'
  AND t.data >= CURRENT_DATE - INTERVAL '7 days'

UNION ALL

SELECT 
  'Entrada Dashboard Pessoal' as tipo,
  tp.data,
  tp.valor,
  tp.descricao as origem,
  'Salário' as categoria,
  p.email as observacao
FROM transacoes_pessoais tp
JOIN profiles p ON tp.id_usuario = p.id
WHERE tp.tipo = 'ENTRADA'
  AND tp.descricao ILIKE '%pagamento%'
  AND tp.data >= CURRENT_DATE - INTERVAL '7 days'

ORDER BY data DESC;
```

---

## 💡 Dicas

1. **Sempre teste com valores pequenos** (R$ 1,00) primeiro
2. **Monitore o console do navegador** para ver logs detalhados
3. **Verifique RLS policies** se tiver erro de permissão
4. **Use emails reais** dos donos no sistema
5. **Faça backup** antes de alterar policies do banco

---

## 📞 Suporte

Se o problema persistir após seguir este guia:

1. Copie o erro completo do console
2. Execute a query de diagnóstico do início
3. Verifique os logs do Supabase Dashboard
4. Consulte: https://supabase.com/docs/guides/auth
