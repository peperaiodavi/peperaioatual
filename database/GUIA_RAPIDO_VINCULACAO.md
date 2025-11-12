# 🚀 Guia Rápido: Vincular Obras a Funcionários

## ⚡ RESOLUÇÃO RÁPIDA (3 Passos)

### 📋 **PASSO 1: Execute o SQL de Políticas** (2 minutos)

1. Abra o **Supabase Dashboard** → **SQL Editor**
2. Copie e cole o arquivo: `database/fix_obras_rls_policies.sql`
3. Clique em **RUN**
4. ✅ Deve mostrar: "Success. No rows returned"

---

### 🔍 **PASSO 2: Execute o Diagnóstico** (1 minuto)

1. No **SQL Editor**, abra um novo query
2. Copie e cole o arquivo: `database/diagnostico_vinculacao.sql`
3. Clique em **RUN**
4. 📊 Leia os resultados:

**Resultado Ideal:**
```
1️⃣ USUÁRIO ATUAL
✅ Role: admin

2️⃣ OBRAS DISPONÍVEIS
✅ Total: 5 obras

3️⃣ FUNCIONÁRIOS
✅ Total: 2 funcionários

4️⃣ POLÍTICAS RLS - OBRAS
✅ 5 políticas encontradas

9️⃣ AÇÕES RECOMENDADAS
✅ TUDO CONFIGURADO! Sistema pronto para vincular obras.
```

**Se algo estiver ❌:**
- Siga as instruções em "AÇÕES RECOMENDADAS"
- Execute os comandos SQL sugeridos

---

### 🎯 **PASSO 3: Vincule a Obra** (1 minuto)

1. No sistema, faça login como **admin**
2. Vá para **Menu → Cards de Obra**
3. Clique no botão **"Vincular Obra Existente"**
4. Preencha:
   - **Obra**: Selecione da lista
   - **Funcionário**: Selecione o usuário
   - **Verba**: Ex: 5000 (opcional)
5. Clique em **"Vincular Obra"**
6. ✅ **Sucesso!** O card foi criado

---

## 🐛 Problemas Comuns

### ❌ "Nenhuma obra disponível"

**Causa:** Não tem obras cadastradas OU obras estão finalizadas

**Solução Rápida:**
```sql
-- Ver obras
SELECT titulo, finalizada FROM public.obras;

-- Se estiver finalizada = true, reabra:
UPDATE public.obras SET finalizada = false WHERE id = 'ID_AQUI';
```

**OU** cadastre nova obra:
- Menu → **Obras** → **+ Nova Obra**

---

### ❌ "Nenhum funcionário encontrado"

**Causa:** Não tem usuários com role = 'visualizador'

**Solução Rápida:**
```sql
-- Ver usuários
SELECT email, role FROM public.profiles;

-- Transformar em visualizador:
UPDATE public.profiles 
SET role = 'visualizador', permissao = 'visualizador'
WHERE email = 'funcionario@email.com';
```

**OU** crie novo usuário:
- Supabase → **Authentication** → **Invite User**

---

### ❌ "Erro 406" no console

**Causa:** Políticas RLS não configuradas

**Solução:**
1. Execute `database/fix_obras_rls_policies.sql`
2. Faça **logout** e **login** novamente
3. Recarregue a página (F5)

---

## 📞 Ainda com dúvida?

1. Abra o **Console** do navegador (F12)
2. Clique em **"Vincular Obra Existente"**
3. Veja as mensagens no console:

```
🔍 Carregando obras disponíveis...
✅ 3 obras encontradas: [...]

👥 Carregando funcionários...
✅ 2 funcionários encontrados: [...]
```

Se aparecer ❌ em vermelho, copie a mensagem de erro e me envie.

---

## 📊 Fluxo Visual

```
     ADMIN
       |
       v
[Menu → Cards de Obra]
       |
       v
[Vincular Obra Existente]
       |
       v
┌──────────────────────┐
│  Dropdown: OBRAS     │ ← Vem da tabela 'obras'
│  • Fachada Clinic    │   WHERE finalizada = false
│  • Pintura Escrit.   │
└──────────────────────┘
       |
       v
┌──────────────────────┐
│  Dropdown: FUNC.     │ ← Vem da tabela 'profiles'
│  • João Silva        │   WHERE role = 'visualizador'
│  • Maria Santos      │
└──────────────────────┘
       |
       v
┌──────────────────────┐
│  Verba: R$ 5.000     │ ← Opcional
└──────────────────────┘
       |
       v
   [Vincular]
       |
       v
┌──────────────────────┐
│  ✅ CARD CRIADO!     │
│  • Título: Fachada   │
│  • Cliente: (auto)   │
│  • Valor: (auto)     │
│  • Responsável: João │
│  • Saldo: R$ 5.000   │
└──────────────────────┘
```

---

## 📝 Checklist Final

Antes de vincular, confirme:

- [ ] ✅ Executei `fix_obras_rls_policies.sql`
- [ ] ✅ Executei `diagnostico_vinculacao.sql`
- [ ] ✅ Sou admin (role = 'admin')
- [ ] ✅ Tenho obras com finalizada = false
- [ ] ✅ Tenho usuários com role = 'visualizador'
- [ ] ✅ Console mostra "✅ X obras encontradas"
- [ ] ✅ Console mostra "✅ X funcionários encontrados"

**Todos marcados?** → Pronto para vincular! 🎉

---

**Criado:** 4 nov 2025 | **Sistema:** PEPERAIO v2.0
