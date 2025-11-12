import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { DespesaDeObra, CategoriaDeGasto } from '../types/financeiro';
import * as despesasService from '../services/despesasDeObraService';

/**
 * Hook customizado para gerenciar Despesas de Obra
 */

export const useDespesasDeObra = (id_card?: string) => {
  const [despesas, setDespesas] = useState<DespesaDeObra[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDeGasto[]>([]);
  const [loading, setLoading] = useState(false);

  // ============================================
  // CARREGAR DADOS
  // ============================================

  const carregarCategorias = useCallback(async () => {
    try {
      const data = await despesasService.carregarCategorias();
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
    }
  }, []);

  const carregarDespesas = useCallback(async (cardId: string) => {
    try {
      setLoading(true);
      const data = await despesasService.carregarDespesas(cardId);
      setDespesas(data);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      toast.error('Erro ao carregar despesas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  useEffect(() => {
    if (id_card) {
      carregarDespesas(id_card);
    }
  }, [id_card, carregarDespesas]);

  // ============================================
  // OPERAÇÕES
  // ============================================

  const registrarDespesa = async (
    cardId: string,
    despesa: {
      id_categoria: string;
      descricao: string;
      valor: number;
      url_comprovante?: string;
    }
  ) => {
    try {
      await despesasService.registrarDespesa(cardId, despesa);
      toast.success('Despesa registrada com sucesso!');
      await carregarDespesas(cardId);
    } catch (error) {
      console.error('Erro ao registrar despesa:', error);
      toast.error('Erro ao registrar despesa');
      throw error;
    }
  };

  const deletarDespesa = async (id_despesa: string, cardId: string) => {
    try {
      await despesasService.deletarDespesa(id_despesa);
      toast.success('Despesa deletada com sucesso!');
      await carregarDespesas(cardId);
    } catch (error) {
      console.error('Erro ao deletar despesa:', error);
      toast.error('Erro ao deletar despesa');
      throw error;
    }
  };

  const atualizarStatusDespesa = async (
    id_despesa: string,
    status: 'PENDENTE' | 'APROVADO' | 'REPROVADO',
    cardId: string,
    notas?: string
  ) => {
    try {
      await despesasService.atualizarStatusDespesa(id_despesa, status, notas);
      toast.success(`Despesa ${status.toLowerCase()}!`);
      await carregarDespesas(cardId);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status da despesa');
      throw error;
    }
  };

  return {
    // Estado
    despesas,
    categorias,
    loading,

    // Operações
    carregarDespesas,
    carregarCategorias,
    registrarDespesa,
    deletarDespesa,
    atualizarStatusDespesa
  };
};
