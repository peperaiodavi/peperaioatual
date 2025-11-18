import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

export interface Transacao {
  id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  categoria: string;
  data: string;
  obra_id?: string;
  created_at?: string;
  user_id?: string;
}

// Hook para buscar todas as transações
export function useTransacoes() {
  return useQuery({
    queryKey: ['transacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data as Transacao[];
    },
  });
}

// Hook para buscar transações por obra
export function useTransacoesByObra(obraId: string | null) {
  return useQuery({
    queryKey: ['transacoes', 'obra', obraId],
    queryFn: async () => {
      if (!obraId) return [];
      
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('obra_id', obraId)
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data as Transacao[];
    },
    enabled: !!obraId,
  });
}

// Hook para criar transação
export function useCreateTransacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newTransacao: Omit<Transacao, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('transacoes')
        .insert(newTransacao)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      toast.success('Transação criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar transação: ${error.message}`);
    },
  });
}

// Hook para atualizar transação
export function useUpdateTransacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transacao> & { id: string }) => {
      const { data, error } = await supabase
        .from('transacoes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      toast.success('Transação atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar transação: ${error.message}`);
    },
  });
}

// Hook para deletar transação
export function useDeleteTransacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      toast.success('Transação excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir transação: ${error.message}`);
    },
  });
}
