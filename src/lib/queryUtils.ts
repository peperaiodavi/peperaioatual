/**
 * Utilitários para TanStack Query
 * 
 * Funções auxiliares para trabalhar com React Query no sistema
 */

import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook para invalidar múltiplas queries de uma vez
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    // Invalida todas as queries relacionadas a transações
    invalidateTransacoes: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },

    // Invalida todas as queries relacionadas a obras
    invalidateObras: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['gastos-obra'] });
      queryClient.invalidateQueries({ queryKey: ['cards-obra'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },

    // Invalida todas as queries financeiras
    invalidateFinanceiro: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['recebiveis'] });
      queryClient.invalidateQueries({ queryKey: ['dividas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },

    // Invalida tudo (usar com cuidado)
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },

    // Limpa cache específico
    removeCache: (queryKey: string[]) => {
      queryClient.removeQueries({ queryKey });
    },

    // Reseta todas as queries
    resetQueries: () => {
      queryClient.resetQueries();
    },
  };
}

/**
 * Hook para prefetch de dados
 * Útil para carregar dados antes de navegar para uma página
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  return {
    // Prefetch obras
    prefetchObras: async () => {
      await queryClient.prefetchQuery({
        queryKey: ['obras'],
        queryFn: async () => {
          const { supabase } = await import('../utils/supabaseClient');
          const { data } = await supabase
            .from('obras')
            .select('*, gastos_obra(*)')
            .order('created_at', { ascending: false });
          return data;
        },
      });
    },

    // Prefetch transações
    prefetchTransacoes: async () => {
      await queryClient.prefetchQuery({
        queryKey: ['transacoes'],
        queryFn: async () => {
          const { supabase } = await import('../utils/supabaseClient');
          const { data } = await supabase
            .from('transacoes')
            .select('*')
            .order('data', { ascending: false });
          return data;
        },
      });
    },
  };
}

/**
 * Opções comuns para queries
 */
export const queryOptions = {
  // Para dados que mudam raramente (categorias, configurações)
  static: {
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60, // 1 hora
  },

  // Para dados que mudam frequentemente (transações, obras em andamento)
  dynamic: {
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  },

  // Para dados do dashboard
  dashboard: {
    staleTime: 1000 * 60 * 3, // 3 minutos
    gcTime: 1000 * 60 * 15, // 15 minutos
  },

  // Para dados históricos (não mudam mais)
  historical: {
    staleTime: Infinity, // Nunca fica stale
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  },
};

/**
 * Função auxiliar para construir query keys complexas
 */
export const queryKeys = {
  // Transações
  transacoes: {
    all: ['transacoes'] as const,
    lists: () => [...queryKeys.transacoes.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.transacoes.lists(), { filters }] as const,
    details: () => [...queryKeys.transacoes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transacoes.details(), id] as const,
  },

  // Obras
  obras: {
    all: ['obras'] as const,
    lists: () => [...queryKeys.obras.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.obras.lists(), { filters }] as const,
    details: () => [...queryKeys.obras.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.obras.details(), id] as const,
    gastos: (obraId: string) => ['gastos-obra', obraId] as const,
  },

  // Funcionários
  funcionarios: {
    all: ['funcionarios'] as const,
    lists: () => [...queryKeys.funcionarios.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.funcionarios.all, id] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    charts: () => [...queryKeys.dashboard.all, 'charts'] as const,
  },
};

/**
 * Hook para sincronização em tempo real com Supabase
 * Exemplo de uso:
 * useRealtimeSync('transacoes', (payload) => {
 *   queryClient.invalidateQueries({ queryKey: ['transacoes'] });
 * });
 */
export function useRealtimeSync(
  table: string,
  callback: (payload: any) => void
) {
  const queryClient = useQueryClient();

  // Este é um exemplo - você pode implementar depois
  // useEffect(() => {
  //   const subscription = supabase
  //     .channel(`${table}_changes`)
  //     .on('postgres_changes', 
  //       { event: '*', schema: 'public', table },
  //       callback
  //     )
  //     .subscribe();
  //
  //   return () => {
  //     subscription.unsubscribe();
  //   };
  // }, [table, callback]);
}

/**
 * Função para criar mutation com configuração padrão
 */
export function createMutationOptions<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccessMessage?: string;
    onErrorMessage?: string;
    invalidateKeys?: string[][];
  }
) {
  return {
    mutationFn,
    onSuccess: (data: TData, variables: TVariables, context: any) => {
      if (options?.onSuccessMessage) {
        const { toast } = require('sonner');
        toast.success(options.onSuccessMessage);
      }
      if (options?.invalidateKeys) {
        const { queryClient } = require('./queryClient');
        options.invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
    },
    onError: (error: any) => {
      if (options?.onErrorMessage) {
        const { toast } = require('sonner');
        toast.error(options.onErrorMessage);
      }
      console.error('Mutation error:', error);
    },
  };
}

/**
 * Exemplo de uso de optimistic updates
 */
export function useOptimisticUpdate<T>(queryKey: string[]) {
  const queryClient = useQueryClient();

  return {
    // Atualização otimista
    optimisticUpdate: (updater: (old: T[] | undefined) => T[] | undefined) => {
      queryClient.setQueryData<T[]>(queryKey, updater);
    },

    // Rollback em caso de erro
    rollback: (previousData: T[] | undefined) => {
      queryClient.setQueryData(queryKey, previousData);
    },

    // Get data atual
    getCurrentData: () => {
      return queryClient.getQueryData<T[]>(queryKey);
    },
  };
}
