import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

export interface Divida {
  id: string;
  descricao: string;
  valor: number;
  valor_pago: number;
  data_vencimento: string;
  status: 'pendente' | 'pago';
  credor?: string;
  obra_id?: string;
  created_at?: string;
}

// Hook para buscar todas as dívidas
export function useDividas() {
  return useQuery({
    queryKey: ['dividas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dividas')
        .select('*')
        .order('data_vencimento', { ascending: true });
      
      if (error) throw error;
      return data as Divida[];
    },
  });
}

// Hook para criar dívida
export function useCreateDivida() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newDivida: Omit<Divida, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('dividas')
        .insert(newDivida)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dividas'] });
      toast.success('Dívida criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar dívida: ${error.message}`);
    },
  });
}

// Hook para atualizar dívida
export function useUpdateDivida() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Divida> & { id: string }) => {
      const { data, error } = await supabase
        .from('dividas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dividas'] });
      toast.success('Dívida atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar dívida: ${error.message}`);
    },
  });
}

// Hook para deletar dívida
export function useDeleteDivida() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dividas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dividas'] });
      toast.success('Dívida excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir dívida: ${error.message}`);
    },
  });
}
