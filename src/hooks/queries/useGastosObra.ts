import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

export interface GastoObra {
  id: string;
  obra_id: string;
  categoria: string;
  valor: number;
  data: string;
  descricao?: string;
  created_at?: string;
}

export interface DespesaDeObra {
  id: string;
  card_id: string;
  categoria_id: string;
  valor: number;
  data: string;
  descricao?: string;
  created_at?: string;
  categorias_de_gasto?: {
    nome: string;
  };
}

// Hook para buscar gastos de uma obra específica
export function useGastosObra(obraId: string | null) {
  return useQuery({
    queryKey: ['gastos-obra', obraId],
    queryFn: async () => {
      if (!obraId) return [];
      
      const { data, error } = await supabase
        .from('gastos_obra')
        .select('*')
        .eq('obra_id', obraId)
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data as GastoObra[];
    },
    enabled: !!obraId,
  });
}

// Hook para buscar todos os gastos de obras
export function useAllGastosObra() {
  return useQuery({
    queryKey: ['gastos-obra'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gastos_obra')
        .select('*')
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data as GastoObra[];
    },
  });
}

// Hook para criar gasto de obra
export function useCreateGastoObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newGasto: Omit<GastoObra, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('gastos_obra')
        .insert(newGasto)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gastos-obra'] });
      queryClient.invalidateQueries({ queryKey: ['gastos-obra', data.obra_id] });
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['obras', data.obra_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Gasto registrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao registrar gasto: ${error.message}`);
    },
  });
}

// Hook para atualizar gasto de obra
export function useUpdateGastoObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GastoObra> & { id: string }) => {
      const { data, error } = await supabase
        .from('gastos_obra')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gastos-obra'] });
      queryClient.invalidateQueries({ queryKey: ['gastos-obra', data.obra_id] });
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Gasto atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar gasto: ${error.message}`);
    },
  });
}

// Hook para deletar gasto de obra
export function useDeleteGastoObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, obraId }: { id: string; obraId: string }) => {
      const { error } = await supabase
        .from('gastos_obra')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return obraId;
    },
    onSuccess: (obraId) => {
      queryClient.invalidateQueries({ queryKey: ['gastos-obra'] });
      queryClient.invalidateQueries({ queryKey: ['gastos-obra', obraId] });
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Gasto excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir gasto: ${error.message}`);
    },
  });
}

// Hook para buscar despesas de um card
export function useDespesasCard(cardId: string | null) {
  return useQuery({
    queryKey: ['despesas-card', cardId],
    queryFn: async () => {
      if (!cardId) return [];
      
      const { data, error } = await supabase
        .from('despesas_de_obra')
        .select('*, categorias_de_gasto(nome)')
        .eq('card_id', cardId)
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data as DespesaDeObra[];
    },
    enabled: !!cardId,
  });
}

// Hook para criar despesa de card
export function useCreateDespesaCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newDespesa: Omit<DespesaDeObra, 'id' | 'created_at' | 'categorias_de_gasto'>) => {
      const { data, error } = await supabase
        .from('despesas_de_obra')
        .insert(newDespesa)
        .select('*, categorias_de_gasto(nome)')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['despesas-card'] });
      queryClient.invalidateQueries({ queryKey: ['despesas-card', data.card_id] });
      queryClient.invalidateQueries({ queryKey: ['cards-obra'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Despesa registrada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao registrar despesa: ${error.message}`);
    },
  });
}

// Hook para deletar despesa de card
export function useDeleteDespesaCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, cardId }: { id: string; cardId: string }) => {
      const { error } = await supabase
        .from('despesas_de_obra')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return cardId;
    },
    onSuccess: (cardId) => {
      queryClient.invalidateQueries({ queryKey: ['despesas-card'] });
      queryClient.invalidateQueries({ queryKey: ['despesas-card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['cards-obra'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Despesa excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir despesa: ${error.message}`);
    },
  });
}
