# 🔧 FIX: Email não vinculado no sistema de pagamento

## ❌ Problema Identificado

Quando tenta pagar o salário dos donos, aparece o erro:
```
"Email não encontrado no sistema de usuários! Crie o usuário no Supabase Auth primeiro."
```

## 🔍 Diagnóstico

Existem **3 possíveis causas**:

### Causa 1: Email não cadastrado na tabela `funcionarios`
### Causa 2: Usuário não criado no Supabase Auth
### Causa 3: Profile não vinculado automaticamente

---

## ✅ SOLUÇÃO PASSO A PASSO

### **Passo 1: Verificar se o email está cadastrado**

Execute no **Supabase SQL Editor**:

```sql
-- Ver funcionários donos e seus emails
SELECT id, nome, email, categoria, salario_mensal
FROM funcionarios
WHERE categoria = 'dono'
ORDER BY nome;
```

**Resultado Esperado**:
```
id  | nome   | email                          | categoria | salario_mensal
----+--------+--------------------------------+-----------+---------------
1   | Marcos | marcospaulopeperaio@gmail.com  | dono      | 5000.00
2   | Isaac  | isaacpeperaio@gmail.com        | dono      | 5000.00
```

**Se aparecer NULL no email:**

```sql
-- Atualizar email do Marcos
UPDATE funcionarios
SET email = 'marcospaulopeperaio@gmail.com'
WHERE nome ILIKE '%marcos%' AND categoria = 'dono';

-- Atualizar email do Isaac
UPDATE funcionarios
SET email = 'isaacpeperaio@gmail.com'
WHERE nome ILIKE '%isaac%' AND categoria = 'dono';

-- Confirmar atualização
SELECT nome, email FROM funcionarios WHERE categoria = 'dono';
```

---

### **Passo 2: Criar usuários no Supabase Auth**

⚠️ **IMPORTANTE**: Mesmo com email cadastrado, precisa criar o **usuário no Authentication**

#### No Supabase Dashboard:

1. Vá em **Authentication** (menu lateral)
2. Clique em **Users** 
3. Clique em **Add user** (ou **Invite**)
4. Preencha:
   - **Email**: `marcospaulopeperaio@gmail.com`
   - **Password**: (defina uma senha segura, ex: `Pepe123!@#`)
   - ✅ **Auto Confirm User**: MARCAR ESTA OPÇÃO
5. Clique em **Create user**
6. **Repita para Isaac**: `isaacpeperaio@gmail.com`

**Captura de onde está:**
```
Dashboard → Authentication → Users → [Add user] button
```

---

### **Passo 3: Verificar se os profiles foram criados**

Quando você cria um usuário no Auth, o Supabase cria automaticamente um registro na tabela `profiles`.

Verifique com esta query:

```sql
-- Verificar se os profiles existem
SELECT 
  id,
  email,
  nome,
  created_at
FROM profiles
WHERE email IN (
  'marcospaulopeperaio@gmail.com',
  'isaacpeperaio@gmail.com'
)
ORDER BY email;
```

**Resultado Esperado**:
```
id (UUID)                            | email                          | nome
-------------------------------------+--------------------------------+--------
abc123-uuid...                       | isaacpeperaio@gmail.com        | Isaac
def456-uuid...                       | marcospaulopeperaio@gmail.com  | Marcos
```

**Se não aparecer nenhum resultado:**
- Significa que os usuários **NÃO foram criados** no Supabase Auth
- Volte ao Passo 2

---

### **Passo 4: Verificar vinculação completa**

Execute esta query para ver se **tudo está conectado**:

```sql
-- Query master de verificação
SELECT 
  f.nome AS "Nome Funcionário",
  f.email AS "Email Funcionário",
  p.id AS "Profile ID",
  p.email AS "Email Profile",
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ VINCULADO'
    ELSE '❌ SEM PROFILE'
  END AS "Status"
FROM funcionarios f
LEFT JOIN profiles p ON p.email = f.email
WHERE f.categoria = 'dono'
ORDER BY f.nome;
```

**Resultado Esperado**:
```
Nome Funcionário | Email Funcionário              | Profile ID    | Email Profile                 | Status
-----------------+--------------------------------+---------------+-------------------------------+-----------
Isaac            | isaacpeperaio@gmail.com        | abc123-uuid   | isaacpeperaio@gmail.com       | ✅ VINCULADO
Marcos           | marcospaulopeperaio@gmail.com  | def456-uuid   | marcospaulopeperaio@gmail.com | ✅ VINCULADO
```

---

## 🧪 TESTE FINAL

Após executar todos os passos:

1. **Recarregue a página** Funcionários no sistema
2. Abra o **console do navegador** (F12)
3. Clique em **"Efetuar Pagamento"** em um dos donos
4. **Veja os logs no console**:

```
🔍 Buscando profile com email: marcospaulopeperaio@gmail.com
📊 Resultado da busca: { 
  profileData: { id: "abc123...", email: "marcos...", nome: "Marcos" }, 
  profileError: null 
}
✅ Profile encontrado: { id: "abc123...", email: "marcos...", nome: "Marcos" }
```

Se aparecer isso, **ESTÁ FUNCIONANDO**! ✅

---

## 🐛 TROUBLESHOOTING

### Erro: "PGRST116 - No rows found"

**Causa**: Profile não existe

**Solução**:
1. Confirme que criou o usuário no Supabase Auth
2. Verifique se marcou "Auto Confirm User"
3. Aguarde 5-10 segundos e rode a query novamente

---

### Erro: Email está NULL na tabela funcionarios

**Solução Rápida**:

```sql
-- Atualizar ambos de uma vez
UPDATE funcionarios
SET email = CASE
  WHEN nome ILIKE '%marcos%' THEN 'marcospaulopeperaio@gmail.com'
  WHEN nome ILIKE '%isaac%' THEN 'isaacpeperaio@gmail.com'
  ELSE email
END,
salario_mensal = 5000.00
WHERE categoria = 'dono';
```

---

### Erro: RLS bloqueando consulta

Se a query `SELECT * FROM profiles WHERE email = '...'` retornar vazio, mas você **sabe** que o usuário existe:

```sql
-- Desabilitar RLS temporariamente (apenas para teste)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Rodar query novamente
SELECT * FROM profiles WHERE email = 'marcospaulopeperaio@gmail.com';

-- Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

**Ou adicionar policy de leitura pública:**

```sql
-- Permitir admins verem todos os profiles
CREATE POLICY "Admins podem ver todos os profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND permissoes = 'admin'
    )
  );
```

---

## 📋 CHECKLIST FINAL

Antes de testar pagamento:

- [ ] Email cadastrado na tabela `funcionarios`
- [ ] Usuário criado no Supabase Auth (Authentication > Users)
- [ ] Opção "Auto Confirm User" marcada
- [ ] Profile existe na tabela `profiles`
- [ ] Query de vinculação retorna "✅ VINCULADO"
- [ ] Console mostra "✅ Profile encontrado"
- [ ] Salário definido como R$ 5.000,00

---

## 🎯 RESULTADO ESPERADO

Após fix completo:

1. ✅ Funcionário aparece com email no card
2. ✅ Botão "Efetuar Pagamento" funciona
3. ✅ Console mostra profile encontrado
4. ✅ Pagamento é registrado
5. ✅ Dinheiro sai do caixa da empresa
6. ✅ Dinheiro entra no dashboard pessoal
7. ✅ Saídas são resetadas

---

## 📞 SUPORTE

Se após seguir **todos os passos** ainda não funcionar:

1. Copie os resultados das queries de verificação
2. Copie a mensagem de erro do console
3. Tire print do console do navegador (F12)
4. Compartilhe comigo para análise

**O problema mais comum é**: Esquecer de criar o usuário no Authentication! 90% dos casos é isso.
