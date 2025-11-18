import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

export interface Categoria {
  id: string;
  nome: string;
  tipo: 'entrada' | 'saida' | 'ambos';
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
      return data as Categoria[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

// Hook para criar categoria
export function useCreateCategoria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newCategoria: Omit<Categoria, 'id'>) => {
      const { data, error } = await supabase
        .from('categorias')
        .insert(newCategoria)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar categoria: ${error.message}`);
    },
  });
}

// Hook para atualizar categoria
export function useUpdateCategoria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Categoria> & { id: string }) => {
      const { data, error } = await supabase
        .from('categorias')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar categoria: ${error.message}`);
    },
  });
}

// Hook para deletar categoria
export function useDeleteCategoria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir categoria: ${error.message}`);
    },
  });
}
