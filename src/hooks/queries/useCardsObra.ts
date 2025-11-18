import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';

export interface CardDeObra {
  id: string;
  nome: string;
  obra_id?: string;
  orcamento_total: number;
  verba_total?: number;
  valor_gasto: number;
  status: 'ativo' | 'concluido' | 'cancelado';
  data_criacao?: string;
  data_conclusao?: string;
  cor?: string;
  ordem?: number;
  created_at?: string;
}

// Hook para buscar todos os cards
export function useCardsDeObra() {
  return useQuery({
    queryKey: ['cards-obra'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards_de_obra')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data as CardDeObra[];
    },
  });
}

// Hook para buscar cards de uma obra específica
export function useCardsByObra(obraId: string | null) {
  return useQuery({
    queryKey: ['cards-obra', 'obra', obraId],
    queryFn: async () => {
      if (!obraId) return [];
      
      const { data, error } = await supabase
        .from('cards_de_obra')
        .select('*')
        .eq('obra_id', obraId)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data as CardDeObra[];
    },
    enabled: !!obraId,
  });
}

// Hook para buscar um card específico
export function useCardDeObra(id: string | null) {
  return useQuery({
    queryKey: ['cards-obra', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('cards_de_obra')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as CardDeObra;
    },
    enabled: !!id,
  });
}

// Hook para criar card de obra
export function useCreateCardObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newCard: Omit<CardDeObra, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('cards_de_obra')
        .insert(newCard)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards-obra'] });
      toast.success('Card criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar card: ${error.message}`);
    },
  });
}

// Hook para atualizar card de obra
export function useUpdateCardObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CardDeObra> & { id: string }) => {
      const { data, error } = await supabase
        .from('cards_de_obra')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cards-obra'] });
      queryClient.invalidateQueries({ queryKey: ['cards-obra', data.id] });
      if (data.obra_id) {
        queryClient.invalidateQueries({ queryKey: ['cards-obra', 'obra', data.obra_id] });
      }
      toast.success('Card atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar card: ${error.message}`);
    },
  });
}

// Hook para deletar card de obra
export function useDeleteCardObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cards_de_obra')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards-obra'] });
      toast.success('Card excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir card: ${error.message}`);
    },
  });
}

// Hook para reordenar cards
export function useReorderCardsObra() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cards: Array<{ id: string; ordem: number }>) => {
      const updates = cards.map(card => 
        supabase
          .from('cards_de_obra')
          .update({ ordem: card.ordem })
          .eq('id', card.id)
      );
      
      const results = await Promise.all(updates);
      const error = results.find(r => r.error)?.error;
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards-obra'] });
      toast.success('Ordem atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao reordenar cards: ${error.message}`);
    },
  });
}
