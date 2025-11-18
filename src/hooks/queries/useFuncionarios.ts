import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

export interface Funcionario {
  id: string;
  nome: string;
  cargo?: string;
  salario?: number;
  telefone?: string;
  email?: string;
  data_admissao?: string;
  status?: 'ativo' | 'inativo';
  created_at?: string;
}

// Hook para buscar todos os funcionários
export function useFuncionarios() {
  return useQuery({
    queryKey: ['funcionarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data as Funcionario[];
    },
  });
}

// Hook para buscar um funcionário específico
export function useFuncionario(id: string | null) {
  return useQuery({
    queryKey: ['funcionarios', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Funcionario;
    },
    enabled: !!id,
  });
}

// Hook para criar funcionário
export function useCreateFuncionario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newFuncionario: Omit<Funcionario, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('funcionarios')
        .insert(newFuncionario)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      toast.success('Funcionário criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar funcionário: ${error.message}`);
    },
  });
}

// Hook para atualizar funcionário
export function useUpdateFuncionario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Funcionario> & { id: string }) => {
      const { data, error } = await supabase
        .from('funcionarios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios', data.id] });
      toast.success('Funcionário atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar funcionário: ${error.message}`);
    },
  });
}

// Hook para deletar funcionário
export function useDeleteFuncionario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      toast.success('Funcionário excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir funcionário: ${error.message}`);
    },
  });
}
