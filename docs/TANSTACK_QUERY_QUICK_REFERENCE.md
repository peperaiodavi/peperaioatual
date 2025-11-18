# Quick Reference - TanStack Query

## 🎯 Comandos Rápidos

### Verificar instalação
```bash
npm list @tanstack/react-query
```

### Ver DevTools no navegador
1. Abra o app em desenvolvimento (`npm run dev`)
2. Procure pelo ícone do React Query no canto inferior esquerdo
3. Clique para expandir e ver estado do cache

## 📝 Snippets de Código

### 1. Hook Básico de Query
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';

export function useMeuDados() {
  return useQuery({
    queryKey: ['meu-dados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('minha_tabela')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });
}
```

### 2. Hook de Mutation
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';

export function useCreateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newItem) => {
      const { data, error } = await supabase
        .from('minha_tabela')
        .insert(newItem)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meu-dados'] });
      toast.success('Criado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}
```

### 3. Usar no Componente
```typescript
import { useMeuDados, useCreateItem } from '../hooks/queries/useMeusDados';

function MeuComponente() {
  const { data, isLoading, error } = useMeuDados();
  const createItem = useCreateItem();

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro!</div>;

  return (
    <div>
      {data?.map(item => <div key={item.id}>{item.nome}</div>)}
      <button 
        onClick={() => createItem.mutate({ nome: 'Novo' })}
        disabled={createItem.isPending}
      >
        Adicionar
      </button>
    </div>
  );
}
```

### 4. Query Condicional
```typescript
const { data } = useObra(obraId, {
  enabled: !!obraId, // Só busca se obraId existe
});
```

### 5. Refetch Manual
```typescript
const { data, refetch } = useMeuDados();

<button onClick={() => refetch()}>Atualizar</button>
```

### 6. Invalidar Cache Manualmente
```typescript
import { useQueryClient } from '@tanstack/react-query';

function MeuComponente() {
  const queryClient = useQueryClient();

  const handleInvalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['meu-dados'] });
  };
}
```

## 🔧 Configurações Comuns

### Ajustar tempo de cache
```typescript
export function useMeuDados() {
  return useQuery({
    queryKey: ['meu-dados'],
    queryFn: fetchData,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30,    // 30 minutos
  });
}
```

### Desabilitar refetch automático
```typescript
export function useMeuDados() {
  return useQuery({
    queryKey: ['meu-dados'],
    queryFn: fetchData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
```

## 🐛 Troubleshooting

### Cache não atualiza após mutation
✅ Verifique se está invalidando as queries corretas:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['meu-dados'] });
}
```

### Query não executa
✅ Verifique a propriedade `enabled`:
```typescript
const { data } = useQuery({
  queryKey: ['dados', id],
  queryFn: fetchData,
  enabled: !!id, // Precisa de id para executar
});
```

### Dados muito antigos
✅ Diminua o `staleTime`:
```typescript
staleTime: 1000 * 60 * 1, // 1 minuto
```

### Múltiplas requisições duplicadas
✅ O TanStack Query já deduplicar automaticamente, mas verifique se não está usando `refetch()` demais.

## 📊 Padrões de Query Keys

### Simples
```typescript
queryKey: ['transacoes']
```

### Com ID
```typescript
queryKey: ['transacoes', id]
```

### Com Filtros
```typescript
queryKey: ['transacoes', { tipo: 'entrada', mes: 'janeiro' }]
```

### Hierárquica
```typescript
queryKey: ['obras', obraId, 'gastos']
```

## 🎨 Estados da UI

### Loading
```typescript
if (isLoading) return <Spinner />;
```

### Error
```typescript
if (error) return <ErrorMessage error={error} />;
```

### Empty
```typescript
if (!data?.length) return <EmptyState />;
```

### Success
```typescript
return <DataList data={data} />;
```

## 🚀 Performance Tips

1. **Use useMemo para cálculos derivados**
```typescript
const total = useMemo(() => {
  return data?.reduce((sum, item) => sum + item.valor, 0) || 0;
}, [data]);
```

2. **Prefetch dados antes de precisar**
```typescript
const queryClient = useQueryClient();
await queryClient.prefetchQuery({
  queryKey: ['dados'],
  queryFn: fetchDados,
});
```

3. **Invalidar apenas o necessário**
```typescript
// ❌ Ruim - invalida tudo
queryClient.invalidateQueries();

// ✅ Bom - invalida apenas o necessário
queryClient.invalidateQueries({ queryKey: ['transacoes'] });
```

4. **Use staleTime apropriado**
```typescript
// Dados estáticos (categorias): 30 min
staleTime: 1000 * 60 * 30

// Dados dinâmicos (transações): 2 min
staleTime: 1000 * 60 * 2

// Dashboard: 3 min
staleTime: 1000 * 60 * 3
```

## 📚 Recursos

- [Documentação Oficial](https://tanstack.com/query/latest)
- [Practical React Query](https://tkdodo.eu/blog/practical-react-query)
- [React Query Tips](https://tkdodo.eu/blog/react-query-render-optimizations)

## ✅ Checklist de Implementação

Ao refatorar uma página:

- [ ] Remover `useState` para dados do servidor
- [ ] Remover `useEffect` de fetching
- [ ] Criar/usar hooks customizados
- [ ] Implementar loading state
- [ ] Implementar error state
- [ ] Usar mutations para create/update/delete
- [ ] Usar `useMemo` para cálculos derivados
- [ ] Testar invalidação de cache
- [ ] Verificar performance no DevTools

---

**Quick Reference criado por**: GitHub Copilot
**Data**: ${new Date().toLocaleDateString('pt-BR')}
