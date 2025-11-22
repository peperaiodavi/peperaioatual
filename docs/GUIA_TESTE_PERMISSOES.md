# 🧪 GUIA DE TESTE - SISTEMA DE PERMISSÕES

## 📋 PASSO A PASSO PARA TESTAR

### **1. Verificar o Banco de Dados**

Execute no **SQL Editor do Supabase**:

```sql
-- Ver todas as permissões do usuário Isaac
SELECT * FROM permissoes_usuario 
WHERE usuario_id = (SELECT id FROM auth.users WHERE email ILIKE '%isaac%');
```

Se não retornar nada, execute:

```sql
-- Ver todos os usuários
SELECT id, email FROM auth.users;
```

Copie o UUID do Isaac e execute:

```sql
-- Ver permissões do Isaac
SELECT * FROM permissoes_usuario WHERE usuario_id = 'COLE-O-UUID-AQUI';
```

---

### **2. Forçar Permissões para o Isaac (TESTE)**

Execute isso para dar **todas as permissões de visualização de páginas**:

```sql
UPDATE permissoes_usuario
SET 
  pode_acessar_dashboard = true,
  pode_acessar_obras = true,
  pode_acessar_caixa = true,
  pode_acessar_funcionarios = true,
  pode_acessar_propostas = true,
  pode_acessar_compromissos = true,
  pode_acessar_cards_obra = true,
  pode_acessar_orcamento = true,
  pode_acessar_minhas_obras = true,
  pode_acessar_calendario = true,
  pode_visualizar = true,
  pode_visualizar_saldo = true
WHERE usuario_id = (SELECT id FROM auth.users WHERE email ILIKE '%isaac%');
```

---

### **3. Verificar no Console do Navegador**

1. **Faça logout** de qualquer conta
2. **Faça login com Isaac**
3. Abra o **DevTools** (F12) → Aba **Console**
4. Procure por:

```
🔍 PermissaoContext: Buscando permissões para usuário...
✅ PermissaoContext: Permissões carregadas do banco
🎯 PermissaoContext: Permissões finais do contexto
🎨 MainNavbar: Permissões carregadas
🎯 IOSDock: Permissões carregadas
```

5. Verifique se `pode_acessar_obras: true` aparece nos logs

---

### **4. O Que Você Deve Ver**

✅ **No Menu Lateral (MainNavbar):**
- Dashboard
- Funcionários (se habilitado)
- Propostas (se habilitado)
- **Obras** ← DEVE APARECER
- Caixa (se habilitado)
- Minha Conta

✅ **No Dock Inferior (IOSDock):**
- Ícone "Início"
- Ícone **"Obras"** ← DEVE APARECER
- Ícone "Financeiro" (se habilitado)
- Ícone "Configurações"

---

### **5. Testar Alterações pelo Gerenciamento**

1. **Logout do Isaac**
2. **Login como Admin**
3. Vá em **Minha Conta** → **Gerenciar Usuários**
4. Selecione **Isaac**
5. Clique em **Editar Permissões**
6. **DESMARQUE** "Obras"
7. Clique em **Salvar**
8. **Logout e login novamente com Isaac**
9. A aba "Obras" **deve sumir**

---

### **6. Verificar Após Salvar**

Execute no Supabase para confirmar que salvou:

```sql
SELECT 
  u.email,
  p.pode_acessar_obras,
  p.pode_acessar_caixa,
  p.updated_at
FROM permissoes_usuario p
JOIN auth.users u ON u.id = p.usuario_id
WHERE u.email ILIKE '%isaac%';
```

---

## 🚨 TROUBLESHOOTING

### **Problema: Permissões não mudam após salvar**

**Solução 1:** Force o refresh do contexto
- Faça **logout completo**
- Limpe o cache: `Ctrl+Shift+Del` → Limpar tudo
- Faça **login novamente**

**Solução 2:** Verificar RLS Policies
```sql
-- Ver se o usuário pode ler suas próprias permissões
SELECT * FROM permissoes_usuario WHERE usuario_id = auth.uid();
```

**Solução 3:** Verificar se o registro existe
```sql
-- Se não existir, criar manualmente
INSERT INTO permissoes_usuario (
  usuario_id,
  pode_acessar_dashboard, pode_acessar_obras, pode_acessar_caixa
) VALUES (
  (SELECT id FROM auth.users WHERE email ILIKE '%isaac%'),
  true, true, true
) ON CONFLICT (usuario_id) DO UPDATE SET
  pode_acessar_obras = true;
```

---

### **Problema: Abas não aparecem mesmo com permissões = true**

**Causa:** O contexto não está recarregando ou está usando cache

**Solução:**
1. Abra o DevTools → Application → Storage
2. Limpe **Local Storage** e **Session Storage**
3. Force refresh: `Ctrl+Shift+R`
4. Verifique os logs no console novamente

---

### **Problema: Erro "usuario_id does not exist"**

**Causa:** Campo errado na query (corrigido na versão atual)

**Verificar:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'permissoes_usuario';
```

Deve mostrar `usuario_id`, não `user_id`

---

## ✅ CHECKLIST FINAL

- [ ] Executar diagnóstico SQL
- [ ] Ver permissões do Isaac no banco
- [ ] Forçar permissões para teste
- [ ] Fazer login com Isaac
- [ ] Verificar logs no console
- [ ] Verificar menu lateral
- [ ] Verificar dock inferior
- [ ] Testar alteração pelo gerenciamento
- [ ] Confirmar que mudanças salvam no banco
- [ ] Verificar que frontend atualiza

---

**Data:** 19 de novembro de 2025  
**Sistema:** PEPERAIO - Gestão de Obras
