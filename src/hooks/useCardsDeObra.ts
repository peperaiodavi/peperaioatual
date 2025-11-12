import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { CardDeObra } from '../types/financeiro';
import * as cardsService from '../services/cardsDeObraService';

/**
 * Hook customizado para gerenciar Cards de Obra
 * Encapsula toda a lógica de estado e operações
 */

export const useCardsDeObra = () => {
  const [cards, setCards] = useState<CardDeObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CardDeObra | null>(null);

  // ============================================
  // CARREGAR DADOS
  // ============================================

  const carregarCards = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cardsService.carregarCards();
      setCards(data);
    } catch (error) {
      console.error('Erro ao carregar cards:', error);
      toast.error('Erro ao carregar cards de obra');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarCards();
  }, [carregarCards]);

  // ============================================
  // CRUD BÁSICO
  // ============================================

  const criarCard = async (cardData: {
    titulo: string;
    nome_cliente: string;
    valor_venda_orcamento: number;
    id_visualizador_responsavel: string;
  }) => {
    try {
      await cardsService.criarCard(cardData);
      toast.success('Card criado com sucesso!');
      await carregarCards();
    } catch (error) {
      console.error('Erro ao criar card:', error);
      toast.error('Erro ao criar card');
      throw error;
    }
  };

  const atualizarCard = async (
    id_card: string,
    updates: Partial<CardDeObra>
  ) => {
    try {
      await cardsService.atualizarCard(id_card, updates);
      toast.success('Card atualizado com sucesso!');
      await carregarCards();
    } catch (error) {
      console.error('Erro ao atualizar card:', error);
      toast.error('Erro ao atualizar card');
      throw error;
    }
  };

  const deletarCard = async (id_card: string) => {
    try {
      await cardsService.deletarCard(id_card);
      toast.success('Card deletado com sucesso!');
      await carregarCards();
    } catch (error) {
      console.error('Erro ao deletar card:', error);
      toast.error('Erro ao deletar card');
      throw error;
    }
  };

  // ============================================
  // OPERAÇÕES DE VERBA
  // ============================================

  const transferirVerba = async (card: CardDeObra, valor: number) => {
    try {
      await cardsService.transferirVerba(card, valor);
      toast.success(`R$ ${valor.toFixed(2)} transferido com sucesso! Registrado como gasto, saída no caixa e orçamento atualizado.`);
      await carregarCards();
      
      // Atualizar card selecionado se for o mesmo
      if (selectedCard && selectedCard.id_card === card.id_card) {
        const cardAtualizado = cards.find(c => c.id_card === card.id_card);
        if (cardAtualizado) {
          setSelectedCard(cardAtualizado);
        }
      }
    } catch (error) {
      console.error('Erro ao transferir verba:', error);
      toast.error('Erro ao transferir verba');
      throw error;
    }
  };

  // ============================================
  // OPERAÇÕES DE FINALIZAÇÃO/APROVAÇÃO
  // ============================================

  const finalizarCard = async (id_card: string) => {
    try {
      await cardsService.finalizarCard(id_card);
      toast.success('Card finalizado! Aguardando análise.');
      await carregarCards();
      setSelectedCard(null);
    } catch (error) {
      console.error('Erro ao finalizar card:', error);
      toast.error('Erro ao finalizar card');
      throw error;
    }
  };

  const aprovarCard = async (card: CardDeObra) => {
    try {
      await cardsService.aprovarCard(card);
      toast.success('Card aprovado com sucesso! Estorno realizado.');
      await carregarCards();
      setSelectedCard(null);
    } catch (error) {
      console.error('Erro ao aprovar card:', error);
      toast.error('Erro ao aprovar card');
      throw error;
    }
  };

  const rejeitarCard = async (id_card: string, motivo?: string) => {
    try {
      await cardsService.rejeitarCard(id_card, motivo);
      toast.success('Card rejeitado. Status voltou para Em Andamento.');
      await carregarCards();
      setSelectedCard(null);
    } catch (error) {
      console.error('Erro ao rejeitar card:', error);
      toast.error('Erro ao rejeitar card');
      throw error;
    }
  };

  // ============================================
  // VINCULAÇÃO
  // ============================================

  const vincularCardComObra = async (
    id_obra: string,
    id_funcionario: string,
    valor_inicial: number
  ) => {
    try {
      await cardsService.vincularCardComObra(id_obra, id_funcionario, valor_inicial);
      toast.success('Card vinculado e verba transferida!');
      await carregarCards();
    } catch (error) {
      console.error('Erro ao vincular card:', error);
      toast.error('Erro ao vincular card com obra');
      throw error;
    }
  };

  return {
    // Estado
    cards,
    loading,
    selectedCard,
    setSelectedCard,
    
    // Operações
    carregarCards,
    criarCard,
    atualizarCard,
    deletarCard,
    transferirVerba,
    finalizarCard,
    aprovarCard,
    rejeitarCard,
    vincularCardComObra
  };
};
