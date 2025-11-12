import { supabase } from '../utils/supabaseClient';
import type { CardDeObra } from '../types/financeiro';

/**
 * Serviço para gerenciar Cards de Obra
 * Responsável por todas as operações CRUD e lógica de negócio relacionada aos cards
 */

// ============================================
// CRUD BÁSICO
// ============================================

export const carregarCards = async (): Promise<CardDeObra[]> => {
  const { data, error } = await supabase
    .from('cards_de_obra')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const criarCard = async (cardData: {
  titulo: string;
  nome_cliente: string;
  valor_venda_orcamento: number;
  id_visualizador_responsavel: string;
}) => {
  const { data, error } = await supabase
    .from('cards_de_obra')
    .insert([{
      ...cardData,
      saldo_atual: 0,
      total_gasto: 0,
      status: 'PENDENTE'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const atualizarCard = async (
  id_card: string, 
  updates: Partial<CardDeObra>
) => {
  const { data, error } = await supabase
    .from('cards_de_obra')
    .update(updates)
    .eq('id_card', id_card)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletarCard = async (id_card: string) => {
  const { error } = await supabase
    .from('cards_de_obra')
    .delete()
    .eq('id_card', id_card);

  if (error) throw error;
};

// ============================================
// OPERAÇÕES DE VERBA
// ============================================

export const transferirVerba = async (
  card: CardDeObra,
  valor: number
): Promise<void> => {
  const novoSaldo = card.saldo_atual + valor;

  // 1. Atualizar o card (apenas saldo, não incrementa total_gasto)
  const { error: errorCard } = await supabase
    .from('cards_de_obra')
    .update({ 
      saldo_atual: novoSaldo,
      status: 'EM_ANDAMENTO'
    })
    .eq('id_card', card.id_card);

  if (errorCard) throw errorCard;

  // 2. Registrar saída no caixa
  const { error: errorTransacao } = await supabase
    .from('transacoes')
    .insert({
      tipo: 'saida',
      valor: valor,
      origem: `Verba para Card - ${card.titulo}`,
      data: new Date().toISOString().split('T')[0],
      observacao: `Transferência para ${card.nome_cliente}`,
      categoria: 'Verba para Obra'
    });

  if (errorTransacao) {
    console.warn('Aviso: Transação não foi registrada no caixa', errorTransacao);
  }

  // 3. Buscar a obra vinculada ao card e registrar gasto
  try {
    const { data: obras } = await supabase
      .from('obras')
      .select('id, orcamento')
      .eq('titulo', card.titulo)
      .limit(1);

    if (obras && obras.length > 0) {
      const obra = obras[0];
      
      // 3a. Registrar em gastos_obra (página Obras)
      await supabase
        .from('gastos_obra')
        .insert({
          obra_id: obra.id,
          categoria: 'Verba Enviada',
          descricao: `Verba transferida para card de ${card.nome_cliente}`,
          valor: valor,
          data: new Date().toISOString().split('T')[0]
        });

      // 3b. Descontar do orçamento da obra principal
      const novoOrcamento = (obra.orcamento || 0) - valor;
      await supabase
        .from('obras')
        .update({ orcamento: novoOrcamento })
        .eq('id', obra.id);
    }
  } catch (erro) {
    console.warn('Aviso: Erro ao registrar gasto na obra', erro);
  }

  // 4. Registrar como despesa de obra aprovada (para rastreamento no card)
  try {
    const { data: categorias } = await supabase
      .from('categorias_de_gasto')
      .select('id_categoria')
      .eq('nome', 'Verba para Obra')
      .limit(1);

    if (categorias && categorias.length > 0) {
      await supabase
        .from('despesas_de_obra')
        .insert({
          id_card: card.id_card,
          id_categoria: categorias[0].id_categoria,
          descricao: `Verba transferida para execução da obra`,
          valor: valor,
          data: new Date().toISOString(),
          url_comprovante: 'verba_transferida',
          status: 'APROVADO'
        });
    }
  } catch (erro) {
    console.warn('Aviso: Erro ao registrar despesa de obra', erro);
  }
};

// ============================================
// OPERAÇÕES DE FINALIZAÇÃO/APROVAÇÃO
// ============================================

export const finalizarCard = async (id_card: string): Promise<void> => {
  const { error } = await supabase
    .from('cards_de_obra')
    .update({ 
      status: 'EM_ANALISE',
      finalizado_em: new Date().toISOString()
    })
    .eq('id_card', id_card);

  if (error) throw error;
};

export const aprovarCard = async (card: CardDeObra): Promise<void> => {
  const valorADevolver = card.saldo_atual;

  // 1. Criar despesa de estorno (valor negativo = crédito)
  try {
    const { data: categorias } = await supabase
      .from('categorias_de_gasto')
      .select('id_categoria')
      .eq('nome', 'Verba para Obra')
      .limit(1);

    if (categorias && categorias.length > 0 && valorADevolver > 0) {
      await supabase
        .from('despesas_de_obra')
        .insert({
          id_card: card.id_card,
          id_categoria: categorias[0].id_categoria,
          descricao: 'Estorno de verba não utilizada',
          valor: -valorADevolver,
          data: new Date().toISOString(),
          url_comprovante: 'estorno_aprovacao',
          status: 'APROVADO'
        });
    }
  } catch (erro) {
    console.warn('Aviso: Erro ao registrar estorno', erro);
  }

  // 2. Devolver ao orçamento da obra
  try {
    const { data: obras } = await supabase
      .from('obras')
      .select('id, orcamento')
      .eq('titulo', card.titulo)
      .limit(1);

    if (obras && obras.length > 0 && valorADevolver > 0) {
      const obra = obras[0];
      const novoOrcamento = (obra.orcamento || 0) + valorADevolver;
      
      await supabase
        .from('obras')
        .update({ orcamento: novoOrcamento })
        .eq('id', obra.id);
    }
  } catch (erro) {
    console.warn('Aviso: Erro ao devolver ao orçamento', erro);
  }

  // 3. Registrar entrada no caixa (estorno)
  if (valorADevolver > 0) {
    await supabase
      .from('transacoes')
      .insert({
        tipo: 'entrada',
        valor: valorADevolver,
        origem: `Estorno de verba - ${card.titulo}`,
        data: new Date().toISOString().split('T')[0],
        observacao: `Devolução de saldo não utilizado por ${card.nome_cliente}`,
        categoria: 'Estorno de Verba'
      });
  }

  // 4. Finalizar o card
  const { error } = await supabase
    .from('cards_de_obra')
    .update({ 
      saldo_atual: 0,
      status: 'FINALIZADO',
      aprovado_em: new Date().toISOString()
    })
    .eq('id_card', card.id_card);

  if (error) throw error;
};

export const rejeitarCard = async (
  id_card: string, 
  motivo?: string
): Promise<void> => {
  const { error } = await supabase
    .from('cards_de_obra')
    .update({ 
      status: 'EM_ANDAMENTO',
      finalizado_em: null
    })
    .eq('id_card', id_card);

  if (error) throw error;
};

// ============================================
// VINCULAÇÃO COM OBRAS
// ============================================

export const vincularCardComObra = async (
  id_obra: string,
  id_funcionario: string,
  valor_inicial: number
): Promise<CardDeObra> => {
  // 1. Buscar dados da obra
  const { data: obraData, error: errorObra } = await supabase
    .from('obras')
    .select('*')
    .eq('id', id_obra)
    .single();

  if (errorObra) throw errorObra;

  // 2. Criar card vinculado
  const cardPayload = {
    titulo: obraData.titulo || obraData.nome || 'Sem título',
    nome_cliente: obraData.nome || 'Cliente',
    valor_venda_orcamento: obraData.orcamento || 0,
    id_visualizador_responsavel: id_funcionario,
    saldo_atual: valor_inicial,
    total_gasto: 0,
    status: 'EM_ANDAMENTO' as const
  };

  const { data: cardData, error: errorCard } = await supabase
    .from('cards_de_obra')
    .insert([cardPayload])
    .select()
    .single();

  if (errorCard) throw errorCard;

  // 3. Registrar verba inicial no caixa
  if (valor_inicial > 0) {
    await supabase
      .from('transacoes')
      .insert({
        tipo: 'saida',
        valor: valor_inicial,
        origem: `Verba Inicial para ${cardPayload.titulo}`,
        data: new Date().toISOString().split('T')[0],
        observacao: `Verba inicial para funcionário`,
        categoria: 'Verba para Obra'
      });
  }

  // 4. Descontar do orçamento da obra
  if (valor_inicial > 0) {
    const novoOrcamento = (obraData.orcamento || 0) - valor_inicial;
    await supabase
      .from('obras')
      .update({ orcamento: novoOrcamento })
      .eq('id', id_obra);
  }

  return cardData;
};
