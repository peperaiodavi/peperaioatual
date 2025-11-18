import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

export interface Compromisso {
  id: string;
  titulo: string;
  descricao?: string;
  data: string;
  hora?: string;
  tipo?: string;
  status?: 'pendente' | 'concluido';
  obra_id?: string;
  created_at?: string;
}

// Hook para buscar todos os compromissos
export function useCompromissos() {
  return useQuery({
    queryKey: ['compromissos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compromissos')
        .select('*')
        .order('data', { ascending: true });
      
      if (error) throw error;
      return data as Compromisso[];
    },
  });
}

// Hook para buscar compromissos por data
export function useCompromissosByDate(date: string | null) {
  return useQuery({
    queryKey: ['compromissos', 'date', date],
    queryFn: async () => {
      if (!date) return [];
      
      const { data, error } = await supabase
        .from('compromissos')
        .select('*')
        .eq('data', date)
        .order('hora', { ascending: true });
      
      if (error) throw error;
      return data as Compromisso[];
    },
    enabled: !!date,
  });
}

// Hook para criar compromisso
export function useCreateCompromisso() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newCompromisso: Omit<Compromisso, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('compromissos')
        .insert(newCompromisso)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      toast.success('Compromisso criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar compromisso: ${error.message}`);
    },
  });
}

// Hook para atualizar compromisso
export function useUpdateCompromisso() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Compromisso> & { id: string }) => {
      const { data, error } = await supabase
        .from('compromissos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      toast.success('Compromisso atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar compromisso: ${error.message}`);
    },
  });
}

// Hook para deletar compromisso
export function useDeleteCompromisso() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('compromissos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      toast.success('Compromisso excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir compromisso: ${error.message}`);
    },
  });
}
