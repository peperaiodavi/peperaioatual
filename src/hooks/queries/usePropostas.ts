import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

export interface Proposta {
  id: string;
  numero?: string;
  cliente?: string;
  valor: number;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  descricao?: string;
  data_criacao?: string;
  data_validade?: string;
  created_at?: string;
}

// Hook para buscar todas as propostas
export function usePropostas() {
  return useQuery({
    queryKey: ['propostas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propostas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Proposta[];
    },
  });
}

// Hook para buscar uma proposta específica
export function useProposta(id: string | null) {
  return useQuery({
    queryKey: ['propostas', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('propostas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Proposta;
    },
    enabled: !!id,
  });
}

// Hook para criar proposta
export function useCreateProposta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newProposta: Omit<Proposta, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('propostas')
        .insert(newProposta)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success('Proposta criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar proposta: ${error.message}`);
    },
  });
}

// Hook para atualizar proposta
export function useUpdateProposta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Proposta> & { id: string }) => {
      const { data, error } = await supabase
        .from('propostas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      queryClient.invalidateQueries({ queryKey: ['propostas', data.id] });
      toast.success('Proposta atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar proposta: ${error.message}`);
    },
  });
}

// Hook para deletar proposta
export function useDeleteProposta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('propostas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success('Proposta excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir proposta: ${error.message}`);
    },
  });
}
