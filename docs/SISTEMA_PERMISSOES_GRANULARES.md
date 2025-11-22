# 🔐 Sistema de Gerenciamento de Permissões Granulares

## 📋 Visão Geral

Sistema completo de controle de permissões com design iOS premium, permitindo que proprietários gerenciem exatamente o que cada usuário pode fazer no sistema.

## ✨ Funcionalidades

### 🎯 Controle Granular
- ✅ Permissões por página (Dashboard, Caixa, Obras, etc.)
- ✅ Permissões por ação (Criar, Editar, Excluir, Visualizar)
- ✅ Permissões específicas por módulo (Caixa, Obras, Funcionários, etc.)
- ✅ Sistema de presets (Proprietário, Visualizador)
- ✅ Auditoria de alterações de permissões

### 🎨 Interface iOS Premium
- ✅ Design moderno e minimalista
- ✅ Animações suaves e fluidas
- ✅ Cards expansíveis com detalhes
- ✅ Toggle switches estilo iOS
- ✅ Barra de progresso de permissões
- ✅ Responsivo para mobile

## 🚀 Instalação

### 1. Executar SQL no Supabase

```bash
# No Supabase Dashboard, vá para SQL Editor e execute:
database/setup_permissoes_granulares.sql
```

Este script irá:
- ✅ Criar tabela `permissoes_usuario` com 40+ campos de permissões
- ✅ Criar triggers automáticos para novos usuários
- ✅ Configurar políticas RLS
- ✅ Migrar dados existentes
- ✅ Criar sistema de auditoria
- ✅ Criar funções de preset

### 2. Verificar Instalação

```sql
-- Ver todas as permissões de um usuário
SELECT * FROM permissoes_usuario WHERE usuario_id = auth.uid();

-- Verificar permissão específica
SELECT tem_permissao('pode_criar_obra');

-- Ver usuários com permissões
SELECT * FROM v_usuarios_com_permissoes;
```

## 📖 Uso

### Na Página "Minha Conta"

1. **Acesse**: `/minha-conta`
2. **Seção de Permissões**: Proprietários verão a seção de gerenciamento
3. **Expandir Usuário**: Clique em "Ver" para ver as permissões
4. **Editar Permissões**: Clique em "Editar" para modificar
5. **Aplicar Preset**: Use os botões de preset para configuração rápida
6. **Customizar**: Expanda categorias e toggle permissões individuais
7. **Salvar**: Clique em "Salvar" para aplicar alterações

### Presets Disponíveis

#### 👑 Proprietário (Dourado)
- ✅ Acesso total a todas as páginas
- ✅ Todas as permissões de criação, edição e exclusão
- ✅ Pode gerenciar permissões de outros usuários
- ✅ Acesso a configurações avançadas
- ✅ Pode exportar dados

#### 👁️ Visualizador (Azul)
- ✅ Acesso a TODAS as páginas do sistema
- ✅ Pode visualizar todos os dados (Dashboard, Caixa, Obras, Orçamento, etc.)
- ✅ Pode ver saldos e valores
- ✅ **EXCEÇÃO: Propostas/PDF** - Acesso completo (criar, editar, excluir)
- ❌ Não pode criar, editar ou excluir em outras áreas
- ❌ Não pode gerenciar permissões
- ❌ Não pode exportar dados

**Ideal para:** Funcionários que precisam consultar informações mas não devem modificar dados críticos, exceto trabalhar com propostas/PDFs.

## 🎨 Categorias de Permissões

### 1. Acesso a Páginas (10 permissões)
```typescript
- pode_acessar_dashboard
- pode_acessar_caixa
- pode_acessar_obras
- pode_acessar_orcamento
- pode_acessar_propostas
- pode_acessar_compromissos
- pode_acessar_cards_obra
- pode_acessar_funcionarios
- pode_acessar_minhas_obras
- pode_acessar_calendario
```

### 2. Ações Globais (6 permissões)
```typescript
- pode_criar
- pode_editar
- pode_excluir
- pode_visualizar
- pode_exportar
- pode_gerenciar_permissoes  // Controle total
```

### 3. Caixa (5 permissões)
```typescript
- pode_criar_transacao
- pode_editar_transacao
- pode_excluir_transacao
- pode_visualizar_saldo
- pode_gerenciar_categorias
```

### 4. Obras (5 permissões)
```typescript
- pode_criar_obra
- pode_editar_obra
- pode_excluir_obra
- pode_finalizar_obra
- pode_gerenciar_gastos_obra
```

### 5. Orçamento (3 permissões)
```typescript
- pode_criar_orcamento
- pode_editar_orcamento
- pode_aprovar_orcamento
```

### 6. Propostas (4 permissões)
```typescript
- pode_criar_proposta
- pode_editar_proposta
- pode_excluir_proposta
- pode_visualizar_valores_proposta
```

### 7. Funcionários (5 permissões)
```typescript
- pode_criar_funcionario
- pode_editar_funcionario
- pode_excluir_funcionario
- pode_gerenciar_pagamentos
- pode_registrar_diarias
```

### 8. Cards de Obra (4 permissões)
```typescript
- pode_criar_card_obra
- pode_editar_card_obra
- pode_transferir_verba
- pode_finalizar_card
```

## 🔧 Integração com Frontend

### Verificar Permissões no React

```typescript
import { usePermissao } from '../context/PermissaoContext';

function MeuComponente() {
  const { 
    canCreate,      // pode_criar
    canEdit,        // pode_editar
    canDelete,      // pode_excluir
    isAdmin         // pode_gerenciar_permissoes
  } = usePermissao();

  // Verificação específica (futuro)
  const podeAcessarCaixa = usePermissaoEspecifica('pode_acessar_caixa');

  return (
    <div>
      {canCreate && <button>Criar</button>}
      {canEdit && <button>Editar</button>}
      {canDelete && <button>Excluir</button>}
    </div>
  );
}
```

### Proteger Rotas

```typescript
import { Navigate } from 'react-router-dom';
import { usePermissao } from '../context/PermissaoContext';

function ProtectedRoute({ children, requiredPermission }) {
  const { hasPermission } = usePermissao();
  
  if (!hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

// Uso
<ProtectedRoute requiredPermission="pode_acessar_caixa">
  <PaginaCaixa />
</ProtectedRoute>
```

## 📊 Estrutura de Dados

### Tabela: permissoes_usuario

```sql
CREATE TABLE permissoes_usuario (
  id UUID PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id),
  
  -- 40+ campos de permissões booleanas
  pode_acessar_dashboard BOOLEAN,
  pode_criar BOOLEAN,
  pode_editar BOOLEAN,
  -- ... e muitos outros
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  UNIQUE(usuario_id)
);
```

### Tabela: log_permissoes (Auditoria)

```sql
CREATE TABLE log_permissoes (
  id UUID PRIMARY KEY,
  usuario_alterado_id UUID,
  usuario_responsavel_id UUID,
  campo_alterado TEXT,
  valor_antigo BOOLEAN,
  valor_novo BOOLEAN,
  created_at TIMESTAMP
);
```

## 🛡️ Segurança (RLS)

### Políticas Implementadas

```sql
-- Proprietários podem ver todas as permissões
CREATE POLICY "Proprietários podem ver todas as permissões"
  ON permissoes_usuario FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM permissoes_usuario p
      WHERE p.usuario_id = auth.uid()
      AND p.pode_gerenciar_permissoes = true
    )
  );

-- Usuários podem ver apenas suas próprias permissões
CREATE POLICY "Usuários podem ver suas permissões"
  ON permissoes_usuario FOR SELECT
  USING (usuario_id = auth.uid());
```

## 🎯 Casos de Uso

### Caso 1: Adicionar Novo Funcionário
```typescript
// 1. Criar usuário no Auth
// 2. Permissões são criadas automaticamente via trigger
// 3. Por padrão, recebe preset "Visualizador"
// 4. Proprietário pode personalizar depois
```

### Caso 2: Promover a Proprietário
```typescript
// No componente GerenciamentoPermissoes
<PresetButton 
  preset="proprietario"
  onClick={() => aplicarPreset(usuarioId, 'proprietario')}
/>

// SQL function é chamada automaticamente
// SELECT aplicar_preset_proprietario(usuario_id);
```

### Caso 3: Permissão Customizada
```typescript
// Exemplo: Funcionário que pode criar obras mas não excluir
{
  pode_acessar_obras: true,
  pode_criar_obra: true,
  pode_editar_obra: true,
  pode_excluir_obra: false,  // ❌ Bloqueado
  pode_finalizar_obra: false
}
```

## 📱 Design iOS

### Cores
```css
--ios-perm-primary: #007AFF    (Azul iOS)
--ios-perm-success: #34C759    (Verde iOS)
--ios-perm-warning: #FF9500    (Laranja iOS)
--ios-perm-danger: #FF3B30     (Vermelho iOS)
--ios-perm-gold: #FFD700       (Dourado Proprietário)
```

### Componentes

- **Cards**: Backdrop blur, bordas sutis, sombras profundas
- **Toggles**: Switches estilo iOS com animação suave
- **Botões**: Gradientes, estados hover/active, ripple effect
- **Progress Bar**: Gradiente dinâmico baseado em %
- **Avatares**: Bordas coloridas, fallback com inicial

## 🚨 Troubleshooting

### Erro: "permissoes_usuario não existe"
```bash
# Execute o SQL de setup novamente
database/setup_permissoes_granulares.sql
```

### Erro: "RLS Policy bloqueando acesso"
```sql
-- Verifique se o usuário tem permissão de gerenciar
SELECT pode_gerenciar_permissoes 
FROM permissoes_usuario 
WHERE usuario_id = auth.uid();

-- Se não tiver, aplique manualmente
UPDATE permissoes_usuario 
SET pode_gerenciar_permissoes = true 
WHERE usuario_id = '[SEU_USER_ID]';
```

### Permissões não aparecem
```sql
-- Verificar se há registro de permissões
SELECT COUNT(*) FROM permissoes_usuario;

-- Se vazio, inserir manualmente para usuário atual
INSERT INTO permissoes_usuario (usuario_id, ...)
VALUES (auth.uid(), ...);
```

## 📈 Próximos Passos

1. ✅ Sistema de permissões backend (Completo)
2. ✅ Interface de gerenciamento (Completo)
3. ⏳ Integrar com context de permissões (A fazer)
4. ⏳ Proteger todas as rotas (A fazer)
5. ⏳ Adicionar verificações em componentes (A fazer)
6. ⏳ Testes de segurança (A fazer)

## 🎨 Screenshots

### Página de Gerenciamento
- Header com contador de usuários
- Info card explicativo
- Cards de usuários expansíveis
- Barra de progresso de permissões
- Botões de preset (Proprietário/Visualizador)
- Grid de permissões por categoria
- Toggles iOS interativos

## 💡 Dicas

1. **Use Presets**: Comece com um preset e ajuste depois
2. **Teste Sempre**: Faça logout e teste com outro usuário
3. **Auditoria**: Consulte `log_permissoes` para ver histórico
4. **Backup**: Antes de mudanças grandes, faça backup da tabela
5. **Mobile First**: Interface totalmente responsiva

## 🆘 Suporte

Se encontrar problemas:
1. Verifique console do navegador
2. Verifique logs do Supabase
3. Consulte tabela `log_permissoes`
4. Revise políticas RLS no Supabase Dashboard

---

**Sistema desenvolvido com ❤️ usando React + TypeScript + Supabase + Design iOS**
