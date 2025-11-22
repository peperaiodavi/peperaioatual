# 🔧 Correção do Sistema de Permissões Granulares

## 📋 Problemas Identificados

### 1. **Campo incorreto na query do banco de dados**
**Problema:** O código estava buscando com `user_id` mas o banco de dados usa `usuario_id`

**Arquivo:** `src/context/PermissaoContext.tsx`

**Antes:**
```typescript
.eq('user_id', user.id)
```

**Depois:**
```typescript
.eq('usuario_id', user.id)
```

---

### 2. **Interface TypeScript incompatível com o schema do banco**
**Problema:** Os nomes dos campos na interface não correspondiam aos nomes reais das colunas no banco de dados

**Exemplos de incompatibilidade:**
- ❌ `pode_criar_obras` → ✅ `pode_criar_obra`
- ❌ `pode_criar_transacoes` → ✅ `pode_criar_transacao`
- ❌ `pode_acessar_diarias` → ❌ Não existe no banco
- ❌ `pode_acessar_automacao_pdf` → ❌ Não existe no banco

**Solução:** Interface completamente reescrita para corresponder exatamente ao schema SQL em `setup_permissoes_granulares.sql`

---

### 3. **Navegação ignorando permissões granulares**
**Problema:** Os componentes `MainNavbar.tsx` e `IOSDock.tsx` usavam apenas `isAdmin` para controlar visibilidade, ignorando as permissões específicas

**Antes (MainNavbar):**
```typescript
const { isAdmin } = usePermissao();
const menuItems = isAdmin ? adminMenuItems : visualizadorMenuItems;
```

**Depois:**
```typescript
const permissoes = usePermissao();
const menuItems = [
  permissoes.pode_acessar_dashboard && { ... },
  permissoes.pode_acessar_obras && { ... },
  // etc
].filter(Boolean);
```

---

## ✅ Correções Implementadas

### 1. **PermissaoContext.tsx**
- ✅ Corrigido campo `usuario_id` na query
- ✅ Interface `PermissoesGranulares` reescrita com nomes corretos
- ✅ Função `getPermissoesPadrao()` atualizada
- ✅ Adicionados logs de debug para facilitar troubleshooting
- ✅ Permissões de retrocompatibilidade atualizadas

### 2. **MainNavbar.tsx**
- ✅ Menu agora construído dinamicamente baseado nas permissões do usuário
- ✅ Cada item de menu verifica a permissão específica antes de aparecer
- ✅ Suporte completo ao sistema de permissões granulares

### 3. **IOSDock.tsx**
- ✅ Apps do dock criados dinamicamente baseado nas permissões
- ✅ Ícones aparecem/desaparecem conforme o acesso do usuário
- ✅ Importado `usePermissao` hook

---

## 🔍 Sistema de Debug

O sistema agora inclui logs detalhados para facilitar a identificação de problemas:

### Logs no Console:
```
🔒 PermissaoContext: Usuário não autenticado
🔍 PermissaoContext: Buscando permissões para usuário: [uuid]
⚠️ PermissaoContext: Erro ao buscar permissões (usando padrão): [mensagem]
✅ PermissaoContext: Permissões carregadas do banco: [objeto]
📋 PermissaoContext: Aplicando permissões padrão para [tipo]
🎯 PermissaoContext: Permissões finais do contexto: [resumo]
```

---

## 🧪 Como Testar

### Passo 1: Verificar logs no Console
1. Abra o DevTools (F12)
2. Vá para a aba Console
3. Faça login com o usuário Isaac
4. Procure pelos logs do `PermissaoContext`
5. Verifique se as permissões estão sendo carregadas do banco

### Passo 2: Configurar permissões no Gerenciamento
1. Faça login como **admin/proprietário**
2. Vá em **Minha Conta** → **Gerenciar Usuários**
3. Encontre o usuário **Isaac**
4. Clique em **Editar Permissões**
5. **MARQUE** a opção **"Obras"** na seção **"Acesso a Páginas"**
6. Clique em **Salvar**

### Passo 3: Testar com o usuário Isaac
1. **Saia da conta** do admin
2. **Faça login com Isaac**
3. Verifique:
   - ✅ A aba **"Obras"** deve aparecer no menu lateral (MainNavbar)
   - ✅ O ícone de **"Obras"** deve aparecer no dock inferior (IOSDock)
   - ✅ Isaac deve conseguir navegar para `/obras-hub`

### Passo 4: Verificar no Console
Ao fazer login com Isaac, você deve ver:
```
✅ PermissaoContext: Permissões carregadas do banco: {
  pode_acessar_obras: true,
  pode_acessar_dashboard: true,
  ...
}
```

---

## 📊 Estrutura das Permissões

### Acesso a Páginas
- `pode_acessar_dashboard`
- `pode_acessar_obras`
- `pode_acessar_caixa`
- `pode_acessar_funcionarios`
- `pode_acessar_compromissos`
- `pode_acessar_propostas`
- `pode_acessar_cards_obra`
- `pode_acessar_orcamento`
- `pode_acessar_minhas_obras`
- `pode_acessar_calendario`

### Ações Globais
- `pode_criar`
- `pode_editar`
- `pode_excluir`
- `pode_visualizar`
- `pode_exportar`
- `pode_gerenciar_permissoes`

### Permissões Específicas por Módulo
**Caixa:** `pode_criar_transacao`, `pode_editar_transacao`, etc.
**Obras:** `pode_criar_obra`, `pode_editar_obra`, etc.
**Funcionários:** `pode_criar_funcionario`, etc.
**Propostas:** `pode_criar_proposta`, etc.
**Cards de Obra:** `pode_criar_card_obra`, etc.

---

## 🎯 Comportamento Esperado

### Admin/Proprietário
- ✅ Vê **todas** as abas no menu
- ✅ Todos os ícones aparecem no dock
- ✅ Tem **acesso completo** a todas as funcionalidades

### Visualizador (Padrão)
- ✅ Vê **todas** as abas (conforme definido no SQL)
- ✅ Pode **visualizar** tudo
- ❌ **Não pode criar/editar/excluir** (exceto Propostas)
- ✅ Propostas: **acesso completo** para criar/editar/excluir

### Visualizador (Customizado)
- ✅ Vê apenas as abas que o **admin habilitou**
- ✅ Permissões individuais por ação
- ✅ Menu e dock se adaptam dinamicamente

---

## 🚨 Troubleshooting

### Problema: Permissões não aparecem após salvar
**Solução:** 
1. Verifique o console por erros
2. Confirme que o `usuario_id` está correto no banco
3. Execute: `SELECT * FROM permissoes_usuario WHERE usuario_id = '[uuid-do-isaac]'`

### Problema: Abas não aparecem/desaparecem
**Solução:**
1. Force o refresh do navegador (Ctrl+Shift+R)
2. Limpe o cache do localStorage
3. Verifique os logs do `PermissaoContext` no console

### Problema: Erro "user_id não existe"
**Solução:** Já corrigido! Era o bug principal - agora usa `usuario_id`

---

## 📝 Notas Importantes

1. **Sincronização com o Banco:** As permissões agora são carregadas **diretamente do banco** via Supabase
2. **Cache:** O contexto recarrega as permissões sempre que o usuário muda
3. **Fallback:** Se não houver permissões no banco, usa as permissões padrão baseadas em `permissao` (admin/visualizador)
4. **Performance:** As permissões são carregadas **uma vez** por sessão e armazenadas em contexto React

---

## 🔄 Próximos Passos (Opcional)

- [ ] Adicionar cache de permissões no localStorage (otimização)
- [ ] Implementar refresh de permissões em tempo real (via Supabase Realtime)
- [ ] Criar tela de histórico de alterações de permissões (auditoria)
- [ ] Adicionar validação de permissões no backend (segurança extra)

---

**Criado em:** 19 de novembro de 2025  
**Sistema:** PEPERAIO - Gestão de Obras  
**Versão:** 1.0
