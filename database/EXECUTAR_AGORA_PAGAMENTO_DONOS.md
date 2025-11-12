# 🚀 EXECUTAR AGORA - Sistema de Pagamento dos Donos

## ⚡ Setup Rápido (5 minutos)

### ⚠️ IMPORTANTE: Aparecem Avisos no Card?

Se você ver este aviso no card do dono:

```
⚠️ Usuário não vinculado!
Configure email e usuario_id no banco para habilitar 
pagamentos ao dashboard pessoal.
```

**Isso significa que você PRECISA executar os passos abaixo!**

---

### 1️⃣ Execute o Script SQL no Supabase

**Abra**: Supabase Dashboard → SQL Editor → New Query

**Cole e Execute**:
```sql
-- 1. Atualizar dados dos donos
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

-- 2. Vincular usuario_id
UPDATE funcionarios f
SET usuario_id = u.id
FROM usuarios u
WHERE u.email = 'marcospaulopeperaio@gmail.com'
  AND f.email = 'marcospaulopeperaio@gmail.com'
  AND f.categoria = 'dono';

UPDATE funcionarios f
SET usuario_id = u.id
FROM usuarios u
WHERE u.email = 'isaacpeperaio@gmail.com'
  AND f.email = 'isaacpeperaio@gmail.com'
  AND f.categoria = 'dono';

-- 3. Verificar
SELECT 
  id,
  nome,
  categoria,
  email,
  usuario_id,
  salario_mensal
FROM funcionarios
WHERE categoria = 'dono'
ORDER BY nome;
```

### 2️⃣ Verifique os Usuários

**Execute**:
```sql
SELECT id, email, nome
FROM usuarios
WHERE email IN ('marcospaulopeperaio@gmail.com', 'isaacpeperaio@gmail.com')
ORDER BY email;
```

**❌ Se não retornar nada**, você precisa criar os usuários primeiro através do sistema de autenticação ou SQL.

### 3️⃣ Teste o Sistema

1. Acesse o sistema como **admin**
2. Vá em **Funcionários** no menu
3. Localize o card de **Marcos Paulo** ou **Isaac**
4. Clique em **Ver Detalhes**
5. Você deve ver 3 botões:
   - 🟡 Registrar Saída
   - 🟣 **Efetuar Pagamento** ← NOVO
   - 🔵 **Editar Salário (R$ 5.000,00)** ← NOVO

---

## 🎯 Como Fazer um Pagamento (Teste)

1. Clique em **"Efetuar Pagamento"**
2. Preencha:
   - **Valor**: 100.00 (teste pequeno)
   - **Data**: hoje
   - **Observação**: "Teste de pagamento"
3. Clique **"Transferir Valor"**
4. ✅ Deve aparecer toast de sucesso
5. **Verifique**:
   - Vá em **Caixa** → Veja saída de R$ 100,00
   - Faça login com conta do dono → **Financeiro Pessoal** → Veja entrada de R$ 100,00

---

## 🎨 O que foi Implementado

### Botões no Card dos Donos
```
┌────────────────────────────────────┐
│  👤 Marcos Paulo / Isaac           │
│  ⭐ Dono                            │
├────────────────────────────────────┤
│  📋 Ver Detalhes                   │
│                                    │
│  [🟡 Registrar Saída]              │
│  [🟣 Efetuar Pagamento]    ← NOVO │
│  [🔵 Editar Salário R$ 5.000] ← NOVO│
└────────────────────────────────────┘
```

### Modal "Efetuar Pagamento"
- Campo: Valor (R$)
- Campo: Data
- Campo: Observação
- Botão: "Transferir Valor" (roxo pulsante)

### Modal "Editar Salário"
- Campo: Salário Mensal (pré-preenchido)
- Info: 💡 Usado como referência
- Botão: "Atualizar Salário" (turquesa pulsante)

---

## 🔍 Troubleshooting Rápido

### ❌ Botões não aparecem
**Causa**: Falta configuração no banco

**Solução**:
```sql
-- Verifique se tem email e usuario_id
SELECT nome, email, usuario_id FROM funcionarios WHERE categoria = 'dono';
```

Se `email` ou `usuario_id` estiverem NULL, execute o script do passo 1️⃣ novamente.

### ❌ Erro ao transferir
**Causa**: usuario_id não existe na tabela usuarios

**Solução**:
```sql
-- Verifique se os usuários existem
SELECT * FROM usuarios 
WHERE email IN ('marcospaulopeperaio@gmail.com', 'isaacpeperaio@gmail.com');
```

Se não existir, crie as contas através do sistema de login primeiro.

### ❌ Valor não aparece no dashboard pessoal
**Causa**: RLS policy ou usuario_id incorreto

**Solução**:
```sql
-- Verifique se a transação foi criada
SELECT * FROM transacoes_pessoais 
WHERE usuario_id IN (
  SELECT usuario_id FROM funcionarios WHERE categoria = 'dono'
)
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📋 Checklist de Verificação

Marque conforme for testando:

- [ ] Script SQL executado sem erros
- [ ] Query de verificação retorna 2 donos (Marcos e Isaac)
- [ ] Ambos têm `email` preenchido
- [ ] Ambos têm `usuario_id` preenchido (não NULL)
- [ ] Ambos têm `salario_mensal = 5000.00`
- [ ] Botões aparecem no card dos donos
- [ ] Modal "Efetuar Pagamento" abre
- [ ] Modal "Editar Salário" abre e mostra R$ 5.000,00
- [ ] Teste de pagamento cria saída no caixa empresarial
- [ ] Teste de pagamento cria entrada no dashboard pessoal do dono
- [ ] Edição de salário atualiza valor no banco
- [ ] Label do botão atualiza após editar salário

---

## 🎉 Pronto!

Se todos os checkpoints passaram, o sistema está **100% funcional**!

**Próximos passos**:
- Use normalmente para pagamentos mensais
- Ajuste salários conforme necessário
- Consulte histórico no Caixa e Financeiro Pessoal

**Documentação completa**: `docs/SISTEMA_PAGAMENTO_DONOS.md`

---

**Dúvidas?** Consulte:
- 📖 `docs/README_PAGAMENTO_DONOS_COMPLETO.md` - Documentação técnica
- 🔧 `database/setup_donos_pagamento.sql` - Script completo
- 💻 `src/pages/Funcionarios.tsx` - Código fonte
