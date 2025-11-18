import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

export interface Obra {
  id: string;
  nome: string;
  valor_total: number;
  valor_pago: number;
  valor_recebido: number;
  lucro_total: number;
  status: string;
  data_inicio?: string;
  data_fim?: string;
  cliente?: string;
  endereco?: string;
  created_at?: string;
  gastos_obra?: any[];
}

// Hook para buscar todas as obras
export function useObras() {
  return useQuery({
    queryKey: ['obras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obras')
        .select('*, gastos_obra(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Obra[];
    },
  });
}

// Hook para buscar uma obra específica
export function useObra(id: string | null) {
  return useQuery({
    queryKey: ['obras', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('obras')
        .select('*, gastos_obra(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Obra;
    },
    enabled: !!id,
  });
}

// Hook para criar obra
export function useCreateObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newObra: Omit<Obra, 'id' | 'created_at' | 'gastos_obra'>) => {
      const { data, error } = await supabase
        .from('obras')
        .insert(newObra)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      toast.success('Obra criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar obra: ${error.message}`);
    },
  });
}

// Hook para atualizar obra
export function useUpdateObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Obra> & { id: string }) => {
      const { data, error } = await supabase
        .from('obras')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['obras', data.id] });
      toast.success('Obra atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar obra: ${error.message}`);
    },
  });
}

// Hook para deletar obra
export function useDeleteObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('obras')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      toast.success('Obra excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir obra: ${error.message}`);
    },
  });
}
