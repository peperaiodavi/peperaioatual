# 📱 Guia de Refatoração - iOS Layout System

## Objetivo
Padronizar todas as páginas do sistema para seguir o design system iOS implementado na página inicial.

## Mudanças Implementadas

### ✅ 1. Problema do Widget Resolvido
- **Problema**: Card de "Obras em Andamento" ficava atrás do menu dock
- **Solução**: Aumentado `padding-bottom` da `.widgets-page` de 20px para 100px

### ✅ 2. Ícones Melhorados
Substituídos ícones por opções mais sugestivas:
- **A Receber**: DownloadIcon → TrendingUp (Lucide)
- **Cards de Obra**: AppsIcon → Layers (Lucide)
- **Dívidas**: WarningAmberIcon → CreditCard (Lucide)
- **Propostas**: mantido ContentPasteIcon
- **Funcionários**: mantido PeopleOutlineIcon
- **Calendário**: mantido CalendarMonthIcon

Todos os ícones MUI agora usam `sx={{ fontSize: 28 }}` para consistência.

### ✅ 3. Arquivo de Estilos Globais Criado
**Localização**: `src/styles/ios-layout.css`

**Componentes disponíveis**:
- `.ios-page-container` - Container principal da página
- `.ios-header` - Cabeçalho fixo com glassmorphism
- `.ios-content` / `.ios-content-narrow` - Área de conteúdo
- `.ios-card` - Cards com efeito glassmorphism
- `.ios-button-*` - Botões iOS (primary, secondary, success, danger, outline)
- `.ios-input` - Inputs padronizados
- `.ios-badge-*` - Badges coloridos (blue, green, red, orange, purple)
- `.ios-list` / `.ios-list-item` - Listas interativas
- `.ios-grid-*` - Sistema de grid responsivo (2, 3, 4 colunas)
- Animações: `.animate-fade-in`, `.animate-slide-up`, `.animate-scale-in`
- Utilities: flex, gap, margin helpers

## Próximos Passos - Refatoração de Páginas

### Prioridade Alta 🔴
1. **Dívidas** (`src/pages/Dividas.tsx`) - Página complexa com modais
2. **Funcionários** (`src/pages/Funcionarios.tsx`) - Cards técnicos já implementados
3. **Propostas** (`src/pages/Propostas.tsx`) - Interface de formulários
4. **Calendário** (`src/pages/Calendario.tsx`) - Visualização de agenda

### Prioridade Média 🟡
5. **Receber** (`src/pages/Receber.tsx`) - Gestão de recebíveis
6. **Obras** (`src/pages/Obras.tsx`) - Lista de obras
7. **MinhasObras** (`src/pages/MinhasObras.tsx`) - Visão do visualizador
8. **Caixa** (`src/pages/Caixa.tsx`) - Gestão financeira

### Prioridade Baixa 🟢
9. **ObrasHub** - Hub de navegação
10. **FinanceiroHub** - Hub financeiro
11. **MinhaConta** - Configurações de perfil

## Template de Refatoração

```tsx
import { useState } from 'react';
import { Plus } from 'lucide-react';
import '../styles/ios-layout.css';
import './[NomeDaPagina].css'; // CSS específico da página

export default function [NomeDaPagina]() {
  return (
    <div className="ios-page-container">
      {/* Header fixo */}
      <header className="ios-header">
        <h1 className="ios-header-title">[Título da Página]</h1>
        <div className="ios-header-actions">
          <button className="ios-button ios-button-primary">
            <Plus size={20} />
            Novo
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="ios-content">
        <section className="ios-section">
          <h2 className="ios-section-title">Seção 1</h2>
          
          <div className="ios-grid ios-grid-2">
            <div className="ios-card animate-fade-in">
              <div className="ios-card-header">
                <h3 className="ios-card-title">Card Title</h3>
              </div>
              <div className="ios-card-content">
                Content here...
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
```

## Checklist de Refatoração

Para cada página:

- [ ] Importar `../styles/ios-layout.css`
- [ ] Substituir container principal por `.ios-page-container`
- [ ] Adicionar `.ios-header` se houver cabeçalho fixo
- [ ] Usar `.ios-content` ou `.ios-content-narrow` para conteúdo
- [ ] Substituir cards customizados por `.ios-card`
- [ ] Padronizar botões com `.ios-button-*`
- [ ] Usar `.ios-badge-*` para status/tags
- [ ] Adicionar animações com classes `.animate-*`
- [ ] Manter CSS específico apenas para elementos únicos da página
- [ ] Testar responsividade em mobile
- [ ] Verificar scroll e padding-bottom (espaço para dock)

## Variáveis CSS Disponíveis

```css
/* Cores */
--ios-blue, --ios-green, --ios-orange, --ios-red, 
--ios-purple, --ios-teal, --ios-indigo, --ios-pink

/* Backgrounds */
--bg-primary, --bg-secondary, --bg-tertiary, --bg-elevated

/* Text */
--text-primary, --text-secondary, --text-tertiary

/* Spacing */
--spacing-xs: 8px
--spacing-sm: 12px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px

/* Border Radius */
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 24px

/* Layout */
--header-height: 60px
--dock-height: 90px
```

## Exemplo Real - Antes e Depois

### ANTES:
```tsx
<div className="dividas-container">
  <div className="dividas-header">
    <h1>Dívidas</h1>
    <button onClick={handleAdd}>Adicionar</button>
  </div>
  <div className="dividas-list">
    {dividas.map(divida => (
      <div className="divida-card">...</div>
    ))}
  </div>
</div>
```

### DEPOIS:
```tsx
<div className="ios-page-container">
  <header className="ios-header">
    <h1 className="ios-header-title">Dívidas</h1>
    <button className="ios-button ios-button-primary" onClick={handleAdd}>
      <Plus size={20} />
      Adicionar
    </button>
  </header>
  <main className="ios-content">
    <div className="ios-grid ios-grid-2">
      {dividas.map(divida => (
        <div className="ios-card animate-fade-in">...</div>
      ))}
    </div>
  </main>
</div>
```

## Benefícios

✅ **Consistência Visual**: Todas as páginas seguem o mesmo padrão
✅ **Manutenibilidade**: CSS centralizado, mudanças globais mais fáceis
✅ **Performance**: Menos CSS duplicado
✅ **Responsividade**: Sistema de grid padronizado
✅ **Animações**: Transições suaves já configuradas
✅ **Acessibilidade**: Estrutura semântica consistente
✅ **Experiência iOS**: Interface familiar para usuários Apple

## Status Atual

- ✅ Página Inicio - Implementada e funcionando
- ✅ Sistema de estilos globais criado
- ✅ Ícones padronizados e melhorados
- ✅ Problema de scroll resolvido
- ⏳ Aguardando refatoração das demais páginas
