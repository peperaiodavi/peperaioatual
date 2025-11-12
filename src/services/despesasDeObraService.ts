import { supabase } from '../utils/supabaseClient';
import type { DespesaDeObra, CategoriaDeGasto } from '../types/financeiro';

/**
 * Serviço para gerenciar Despesas de Obra
 * Responsável por operações de gastos dentro dos cards
 */

// ============================================
// CATEGORIAS
// ============================================

export const carregarCategorias = async (): Promise<CategoriaDeGasto[]> => {
  const { data, error } = await supabase
    .from('categorias_de_gasto')
    .select('*')
    .order('nome');

  if (error) throw error;
  return data || [];
};

// ============================================
// DESPESAS
// ============================================

export const carregarDespesas = async (id_card: string): Promise<DespesaDeObra[]> => {
  const { data, error } = await supabase
    .from('despesas_de_obra')
    .select(`
      *,
      categoria:categorias_de_gasto(*)
    `)
    .eq('id_card', id_card)
    .order('data', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const registrarDespesa = async (
  id_card: string,
  despesa: {
    id_categoria: string;
    descricao: string;
    valor: number;
    url_comprovante?: string;
  }
): Promise<void> => {
  const { error } = await supabase
    .from('despesas_de_obra')
    .insert([{
      id_card,
      id_categoria: despesa.id_categoria,
      descricao: despesa.descricao,
      valor: despesa.valor,
      url_comprovante: despesa.url_comprovante || 'sem_comprovante',
      status: 'PENDENTE'
    }]);

  if (error) throw error;
};

export const deletarDespesa = async (id_despesa: string): Promise<void> => {
  const { error } = await supabase
    .from('despesas_de_obra')
    .delete()
    .eq('id_despesa', id_despesa);

  if (error) throw error;
};

export const atualizarStatusDespesa = async (
  id_despesa: string,
  status: 'PENDENTE' | 'APROVADO' | 'REPROVADO',
  notas?: string
): Promise<void> => {
  const { error } = await supabase
    .from('despesas_de_obra')
    .update({ 
      status,
      notas_admin: notas 
    })
    .eq('id_despesa', id_despesa);

  if (error) throw error;
};
