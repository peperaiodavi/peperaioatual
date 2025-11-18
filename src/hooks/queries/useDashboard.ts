import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';

// Hook para buscar múltiplas queries do dashboard
export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [
        transacoesRes,
        recebiveisRes,
        dividasRes,
        obrasRes,
        gastosObraRes,
        despesasObraRes,
      ] = await Promise.all([
        supabase.from('transacoes').select('*'),
        supabase.from('recebiveis').select('*'),
        supabase.from('dividas').select('*'),
        supabase.from('obras').select('*, gastos_obra(*)'),
        supabase.from('gastos_obra').select('*'),
        supabase.from('despesas_de_obra').select('*, categorias_de_gasto(nome)'),
      ]);

      if (transacoesRes.error) throw transacoesRes.error;
      if (recebiveisRes.error) throw recebiveisRes.error;
      if (dividasRes.error) throw dividasRes.error;
      if (obrasRes.error) throw obrasRes.error;
      if (gastosObraRes.error) throw gastosObraRes.error;
      if (despesasObraRes.error) throw despesasObraRes.error;

      return {
        transacoes: transacoesRes.data,
        recebiveis: recebiveisRes.data,
        dividas: dividasRes.data,
        obras: obrasRes.data,
        gastosObra: gastosObraRes.data,
        despesasObra: despesasObraRes.data,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutos para dashboard
  });
}

// Hook para buscar categorias
export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos - categorias mudam raramente
  });
}

// Hook para buscar transações excluídas
export function useTransacoesExcluidas() {
  return useQuery({
    queryKey: ['transacoes-excluidas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacoes_excluidas')
        .select('*')
        .order('data_exclusao', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}
