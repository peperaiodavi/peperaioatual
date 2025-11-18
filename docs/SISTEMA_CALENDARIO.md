# Sistema de Calendário e Compromissos

Sistema completo de gestão de compromissos e visitas a clientes com notificações automáticas.

## 📅 Funcionalidades

### 1. Página Calendário (`/calendario`)
- ✅ Lista de compromissos com filtros (Todos, Próximos, Concluídos)
- ✅ CRUD completo (criar, editar, deletar)
- ✅ Alertas visuais para compromissos próximos (≤ 5 dias)
- ✅ Marcar como concluído
- ✅ Campos: título, data/hora, cliente, local, descrição

### 2. Notificações Automáticas
- ✅ **Hook `useCompromissosNotification`**
  - Verifica compromissos nos próximos 5 dias ao carregar o app
  - Mostra dialog com lista de compromissos próximos
  - Marca automaticamente como "notificado"
  - Badge "HOJE" ou "X dias" para urgência
  - Botões: "Entendi" e "Ver Calendário"

### 3. Widget no Dashboard
- ✅ **CompromissosWidget** na 2ª posição
  - Mostra próximos 5 compromissos não concluídos
  - Badge "Urgente" para compromissos em ≤ 2 dias
  - Formatação inteligente: "Hoje", "Amanhã" ou data
  - Clique leva para `/calendario`
  - Escondido se não há compromissos

## 🗄️ Banco de Dados

**Tabela:** `compromissos`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | PK, auto-gerado |
| `titulo` | TEXT | Obrigatório |
| `descricao` | TEXT | Opcional |
| `data_compromisso` | TIMESTAMPTZ | Obrigatório |
| `cliente` | TEXT | Opcional |
| `local` | TEXT | Opcional |
| `notificado` | BOOLEAN | Default FALSE |
| `concluido` | BOOLEAN | Default FALSE |
| `user_id` | UUID | FK para auth.users |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto |

**RLS:** Habilitado com políticas para SELECT, INSERT, UPDATE, DELETE (user_id = auth.uid())

**Índices:**
- `idx_compromissos_data` (data_compromisso)
- `idx_compromissos_user` (user_id)
- `idx_compromissos_concluido` (concluido)

## 📁 Arquivos Criados

### Backend
- `database/create_compromissos_table.sql` - Schema completo com RLS

### Frontend
- `src/pages/Calendario.tsx` - Página principal
- `src/pages/Calendario.css` - Estilos premium glassmorphic
- `src/hooks/useCompromissosNotification.tsx` - Hook de notificações
- `src/hooks/useCompromissosNotification.css` - Estilos do dialog
- `src/components/CompromissosWidget.tsx` - Widget do dashboard
- `src/components/CompromissosWidget.css` - Estilos do widget

### Rotas
- **App.tsx:** Rota `/calendario` adicionada
- **MoreDrawer.tsx:** Menu "Calendário" com ícone Calendar
- **IonicBottomTabBar.tsx:** Path `/calendario` ativa aba "Mais"
- **MainLayout.tsx:** `<NotificationDialog />` renderizado

## 🎨 Design

### Cores
- **Primária:** `#fbbf24` (Amarelo/Gold) - Gradient `#fbbf24` → `#f59e0b`
- **Urgente:** `#ef4444` (Vermelho) - Para compromissos críticos
- **Background:** `rgba(15, 23, 42, 0.4)` com blur(12px)
- **Border:** `rgba(251, 191, 36, 0.15)` com hover 0.3

### Elementos Visuais
- **Barra lateral:** Gradient de 4px à esquerda dos cards
- **Badges:** Amarelos para dias restantes, vermelhos para urgente
- **Animações:** Hover com translateY e box-shadow
- **Icons:** Lucide-react (Calendar, Clock, MapPin, User)

## 🔄 Fluxo de Uso

1. **Criação de Compromisso:**
   - Menu Mais → Calendário → Novo Compromisso
   - Preencher formulário (título* e data* obrigatórios)
   - Salvar

2. **Notificação Automática:**
   - Ao fazer login/refresh
   - Se há compromissos em ≤ 5 dias
   - Dialog aparece automaticamente
   - "Ver Calendário" ou "Entendi"

3. **Dashboard:**
   - Widget mostra próximos 5 compromissos
   - Clique leva para página completa
   - Badge "Urgente" para ≤ 2 dias

4. **Gestão:**
   - Filtrar: Todos, Próximos, Concluídos
   - Editar compromisso (somente não concluídos)
   - Marcar como concluído (ícone CheckCircle)
   - Deletar compromisso

## 🚀 Deploy

**SQL:**
```bash
# Executar no Supabase SQL Editor
cat database/create_compromissos_table.sql
```

**Build:**
```bash
npm run build
firebase deploy
```

## 📱 Responsividade

- Desktop: Grid layout, sidebar fixa
- Tablet: 2 colunas adaptativas
- Mobile: Stack vertical, botões full-width

## ⚙️ Configurações

**Dias para notificação:** 5 dias (ajustar em `useCompromissosNotification.tsx`)
**Limite do widget:** 5 compromissos (ajustar em `CompromissosWidget.tsx`)

## 🔐 Permissões

- **Criar:** Requer `canCreate` (todos os usuários)
- **Editar:** Requer `canEdit` + não concluído
- **Deletar:** Requer `canDelete`
- **Ver:** Todos os usuários (próprios registros)

## 📝 Observações

- Timezone: UTC armazenado, local exibido
- Compromissos passados: Filtrados automaticamente
- Notificações: Marcadas apenas 1x por compromisso
- Widget: Oculto se lista vazia

## 🎯 Status

✅ **COMPLETO** - Sistema 100% funcional
- Tabela criada com RLS
- Página Calendário completa
- Notificações automáticas funcionando
- Widget no Dashboard integrado
- Rotas e navegação configuradas
