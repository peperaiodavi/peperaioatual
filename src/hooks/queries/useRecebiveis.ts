import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

export interface Recebivel {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'recebido';
  cliente?: string;
  obra_id?: string;
  created_at?: string;
}

// Hook para buscar todos os recebíveis
export function useRecebiveis() {
  return useQuery({
    queryKey: ['recebiveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recebiveis')
        .select('*')
        .order('data_vencimento', { ascending: true });
      
      if (error) throw error;
      return data as Recebivel[];
    },
  });
}

// Hook para criar recebível
export function useCreateRecebivel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newRecebivel: Omit<Recebivel, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('recebiveis')
        .insert(newRecebivel)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recebiveis'] });
      toast.success('Recebível criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar recebível: ${error.message}`);
    },
  });
}

// Hook para atualizar recebível
export function useUpdateRecebivel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Recebivel> & { id: string }) => {
      const { data, error } = await supabase
        .from('recebiveis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recebiveis'] });
      toast.success('Recebível atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar recebível: ${error.message}`);
    },
  });
}

// Hook para deletar recebível
export function useDeleteRecebivel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recebiveis')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recebiveis'] });
      toast.success('Recebível excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir recebível: ${error.message}`);
    },
  });
}
