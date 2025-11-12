# Estrutura Refatorada - Sistema de Gerenciamento de Obras

## 📁 Nova Arquitetura

```
src/
├── services/                    # Lógica de negócio e API
│   ├── cardsDeObraService.ts   # Operações de cards (CRUD, verba, aprovação)
│   └── despesasDeObraService.ts # Operações de despesas e categorias
│
├── hooks/                       # Hooks customizados React
│   ├── useCardsDeObra.ts       # Estado e operações de cards
│   └── useDespesasDeObra.ts    # Estado e operações de despesas
│
├── components/
│   └── cards/                   # Componentes de UI reutilizáveis
│       ├── CardObraItem.tsx    # Card individual com ações
│       └── TransferirVerbaModal.tsx # Modal de transferência
│
└── pages/                       # Páginas principais
    ├── CardsDeObra.tsx         # [ADMIN] Gerenciar cards e verbas
    ├── MinhasObras.tsx         # [FUNCIONÁRIO] Gerenciar gastos
    └── Obras.tsx               # [ADMIN] Gerenciar obras principais
```

## 🔄 Separação de Responsabilidades

### **Services (Lógica de Negócio)**
Responsável por toda comunicação com o Supabase e lógica de negócio:

- ✅ Operações assíncronas
- ✅ Validações de negócio
- ✅ Transações complexas
- ✅ Tratamento de erros
- ✅ Sem dependência de UI

**Exemplo:**
```typescript
// cardsDeObraService.ts
export const transferirVerba = async (card, valor) => {
  // 1. Atualiza card
  // 2. Registra caixa
  // 3. Cria despesa
  // 4. Atualiza orçamento
};
```

### **Hooks (Estado e Operações)**
Encapsula estado React e orquestra chamadas aos services:

- ✅ useState/useEffect
- ✅ Callbacks otimizados
- ✅ Toast notifications
- ✅ Recarregamento de dados
- ✅ Reutilizável em múltiplos componentes

**Exemplo:**
```typescript
// useCardsDeObra.ts
export const useCardsDeObra = () => {
  const [cards, setCards] = useState([]);
  
  const transferirVerba = async (card, valor) => {
    await cardsService.transferirVerba(card, valor);
    toast.success('Verba transferida!');
    await carregarCards();
  };
  
  return { cards, transferirVerba, ... };
};
```

### **Components (UI Pura)**
Componentes reutilizáveis focados em apresentação:

- ✅ Props bem definidas
- ✅ Sem lógica de negócio
- ✅ Callbacks para ações
- ✅ Responsivos e acessíveis

**Exemplo:**
```typescript
// CardObraItem.tsx
<CardObraItem 
  card={card}
  onTransferirVerba={handleTransferir}
  isAdmin={isAdmin}
/>
```

## 🎯 Fluxo de Dados

```
┌─────────────┐
│   UI/Page   │ → Renderiza e captura eventos
└──────┬──────┘
       │
       ↓
┌──────────────┐
│     Hook     │ → Gerencia estado e coordena
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   Service    │ → Executa lógica e API calls
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   Supabase   │ → Persistência de dados
└──────────────┘
```

## 📝 Como Usar

### Em uma Página (Admin):

```typescript
import { useCardsDeObra } from '../hooks/useCardsDeObra';
import { CardObraItem } from '../components/cards/CardObraItem';

function CardsDeObra() {
  const { 
    cards, 
    loading, 
    transferirVerba, 
    aprovarCard 
  } = useCardsDeObra();

  return (
    <>
      {cards.map(card => (
        <CardObraItem
          key={card.id_card}
          card={card}
          onTransferirVerba={(c) => transferirVerba(c, 1000)}
          onAprovar={aprovarCard}
          isAdmin
        />
      ))}
    </>
  );
}
```

### Em MinhasObras (Funcionário):

```typescript
import { useCardsDeObra } from '../hooks/useCardsDeObra';
import { useDespesasDeObra } from '../hooks/useDespesasDeObra';

function MinhasObras() {
  const { cards, finalizarCard } = useCardsDeObra();
  const { despesas, registrarDespesa } = useDespesasDeObra();

  // Funcionário só vê seus cards e registra gastos
}
```

## ✅ Benefícios da Refatoração

1. **Manutenibilidade**: Código organizado em camadas claras
2. **Reutilização**: Hooks e components compartilháveis
3. **Testabilidade**: Services isolados podem ser testados
4. **Escalabilidade**: Fácil adicionar novas features
5. **Debugging**: Erros isolados em camadas específicas
6. **Type Safety**: TypeScript em todos os níveis
7. **Performance**: Callbacks otimizados com useCallback

## 🔧 Próximos Passos

- [ ] Refatorar CardsDeObra.tsx para usar hooks
- [ ] Refatorar MinhasObras.tsx para usar hooks
- [ ] Adicionar testes unitários para services
- [ ] Adicionar Storybook para components
- [ ] Implementar error boundaries
- [ ] Adicionar loading states consistentes
