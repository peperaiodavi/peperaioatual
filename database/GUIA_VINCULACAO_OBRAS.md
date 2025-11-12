# 📘 Guia: Como Vincular Obras a Funcionários

## ❗ Problema Atual

Você mencionou:
1. ✅ Tem obras cadastradas na aba "Obras" do sistema
2. ✅ Tem um usuário com login cadastrado
3. ❌ **As obras não aparecem no dropdown de vinculação**
4. ❓ **Não sabe como atribuir obras ao usuário**

---

## 🔧 Solução - Passo a Passo

### **ETAPA 1: Executar SQL de Políticas RLS** ⚠️ OBRIGATÓRIO

As obras não aparecem porque a tabela `obras` precisa de políticas RLS configuradas.

#### 1.1 Abra o Supabase Dashboard
- Acesse: https://supabase.com
- Faça login no seu projeto

#### 1.2 Vá para o SQL Editor
- Menu lateral → **SQL Editor**
- Clique em **New Query**

#### 1.3 Execute o Script
Copie e cole TODO o conteúdo do arquivo:
```
database/fix_obras_rls_policies.sql
```

Clique em **RUN** (ou pressione Ctrl+Enter)

#### 1.4 Verifique o Resultado
Você deve ver a mensagem:
```
Success. No rows returned
```

E no final, uma tabela mostrando 5 políticas criadas:
- Admin vê todas as obras
- Visualizador vê obras
- Admin pode criar obras
- Admin pode atualizar obras
- Admin pode deletar obras

---

### **ETAPA 2: Verificar Estrutura da Tabela `obras`**

Sua tabela `obras` deve ter pelo menos estas colunas:

```sql
-- Execute no SQL Editor para verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'obras' 
AND table_schema = 'public';
```

**Colunas esperadas:**
- ✅ `id` (uuid)
- ✅ `titulo` (text)
- ✅ `nome_cliente` (text)
- ✅ `finalizada` (boolean)
- ✅ `valor_total` ou `valor_venda_orcamento` (numeric/float)

---

### **ETAPA 3: Verificar o Role do Usuário Admin**

O sistema precisa que você esteja logado como **admin** para ver e vincular obras.

#### 3.1 Verificar seu usuário atual
```sql
-- Execute no SQL Editor
SELECT id, email, nome, role, permissao
FROM public.profiles
WHERE id = auth.uid();
```

#### 3.2 Se não aparecer `role = 'admin'`, execute:
```sql
-- Substitua 'SEU_EMAIL@AQUI.COM' pelo seu email de login
UPDATE public.profiles
SET role = 'admin', permissao = 'admin'
WHERE email = 'SEU_EMAIL@AQUI.COM';
```

---

### **ETAPA 4: Verificar se Tem Obras Cadastradas**

```sql
-- Execute no SQL Editor
SELECT id, titulo, nome_cliente, finalizada, created_at
FROM public.obras
WHERE finalizada = false
ORDER BY titulo;
```

**Resultado esperado:**
- Se retornar obras → ✅ Tudo certo, avance
- Se retornar vazio → ❌ Você precisa cadastrar obras primeiro

#### Como cadastrar obras (se necessário):
1. No sistema, vá para a aba **"Obras"**
2. Clique em **"+ Nova Obra"**
3. Preencha: Título, Cliente, Valor, etc.
4. Salve

---

### **ETAPA 5: Verificar se Tem Funcionários (Visualizadores)**

Para vincular uma obra, você precisa ter usuários com `role = 'visualizador'`.

```sql
-- Execute no SQL Editor
SELECT id, nome, email, role
FROM public.profiles
WHERE role = 'visualizador'
ORDER BY nome;
```

**Resultado esperado:**
- Se retornar usuários → ✅ Tudo certo
- Se retornar vazio → ❌ Você precisa criar funcionários

#### Como criar um funcionário:

**Opção A: Convidar por Email (Recomendado)**
1. No Supabase Dashboard → **Authentication** → **Users**
2. Clique em **Invite user**
3. Digite o email do funcionário
4. Ele receberá um email para criar senha
5. Depois, atualize o role:

```sql
-- Substitua 'EMAIL_DO_FUNCIONARIO' pelo email dele
UPDATE public.profiles
SET role = 'visualizador', permissao = 'visualizador'
WHERE email = 'EMAIL_DO_FUNCIONARIO';
```

**Opção B: Criar Manualmente no SQL**
```sql
-- 1. Primeiro, crie o usuário no Authentication (Dashboard)
-- 2. Depois pegue o ID dele:
SELECT id, email FROM auth.users WHERE email = 'EMAIL_DO_FUNCIONARIO';

-- 3. Insira/Atualize o perfil:
INSERT INTO public.profiles (id, nome, email, role, permissao)
VALUES (
  'ID_DO_USUARIO_AQUI',
  'Nome do Funcionário',
  'email@funcionario.com',
  'visualizador',
  'visualizador'
)
ON CONFLICT (id) DO UPDATE
SET role = 'visualizador', permissao = 'visualizador';
```

---

### **ETAPA 6: Testar a Vinculação**

Agora que tudo está configurado:

#### 6.1 Faça login como Admin
- Email: seu_email_admin
- Senha: sua_senha

#### 6.2 Acesse `/cards-de-obra`
- No menu, clique em **"Cards de Obra"**
- Ou digite na URL: `http://localhost:3000/cards-de-obra`

#### 6.3 Clique em "Vincular Obra Existente"
- Você deve ver um dropdown com suas obras cadastradas
- E um dropdown com os funcionários (visualizadores)

#### 6.4 Preencha o formulário:
1. **Obra Cadastrada**: Selecione uma obra da lista
2. **Funcionário**: Selecione o funcionário que vai gerenciar
3. **Verba Inicial** (opcional): Ex: 5000 (se quiser já enviar dinheiro)
4. Clique em **"Vincular Obra"**

#### 6.5 Resultado:
✅ Um novo **Card de Obra** será criado automaticamente com:
- Título da obra
- Cliente da obra
- Valor orçado
- Funcionário responsável
- Saldo inicial (se você preencheu)

---

## 🐛 Troubleshooting (Problemas Comuns)

### ❌ "Nenhuma obra disponível"

**Causa:** Tabela `obras` vazia ou políticas RLS bloqueando

**Solução:**
```sql
-- 1. Verificar se tem obras
SELECT COUNT(*) FROM public.obras WHERE finalizada = false;

-- 2. Se retornar 0, cadastre obras pela interface
-- 3. Se retornar > 0 mas não aparece, verifique RLS:
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'obras';
```

### ❌ "Nenhum funcionário encontrado"

**Causa:** Nenhum usuário com `role = 'visualizador'`

**Solução:**
```sql
-- Verificar funcionários
SELECT email, role FROM public.profiles WHERE role = 'visualizador';

-- Se vazio, promover um usuário existente:
UPDATE public.profiles
SET role = 'visualizador'
WHERE email = 'funcionario@empresa.com';
```

### ❌ "Erro 406 (Not Acceptable)"

**Causa:** Políticas RLS não executadas

**Solução:**
- Execute `database/fix_obras_rls_policies.sql` novamente
- Faça logout e login novamente no sistema

### ❌ "Dropdown vazio mesmo com obras cadastradas"

**Causa:** Campo `finalizada` está TRUE

**Solução:**
```sql
-- Verificar status das obras
SELECT titulo, finalizada FROM public.obras;

-- Reabrir obras finalizadas:
UPDATE public.obras
SET finalizada = false
WHERE titulo = 'NOME_DA_OBRA';
```

---

## 📊 Diagrama do Fluxo

```
┌─────────────────────────────────────────────────────────┐
│  ADMIN FAZ LOGIN                                         │
│  └─> Sistema verifica: role = 'admin' ✓                │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  ADMIN ACESSA /cards-de-obra                            │
│  └─> Carrega obras: SELECT * FROM obras WHERE           │
│      finalizada = false (via RLS Policy)                │
│  └─> Carrega funcionários: SELECT * FROM profiles       │
│      WHERE role = 'visualizador'                        │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  ADMIN CLICA "VINCULAR OBRA EXISTENTE"                  │
│  └─> Modal abre com 2 dropdowns preenchidos            │
│      • Obras: [Fachada ENF CLINIC, Pintura Escritório] │
│      • Funcionários: [João Silva, Maria Santos]         │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  ADMIN SELECIONA                                        │
│  • Obra: "Fachada ENF CLINIC"                          │
│  • Funcionário: "João Silva"                            │
│  • Verba: R$ 5.000,00                                   │
│  └─> Clica "Vincular Obra"                             │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  SISTEMA CRIA CARD DE OBRA                              │
│  INSERT INTO cards_de_obra:                             │
│  • titulo: "Fachada ENF CLINIC"                         │
│  • nome_cliente: (copiado da obra)                      │
│  • valor_venda_orcamento: (copiado da obra)             │
│  • id_visualizador_responsavel: João Silva (ID)         │
│  • saldo_atual: 5000                                    │
│  • status: 'EM_ANDAMENTO'                               │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  ✅ CARD CRIADO COM SUCESSO!                            │
│  └─> Admin vê card na lista                            │
│  └─> João Silva vê card em /minhas-obras               │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Checklist Final

Antes de vincular uma obra, confirme:

- [ ] ✅ Executei `fix_obras_rls_policies.sql` no Supabase
- [ ] ✅ Estou logado como admin (`role = 'admin'`)
- [ ] ✅ Tenho obras cadastradas na aba "Obras"
- [ ] ✅ Obras tem `finalizada = false`
- [ ] ✅ Tenho pelo menos 1 usuário com `role = 'visualizador'`
- [ ] ✅ Recarreguei a página após executar SQL
- [ ] ✅ Console não mostra erro 406

Se todos os itens estão marcados, a vinculação deve funcionar! 🎉

---

## 📞 Ainda Não Funciona?

Se seguiu todos os passos e ainda não funciona:

1. **Abra o Console do navegador** (F12)
2. **Vá para a aba Network**
3. **Clique em "Vincular Obra Existente"**
4. **Procure por requisições com erro** (em vermelho)
5. **Copie a mensagem de erro completa**
6. **Me envie para análise**

Ou execute este script de diagnóstico:

```sql
-- DIAGNÓSTICO COMPLETO
SELECT 
  'Usuário atual' as tipo,
  email, 
  role,
  permissao
FROM public.profiles 
WHERE id = auth.uid()

UNION ALL

SELECT 
  'Total de obras disponíveis' as tipo,
  COUNT(*)::text,
  '',
  ''
FROM public.obras 
WHERE finalizada = false

UNION ALL

SELECT 
  'Total de funcionários' as tipo,
  COUNT(*)::text,
  '',
  ''
FROM public.profiles 
WHERE role = 'visualizador';
```

---

**Criado em:** 4 de novembro de 2025  
**Sistema:** PEPERAIO - Gestão de Obras  
**Versão:** 2.0
