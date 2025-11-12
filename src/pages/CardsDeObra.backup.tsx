import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  ArrowLeft, 
  DollarSign, 
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  Send,
  Filter,
  Search,
  Edit2,
  Trash2
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { usePermissao } from '../context/PermissaoContext';
import { toast } from 'sonner';
import type { 
  CardDeObra, 
  DespesaDeObra, 
  SolicitacaoDeVerba, 
  CategoriaDeGasto,
  StatusProjeto 
} from '../types/financeiro';
import './CardsDeObra.css';

const CardsDeObra: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = usePermissao();
  const [cards, setCards] = useState<CardDeObra[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDeGasto[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardDeObra | null>(null);
  const [despesas, setDespesas] = useState<DespesaDeObra[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoDeVerba[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<StatusProjeto | 'TODOS'>('TODOS');
  const [busca, setBusca] = useState('');

  // Modais
  const [showNovoCard, setShowNovoCard] = useState(false);
  const [showEditarCard, setShowEditarCard] = useState(false);
  const [showVincularObra, setShowVincularObra] = useState(false);
  const [showTransferirVerba, setShowTransferirVerba] = useState(false);
  const [showNovaDespesa, setShowNovaDespesa] = useState(false);
  const [showSolicitarVerba, setShowSolicitarVerba] = useState(false);
  const [cardParaEditar, setCardParaEditar] = useState<CardDeObra | null>(null);
  const [showNovoFuncionario, setShowNovoFuncionario] = useState(false);

  // Estados para vincular obra
  const [obrasDisponiveis, setObrasDisponiveis] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [vinculoForm, setVinculoForm] = useState({
    id_obra: '',
    id_funcionario: '',
    valor_inicial: ''
  });

  // Forms
  const [novoCard, setNovoCard] = useState({
    titulo: '',
    nome_cliente: '',
    valor_venda_orcamento: '',
    id_funcionario: ''
  });

  const [editCard, setEditCard] = useState({
    titulo: '',
    nome_cliente: '',
    valor_venda_orcamento: '',
    id_funcionario: ''
  });

  const [transferencia, setTransferencia] = useState({
    valor: ''
  });

  const [novaDespesa, setNovaDespesa] = useState({
    descricao: '',
    valor: '',
    id_categoria: '',
    comprovante: null as File | null
  });

  const [novaSolicitacao, setNovaSolicitacao] = useState({
    valor: '',
    justificativa: ''
  });

  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', email: '' });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      await Promise.all([
        carregarCards(),
        carregarCategorias(),
        isAdmin && carregarObrasDisponiveis(),
        isAdmin && carregarFuncionarios()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const carregarObrasDisponiveis = async () => {
    try {
      console.log('🔍 Carregando obras disponíveis...');
      // Busca obras ativas da tabela 'obras'
      const { data, error } = await supabase
        .from('obras')
        .select('id, nome, orcamento, finalizada')
        .eq('finalizada', false)
        .order('nome');

      if (error) {
        console.error('❌ Erro ao buscar obras:', error);
        throw error;
      }
      console.log(`✅ ${data?.length || 0} obras encontradas:`, data);
      setObrasDisponiveis(data || []);
      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhuma obra não finalizada encontrada. Cadastre obras na aba "Obras" do sistema.');
      }
    } catch (error) {
      console.error('Erro ao carregar obras:', error);
      toast.error('Erro ao carregar obras. Verifique as políticas RLS no Supabase.');
    }
  };

  const carregarFuncionarios = async () => {
    try {
      console.log('👥 Carregando funcionários...');
      
      // Busca usuários com permissao 'visualizador'
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, permissao')
        .eq('permissao', 'visualizador')
        .order('nome');

      if (error) {
        console.error('❌ Erro ao buscar funcionários:', error);
        throw error;
      }
      
      console.log(`✅ ${data?.length || 0} funcionários encontrados:`, data);
      setFuncionarios(data || []);
      
      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhum usuário com permissao "visualizador" encontrado. Verifique a tabela usuarios.');
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      toast.error('Erro ao carregar funcionários. Verifique as políticas RLS.');
    }
  };

  const vincularObraAFuncionario = async () => {
    try {
      if (!vinculoForm.id_obra || !vinculoForm.id_funcionario) {
        toast.error('Selecione uma obra e um funcionário');
        return;
      }
      const valorInicial = vinculoForm.valor_inicial ? parseFloat(vinculoForm.valor_inicial) : 0;
      // Busca dados da obra selecionada
      const { data: obraData, error: obraError } = await supabase
        .from('obras')
        .select('*')
        .eq('id', vinculoForm.id_obra)
        .single();
      if (obraError) throw obraError;
      // Cria card de obra vinculado
      const cardPayload = {
        titulo: obraData.titulo || obraData.nome || 'Sem título',
        nome_cliente: obraData.nome_cliente || 'Cliente Desconhecido',
        valor_venda_orcamento: obraData.valor_venda_orcamento || obraData.orcamento || 0,
        saldo_atual: valorInicial,
        id_visualizador_responsavel: vinculoForm.id_funcionario,
        status: valorInicial > 0 ? 'EM_ANDAMENTO' : 'PENDENTE'
      };
      console.log('Payload enviado para cards_de_obra:', cardPayload);
      const { error: cardError } = await supabase
        .from('cards_de_obra')
        .insert([cardPayload]);
      if (cardError) throw cardError;

      // Se houver valor inicial, registrar como saída no caixa e atualizar orçamento da obra
      if (valorInicial > 0) {
        const { error: errorTransacao } = await supabase
          .from('transacoes')
          .insert({
            tipo: 'saida',
            valor: valorInicial,
            origem: `Verba Inicial para ${cardPayload.titulo}`,
            data: new Date().toISOString().split('T')[0],
            observacao: `Verba inicial para ${cardPayload.nome_cliente}`,
            categoria: 'Verba para Obra'
          });

        if (errorTransacao) {
          console.warn('Aviso: Valor inicial não foi registrado no caixa', errorTransacao);
        }

        // Descontar do orçamento da obra
        const novoOrcamento = (obraData.orcamento || obraData.valor_venda_orcamento || 0) - valorInicial;
        const { error: errorObrca } = await supabase
          .from('obras')
          .update({ orcamento: novoOrcamento })
          .eq('id', vinculoForm.id_obra);

        if (errorObrca) {
          console.warn('Aviso: Orçamento da obra não foi atualizado', errorObrca);
        }
      }

      toast.success('Obra vinculada ao funcionário com sucesso!');
      setShowVincularObra(false);
      setVinculoForm({ id_obra: '', id_funcionario: '', valor_inicial: '' });
      carregarCards();
      carregarObrasDisponiveis();
    } catch (error) {
      console.error('Erro ao vincular obra:', error);
      toast.error('Erro ao vincular obra');
    }
  };

  const abrirEdicaoCard = (card: CardDeObra, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardParaEditar(card);
    setEditCard({
      titulo: card.titulo,
      nome_cliente: card.nome_cliente,
      valor_venda_orcamento: card.valor_venda_orcamento.toString(),
      id_funcionario: card.id_visualizador_responsavel
    });
    setShowEditarCard(true);
  };

  const editarCard = async () => {
    try {
      if (!cardParaEditar) return;

      if (!editCard.titulo || !editCard.nome_cliente || !editCard.valor_venda_orcamento || !editCard.id_funcionario) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const { error } = await supabase
        .from('cards_de_obra')
        .update({
          titulo: editCard.titulo,
          nome_cliente: editCard.nome_cliente,
          valor_venda_orcamento: parseFloat(editCard.valor_venda_orcamento),
          id_visualizador_responsavel: editCard.id_funcionario
        })
        .eq('id_card', cardParaEditar.id_card);

      if (error) throw error;

      toast.success('Card atualizado com sucesso!');
      setShowEditarCard(false);
      setCardParaEditar(null);
      setEditCard({ titulo: '', nome_cliente: '', valor_venda_orcamento: '', id_funcionario: '' });
      carregarCards();
    } catch (error) {
      console.error('Erro ao editar card:', error);
      toast.error('Erro ao atualizar card');
    }
  };

  const excluirCard = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Tem certeza que deseja excluir este card? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      // Primeiro, excluir todas as despesas do card
      const { error: despesasError } = await supabase
        .from('despesas_de_obra')
        .delete()
        .eq('id_card', cardId);

      if (despesasError) throw despesasError;

      // Depois, excluir solicitações de verba
      const { error: solicitacoesError } = await supabase
        .from('solicitacoes_de_verba')
        .delete()
        .eq('id_card', cardId);

      if (solicitacoesError) throw solicitacoesError;

      // Finalmente, excluir o card
      const { error: cardError } = await supabase
        .from('cards_de_obra')
        .delete()
        .eq('id_card', cardId);

      if (cardError) throw cardError;

      toast.success('Card excluído com sucesso!');
      carregarCards();
    } catch (error) {
      console.error('Erro ao excluir card:', error);
      toast.error('Erro ao excluir card');
    }
  };

  const carregarCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('cards_de_obra')
        .select('*')
        .order('created_at', { ascending: false });

      // Visualizador vê apenas seus cards
      if (!isAdmin) {
        query = query.eq('id_visualizador_responsavel', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Erro ao carregar cards:', error);
      throw error;
    }
  };

  const carregarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_de_gasto')
        .select('*')
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      throw error;
    }
  };

  const carregarDetalhesCard = async (card: CardDeObra) => {
    try {
      setSelectedCard(card);

      // Carregar despesas do card
      const { data: despesasData, error: despesasError } = await supabase
        .from('despesas_de_obra')
        .select(`
          *,
          categoria:categorias_de_gasto(*)
        `)
        .eq('id_card', card.id_card)
        .order('data', { ascending: false });

      if (despesasError) throw despesasError;
      setDespesas(despesasData || []);

      // Carregar solicitações de verba
      const { data: solicitacoesData, error: solicitacoesError } = await supabase
        .from('solicitacoes_de_verba')
        .select('*')
        .eq('id_card', card.id_card)
        .order('data_solicitacao', { ascending: false });

      if (solicitacoesError) throw solicitacoesError;
      setSolicitacoes(solicitacoesData || []);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes do card');
    }
  };

  // ADMIN: Criar novo card
  const criarCard = async () => {
    try {
      if (!novoCard.titulo || !novoCard.nome_cliente || !novoCard.valor_venda_orcamento || !novoCard.id_funcionario) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const { error } = await supabase
        .from('cards_de_obra')
        .insert([{
          titulo: novoCard.titulo,
          nome_cliente: novoCard.nome_cliente,
          valor_venda_orcamento: parseFloat(novoCard.valor_venda_orcamento),
          id_visualizador_responsavel: novoCard.id_funcionario,
          status: 'PENDENTE'
        }]);

      if (error) throw error;

      toast.success('Card criado com sucesso!');
      setShowNovoCard(false);
      setNovoCard({ titulo: '', nome_cliente: '', valor_venda_orcamento: '', id_funcionario: '' });
      carregarCards();
    } catch (error) {
      console.error('Erro ao criar card:', error);
      toast.error('Erro ao criar card');
    }
  };

  // ADMIN: Transferir verba para card
  const transferirVerba = async () => {
    try {
      if (!selectedCard || !transferencia.valor) {
        toast.error('Preencha o valor');
        return;
      }

      const valorTransf = parseFloat(transferencia.valor);
      const novoSaldo = selectedCard.saldo_atual + valorTransf;
      const novoTotalGasto = selectedCard.total_gasto + valorTransf;

      // 1. Atualizar o card de obra COM O GASTO
      const { error: errorCard } = await supabase
        .from('cards_de_obra')
        .update({ 
          saldo_atual: novoSaldo,
          total_gasto: novoTotalGasto,
          status: 'EM_ANDAMENTO'
        })
        .eq('id_card', selectedCard.id_card);

      if (errorCard) throw errorCard;

      // 2. Registrar como SAÍDA no caixa da empresa
      const { error: errorTransacao } = await supabase
        .from('transacoes')
        .insert({
          tipo: 'saida',
          valor: valorTransf,
          origem: `Verba para Card - ${selectedCard.titulo}`,
          data: new Date().toISOString().split('T')[0],
          observacao: `Transferência para ${selectedCard.nome_cliente}`,
          categoria: 'Verba para Obra'
        });

      if (errorTransacao) {
        console.warn('Aviso: Transação não foi registrada no caixa', errorTransacao);
      }

      // 3. Registrar como despesa de obra
      try {
        // Busca a categoria padrão "Verba" ou cria
        const { data: categorias, error: erroCat } = await supabase
          .from('categorias_de_gasto')
          .select('id_categoria')
          .eq('nome', 'Verba para Obra')
          .limit(1);

        let idCategoria = null;
        if (!erroCat && categorias && categorias.length > 0) {
          idCategoria = categorias[0].id_categoria;
        }

        if (idCategoria) {
          const { error: erroDespesa } = await supabase
            .from('despesas_de_obra')
            .insert({
              id_card: selectedCard.id_card,
              id_categoria: idCategoria,
              descricao: `Verba transferida para execução da obra`,
              valor: valorTransf,
              data: new Date().toISOString(),
              url_comprovante: 'verba_inicial',
              status: 'APROVADO'
            });

          if (erroDespesa) {
            console.warn('Aviso: Despesa de obra não foi registrada', erroDespesa);
          }
        }
      } catch (erro) {
        console.warn('Aviso: Erro ao registrar despesa de obra', erro);
      }

      // 4. Descontar do orçamento da obra correspondente (apenas descontar, SEM adicionar gasto)
      try {
        const { data: obras, error: erroObras } = await supabase
          .from('obras')
          .select('id, orcamento')
          .eq('titulo', selectedCard.titulo)
          .limit(1);

        if (!erroObras && obras && obras.length > 0) {
          const obra = obras[0];
          const novoOrcamento = (obra.orcamento || 0) - valorTransf;
          
          // Apenas atualizar orçamento (o gasto será registrado automaticamente no card)
          const { error: erroUpdate } = await supabase
            .from('obras')
            .update({ orcamento: novoOrcamento })
            .eq('id', obra.id);

          if (erroUpdate) {
            console.warn('Aviso: Orçamento da obra não foi atualizado', erroUpdate);
          } else {
            console.log('Orçamento da obra atualizado com sucesso!');
          }
        }
      } catch (erro) {
        console.warn('Aviso: Erro ao atualizar orçamento da obra', erro);
      }

      toast.success(`${formatarMoeda(valorTransf)} transferido com sucesso! Registrado como gasto na obra, saída no caixa e orçamento atualizado.`);
      setShowTransferirVerba(false);
      setTransferencia({ valor: '' });
      carregarCards();
      if (selectedCard) {
        const cardAtualizado = { ...selectedCard, saldo_atual: novoSaldo, total_gasto: novoTotalGasto, status: 'EM_ANDAMENTO' as StatusProjeto };
        carregarDetalhesCard(cardAtualizado);
      }
    } catch (error) {
      console.error('Erro ao transferir verba:', error);
      toast.error('Erro ao transferir verba');
    }
  };

  // VISUALIZADOR: Registrar despesa
  const registrarDespesa = async () => {
    try {
      if (!selectedCard || !novaDespesa.descricao || !novaDespesa.valor || !novaDespesa.id_categoria) {
        toast.error('Preencha todos os campos');
        return;
      }

      const valorDespesa = parseFloat(novaDespesa.valor);

      if (valorDespesa > selectedCard.saldo_atual) {
        toast.error('Saldo insuficiente no card!');
        return;
      }

      // TODO: Upload do comprovante para Storage
      const urlComprovante = novaDespesa.comprovante 
        ? 'pending_upload' // Será implementado
        : 'sem_comprovante';

      const novoSaldo = selectedCard.saldo_atual - valorDespesa;
      const novoTotalGasto = selectedCard.total_gasto + valorDespesa;

      // Inserir despesa
      const { error: despesaError } = await supabase
        .from('despesas_de_obra')
        .insert([{
          id_card: selectedCard.id_card,
          id_categoria: novaDespesa.id_categoria,
          descricao: novaDespesa.descricao,
          valor: valorDespesa,
          url_comprovante: urlComprovante
        }]);

      if (despesaError) throw despesaError;

      // Atualizar saldo e total gasto do card
      const { error: updateError } = await supabase
        .from('cards_de_obra')
        .update({ 
          saldo_atual: novoSaldo,
          total_gasto: novoTotalGasto
        })
        .eq('id_card', selectedCard.id_card);

      if (updateError) throw updateError;

      toast.success('Despesa registrada com sucesso!');
      setShowNovaDespesa(false);
      setNovaDespesa({ descricao: '', valor: '', id_categoria: '', comprovante: null });
      carregarCards();
      if (selectedCard) {
        const cardAtualizado = { 
          ...selectedCard, 
          saldo_atual: novoSaldo,
          total_gasto: novoTotalGasto
        };
        carregarDetalhesCard(cardAtualizado);
      }
    } catch (error) {
      console.error('Erro ao registrar despesa:', error);
      toast.error('Erro ao registrar despesa');
    }
  };

  // VISUALIZADOR: Solicitar verba adicional
  const solicitarVerba = async () => {
    try {
      if (!selectedCard || !novaSolicitacao.valor || !novaSolicitacao.justificativa) {
        toast.error('Preencha todos os campos');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: solicitacaoError } = await supabase
        .from('solicitacoes_de_verba')
        .insert([{
          id_card: selectedCard.id_card,
          id_solicitante: user.id,
          valor: parseFloat(novaSolicitacao.valor),
          justificativa: novaSolicitacao.justificativa
        }]);

      if (solicitacaoError) throw solicitacaoError;

      // Atualizar status do card para AGUARDANDO_VERBA
      const { error: updateError } = await supabase
        .from('cards_de_obra')
        .update({ status: 'AGUARDANDO_VERBA' })
        .eq('id_card', selectedCard.id_card);

      if (updateError) throw updateError;

      toast.success('Solicitação de verba enviada!');
      setShowSolicitarVerba(false);
      setNovaSolicitacao({ valor: '', justificativa: '' });
      carregarCards();
      if (selectedCard) {
        const cardAtualizado = { ...selectedCard, status: 'AGUARDANDO_VERBA' as StatusProjeto };
        carregarDetalhesCard(cardAtualizado);
      }
    } catch (error) {
      console.error('Erro ao solicitar verba:', error);
      toast.error('Erro ao solicitar verba');
    }
  };

  // VISUALIZADOR: Finalizar obra e enviar para análise
  const finalizarObra = async () => {
    try {
      if (!selectedCard) return;

      const confirmacao = window.confirm(
        'Deseja finalizar esta obra e enviar para análise?\n\n' +
        'O card será travado e não poderá mais registrar despesas até a aprovação do admin.'
      );

      if (!confirmacao) return;

      const { error } = await supabase
        .from('cards_de_obra')
        .update({ 
          status: 'EM_ANALISE',
          finalizado_em: new Date().toISOString()
        })
        .eq('id_card', selectedCard.id_card);

      if (error) throw error;

      toast.success('Obra enviada para análise!');
      carregarCards();
      setSelectedCard(null);
    } catch (error) {
      console.error('Erro ao finalizar obra:', error);
      toast.error('Erro ao finalizar obra');
    }
  };

  // ADMIN: Aprovar obra finalizada
  const aprovarObra = async () => {
    try {
      if (!selectedCard) return;

      const confirmacao = window.confirm(
        'Deseja APROVAR esta obra?\n\n' +
        'Os gastos serão finalizados e o saldo restante será devolvido ao orçamento da obra.'
      );

      if (!confirmacao) return;

      // Calcular valor a devolver (saldo restante)
      const valorADevolver = selectedCard.saldo_atual;

      // 1. Registrar estorno de verba restante como entrada na obra
      if (valorADevolver > 0) {
        try {
          const { data: categorias } = await supabase
            .from('categorias_de_gasto')
            .select('id_categoria')
            .eq('nome', 'Estorno')
            .limit(1);

          let idCategoria = null;
          if (categorias && categorias.length > 0) {
            idCategoria = categorias[0].id_categoria;
          }

          if (idCategoria) {
            await supabase
              .from('despesas_de_obra')
              .insert({
                id_card: selectedCard.id_card,
                id_categoria: idCategoria,
                descricao: `Estorno de verba não utilizada`,
                valor: -valorADevolver, // Negativo para representar crédito
                data: new Date().toISOString(),
                url_comprovante: 'estorno',
                status: 'APROVADO'
              });
          }
        } catch (erro) {
          console.warn('Aviso: Erro ao registrar estorno', erro);
        }
      }

      // 2. Devolver valor ao orçamento da obra original
      try {
        const { data: obras } = await supabase
          .from('obras')
          .select('id, orcamento')
          .eq('titulo', selectedCard.titulo)
          .limit(1);

        if (obras && obras.length > 0) {
          const obra = obras[0];
          const novoOrcamento = (obra.orcamento || 0) + valorADevolver;
          
          await supabase
            .from('obras')
            .update({ orcamento: novoOrcamento })
            .eq('id', obra.id);
        }
      } catch (erro) {
        console.warn('Aviso: Erro ao devolver orçamento', erro);
      }

      // 3. Registrar entrada no caixa da empresa
      try {
        await supabase
          .from('transacoes')
          .insert({
            tipo: 'entrada',
            valor: valorADevolver,
            origem: `Estorno de verba - ${selectedCard.titulo}`,
            data: new Date().toISOString().split('T')[0],
            observacao: `Devolução de verba não utilizada na obra ${selectedCard.nome_cliente}`,
            categoria: 'Estorno'
          });
      } catch (erro) {
        console.warn('Aviso: Estorno não foi registrado no caixa', erro);
      }

      // 4. Marcar obra como FINALIZADO
      const { error } = await supabase
        .from('cards_de_obra')
        .update({ 
          status: 'FINALIZADO',
          aprovado_em: new Date().toISOString(),
          saldo_atual: 0 // Zerar saldo após aprovação
        })
        .eq('id_card', selectedCard.id_card);

      if (error) throw error;

      toast.success(`Obra aprovada! ${formatarMoeda(valorADevolver)} devolvido ao orçamento.`);
      carregarCards();
      setSelectedCard(null);
    } catch (error) {
      console.error('Erro ao aprovar obra:', error);
      toast.error('Erro ao aprovar obra');
    }
  };

  // ADMIN: Rejeitar obra
  const rejeitarObra = async () => {
    try {
      if (!selectedCard) return;

      const motivo = prompt('Digite o motivo da rejeição:');
      if (!motivo) return;

      const { error } = await supabase
        .from('cards_de_obra')
        .update({ 
          status: 'EM_ANDAMENTO'
        })
        .eq('id_card', selectedCard.id_card);

      if (error) throw error;

      toast.success('Obra devolvida para correção!');
      carregarCards();
      setSelectedCard(null);
    } catch (error) {
      console.error('Erro ao rejeitar obra:', error);
      toast.error('Erro ao rejeitar obra');
    }
  };

  const cadastrarFuncionario = async () => {
    try {
      if (!novoFuncionario.nome || !novoFuncionario.email) {
        toast.error('Preencha todos os campos');
        return;
      }
      // Gera um UUID simples para o id (ideal: usar Supabase Auth, mas aqui é manual)
      const id = crypto.randomUUID();
      const { error } = await supabase
        .from('usuarios')
        .insert([{
          id,
          nome: novoFuncionario.nome,
          email: novoFuncionario.email,
          permissao: 'visualizador'
        }]);
      if (error) throw error;
      toast.success('Funcionário cadastrado com sucesso!');
      setShowNovoFuncionario(false);
      setNovoFuncionario({ nome: '', email: '' });
      carregarFuncionarios();
    } catch (error) {
      console.error('Erro ao cadastrar funcionário:', error);
      toast.error('Erro ao cadastrar funcionário');
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getStatusConfig = (status: StatusProjeto) => {
    const configs = {
      PENDENTE: { label: 'Pendente', color: '#f59e0b', icon: Clock },
      EM_ANDAMENTO: { label: 'Em Andamento', color: '#3b82f6', icon: CheckCircle },
      AGUARDANDO_VERBA: { label: 'Aguardando Verba', color: '#8b5cf6', icon: AlertCircle },
      EM_ANALISE: { label: 'Em Análise', color: '#06b6d4', icon: FileText },
      FINALIZADO: { label: 'Finalizado', color: '#10b981', icon: CheckCircle },
      CANCELADO: { label: 'Cancelado', color: '#ef4444', icon: AlertCircle }
    };
    return configs[status];
  };

  const cardsFiltrados = cards.filter(card => {
    const matchStatus = filtroStatus === 'TODOS' || card.status === filtroStatus;
    const matchBusca = card.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                       card.nome_cliente.toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchBusca;
  });

  const calcularProgresso = (card: CardDeObra) => {
    if (card.valor_venda_orcamento === 0) return 0;
    return Math.min((card.total_gasto / card.valor_venda_orcamento) * 100, 100);
  };

  return (
    <div className="cards-obra-page">
      {/* Header */}
      <div className="page-header">
        <button className="btn-voltar" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>

        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <Building2 size={32} />
            </div>
            <div>
              <h1>{isAdmin ? 'Gestão de Cards de Obra' : 'Meus Cards de Obra'}</h1>
              <p>Centro de custo e gerenciamento de projetos</p>
            </div>
          </div>

          {isAdmin && (
            <div className="header-actions">
              <button className="btn-secondary" onClick={() => setShowVincularObra(true)}>
                <Building2 size={20} />
                <span>Vincular Obra Existente</span>
              </button>
              <button className="btn-primary" onClick={() => setShowNovoCard(true)}>
                <Plus size={20} />
                <span>Novo Card Manual</span>
              </button>
              <button className="btn-secondary" style={{marginLeft: 8}} onClick={() => setShowNovoFuncionario(true)}>
                + Novo Funcionário
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="filtros-section">
        <div className="busca-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por título ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="filtros-status">
          <Filter size={16} />
          <button
            className={filtroStatus === 'TODOS' ? 'active' : ''}
            onClick={() => setFiltroStatus('TODOS')}
          >
            Todos
          </button>
          <button
            className={filtroStatus === 'EM_ANDAMENTO' ? 'active' : ''}
            onClick={() => setFiltroStatus('EM_ANDAMENTO')}
          >
            Em Andamento
          </button>
          <button
            className={filtroStatus === 'AGUARDANDO_VERBA' ? 'active' : ''}
            onClick={() => setFiltroStatus('AGUARDANDO_VERBA')}
          >
            Aguardando Verba
          </button>
          <button
            className={filtroStatus === 'EM_ANALISE' ? 'active' : ''}
            onClick={() => setFiltroStatus('EM_ANALISE')}
          >
            Em Análise
          </button>
        </div>
      </div>

      {/* Lista de Cards */}
      <div className="cards-grid">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando cards...</p>
          </div>
        ) : cardsFiltrados.length === 0 ? (
          <div className="empty-state">
            <Building2 size={64} />
            <h3>Nenhum card encontrado</h3>
            <p>{isAdmin ? 'Crie um novo card para começar' : 'Aguarde a atribuição de um projeto'}</p>
            {isAdmin && (
              <button className="btn-primary" onClick={() => setShowNovoCard(true)}>
                <Plus size={20} />
                Criar Primeiro Card
              </button>
            )}
          </div>
        ) : (
          cardsFiltrados.map(card => {
            const statusConfig = getStatusConfig(card.status);
            const StatusIcon = statusConfig.icon;
            const progresso = calcularProgresso(card);

            return (
              <div
                key={card.id_card}
                className="card-obra-item"
              >
                <div className="card-header">
                  <h3 onClick={() => carregarDetalhesCard(card)} style={{ cursor: 'pointer', flex: 1 }}>
                    {card.titulo}
                  </h3>
                  
                  {/* Botões de ação (apenas admin) */}
                  {isAdmin && (
                    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon edit"
                        onClick={(e) => abrirEdicaoCard(card, e)}
                        title="Editar card"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={(e) => excluirCard(card.id_card, e)}
                        title="Excluir card"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  
                  <span
                    className="card-status-badge"
                    style={{
                      backgroundColor: `${statusConfig.color}20`,
                      color: statusConfig.color
                    }}
                  >
                    <StatusIcon size={14} />
                    {statusConfig.label}
                  </span>
                </div>

                <p className="card-cliente" onClick={() => carregarDetalhesCard(card)} style={{ cursor: 'pointer' }}>
                  {card.nome_cliente}
                </p>

                <div className="card-financeiro-grid" onClick={() => carregarDetalhesCard(card)} style={{ cursor: 'pointer' }}>
                  <div className="financeiro-item">
                    <span className="label">Orçamento</span>
                    <span className="valor">{formatarMoeda(card.valor_venda_orcamento)}</span>
                  </div>
                  <div className="financeiro-item">
                    <span className="label">Saldo</span>
                    <span className="valor saldo">{formatarMoeda(card.saldo_atual)}</span>
                  </div>
                  <div className="financeiro-item">
                    <span className="label">Gasto</span>
                    <span className="valor gasto">{formatarMoeda(card.total_gasto)}</span>
                  </div>
                </div>

                <div className="card-progresso-section" onClick={() => carregarDetalhesCard(card)} style={{ cursor: 'pointer' }}>
                  <div className="progresso-header">
                    <span>Progresso</span>
                    <span>{progresso.toFixed(0)}%</span>
                  </div>
                  <div className="progresso-bar">
                    <div
                      className="progresso-fill"
                      style={{
                        width: `${progresso}%`,
                        backgroundColor: statusConfig.color
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Detalhes do Card */}
      {selectedCard && (
        <div className="modal-overlay" onClick={() => setSelectedCard(null)}>
          <div className="modal-detalhes-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedCard.titulo}</h2>
                <p>{selectedCard.nome_cliente}</p>
              </div>
              <button className="modal-close" onClick={() => setSelectedCard(null)}>×</button>
            </div>

            <div className="modal-body-detalhes">
              {/* Resumo Financeiro */}
              <div className="resumo-financeiro">
                <div className="resumo-item">
                  <DollarSign size={20} />
                  <div>
                    <span className="resumo-label">Orçamento Total</span>
                    <span className="resumo-valor">{formatarMoeda(selectedCard.valor_venda_orcamento)}</span>
                  </div>
                </div>
                <div className="resumo-item">
                  <DollarSign size={20} />
                  <div>
                    <span className="resumo-label">Saldo Atual</span>
                    <span className="resumo-valor saldo">{formatarMoeda(selectedCard.saldo_atual)}</span>
                  </div>
                </div>
                <div className="resumo-item">
                  <TrendingDown size={20} />
                  <div>
                    <span className="resumo-label">Total Gasto</span>
                    <span className="resumo-valor gasto">{formatarMoeda(selectedCard.total_gasto)}</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="acoes-card">
                {isAdmin && (
                  <>
                    <button
                      className="btn-acao transferir"
                      onClick={() => setShowTransferirVerba(true)}
                      disabled={selectedCard.status === 'FINALIZADO' || selectedCard.status === 'CANCELADO' || selectedCard.status === 'EM_ANALISE'}
                    >
                      <DollarSign size={18} />
                      Transferir Verba
                    </button>

                    {selectedCard.status === 'EM_ANALISE' && (
                      <>
                        <button
                          className="btn-acao aprovar"
                          onClick={aprovarObra}
                        >
                          <CheckCircle size={18} />
                          Aprovar Obra
                        </button>
                        <button
                          className="btn-acao rejeitar"
                          onClick={rejeitarObra}
                        >
                          <XCircle size={18} />
                          Rejeitar
                        </button>
                      </>
                    )}
                  </>
                )}

                {!isAdmin && selectedCard.status === 'EM_ANDAMENTO' && (
                  <>
                    <button
                      className="btn-acao despesa"
                      onClick={() => setShowNovaDespesa(true)}
                    >
                      <TrendingDown size={18} />
                      Registrar Despesa
                    </button>
                    <button
                      className="btn-acao solicitar"
                      onClick={() => setShowSolicitarVerba(true)}
                    >
                      <Send size={18} />
                      Solicitar Verba
                    </button>
                    <button
                      className="btn-acao finalizar"
                      onClick={finalizarObra}
                    >
                      <CheckCircle size={18} />
                      Finalizar Obra
                    </button>
                  </>
                )}
              </div>

              {/* Lista de Despesas */}
              <div className="despesas-section">
                <h3><FileText size={20} /> Despesas Registradas</h3>
                {despesas.length === 0 ? (
                  <p className="empty-message">Nenhuma despesa registrada</p>
                ) : (
                  <div className="despesas-lista-detalhes">
                    {despesas.map(despesa => (
                      <div key={despesa.id_despesa} className="despesa-item-detalhes">
                        <div className="despesa-info">
                          <h4>{despesa.descricao}</h4>
                          <div className="despesa-meta">
                            <span className="categoria">{(despesa as any).categoria?.nome || 'Sem categoria'}</span>
                            <span className="data">{formatarData(despesa.data)}</span>
                          </div>
                        </div>
                        <div className="despesa-valor-status">
                          <span className="valor">-{formatarMoeda(despesa.valor)}</span>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: despesa.status === 'APROVADO' ? '#10b98120' :
                                             despesa.status === 'REPROVADO' ? '#ef444420' : '#f59e0b20',
                              color: despesa.status === 'APROVADO' ? '#10b981' :
                                    despesa.status === 'REPROVADO' ? '#ef4444' : '#f59e0b'
                            }}
                          >
                            {despesa.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Solicitações de Verba */}
              {solicitacoes.length > 0 && (
                <div className="solicitacoes-section">
                  <h3><Send size={20} /> Solicitações de Verba</h3>
                  <div className="solicitacoes-lista">
                    {solicitacoes.map(sol => (
                      <div key={sol.id_solicitacao} className="solicitacao-item">
                        <div className="solicitacao-info">
                          <span className="valor">{formatarMoeda(sol.valor)}</span>
                          <p className="justificativa">{sol.justificativa}</p>
                          <span className="data">{formatarData(sol.data_solicitacao)}</span>
                        </div>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: sol.status === 'APROVADO' ? '#10b98120' :
                                           sol.status === 'REPROVADO' ? '#ef444420' : '#f59e0b20',
                            color: sol.status === 'APROVADO' ? '#10b981' :
                                  sol.status === 'REPROVADO' ? '#ef4444' : '#f59e0b'
                          }}
                        >
                          {sol.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo Card (Admin) */}
      {showNovoCard && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowNovoCard(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Criar Novo Card de Obra</h2>
              <button className="modal-close" onClick={() => setShowNovoCard(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-box">
                <p>Crie um card manualmente preenchendo todos os dados. Para vincular uma obra existente, use a opção "Vincular Obra Existente".</p>
              </div>

              <div className="form-group">
                <label>Título da Obra *</label>
                <input
                  type="text"
                  placeholder="Ex: Fachada ENF CLINIC"
                  value={novoCard.titulo}
                  onChange={(e) => setNovoCard({ ...novoCard, titulo: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Cliente *</label>
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={novoCard.nome_cliente}
                  onChange={(e) => setNovoCard({ ...novoCard, nome_cliente: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Valor da Venda (Orçamento) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={novoCard.valor_venda_orcamento}
                  onChange={(e) => setNovoCard({ ...novoCard, valor_venda_orcamento: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Funcionário Responsável *</label>
                <select
                  value={novoCard.id_funcionario}
                  onChange={(e) => setNovoCard({ ...novoCard, id_funcionario: e.target.value })}
                >
                  <option value="">Selecione um funcionário...</option>
                  {funcionarios.map(func => (
                    <option key={func.id} value={func.id}>
                      {func.nome} ({func.email})
                    </option>
                  ))}
                </select>
                {funcionarios.length === 0 && (
                  <span className="field-hint warning">Nenhum funcionário encontrado</span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowNovoCard(false)}>Cancelar</button>
              <button 
                className="btn-primary" 
                onClick={criarCard}
                disabled={!novoCard.titulo || !novoCard.nome_cliente || !novoCard.valor_venda_orcamento || !novoCard.id_funcionario}
              >
                <Plus size={20} />
                Criar Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Vincular Obra Existente (Admin) */}
      {showVincularObra && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowVincularObra(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Vincular Obra a Funcionário</h2>
              <button className="modal-close" onClick={() => setShowVincularObra(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-box">
                <p>Selecione uma obra cadastrada e atribua a um funcionário. O card de obra será criado automaticamente.</p>
              </div>

              <div className="form-group">
                <label>Obra Cadastrada *</label>
                <select
                  value={vinculoForm.id_obra}
                  onChange={(e) => setVinculoForm({ ...vinculoForm, id_obra: e.target.value })}
                >
                  <option value="">Selecione uma obra...</option>
                  {obrasDisponiveis.map(obra => (
                    <option key={obra.id} value={obra.id}>
                      {obra.nome ? `${obra.nome} (R$ ${obra.orcamento})` : `Obra sem nome (${obra.id})`}
                    </option>
                  ))}
                </select>
                {obrasDisponiveis.length === 0 && (
                  <p style={{ color: '#f59e0b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Nenhuma obra ativa disponível. Cadastre uma obra primeiro em "Obras Ativas".
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Funcionário Responsável *</label>
                <select
                  value={vinculoForm.id_funcionario}
                  onChange={(e) => setVinculoForm({ ...vinculoForm, id_funcionario: e.target.value })}
                >
                  <option value="">Selecione um funcionário...</option>
                  {funcionarios.map(func => (
                    <option key={func.id} value={func.id}>
                      {func.nome} ({func.email})
                    </option>
                  ))}
                </select>
                {funcionarios.length === 0 && (
                  <p style={{ color: '#f59e0b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Nenhum funcionário (visualizador) cadastrado. Cadastre um usuário com role "visualizador".
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Verba Inicial (Opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={vinculoForm.valor_inicial}
                  onChange={(e) => setVinculoForm({ ...vinculoForm, valor_inicial: e.target.value })}
                />
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Deixe em branco se não quiser transferir verba agora. Você pode transferir depois.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowVincularObra(false)}>Cancelar</button>
              <button 
                className="btn-primary" 
                onClick={vincularObraAFuncionario}
                disabled={!vinculoForm.id_obra || !vinculoForm.id_funcionario}
              >
                <Building2 size={20} />
                Vincular Obra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Card (Admin) */}
      {showEditarCard && isAdmin && cardParaEditar && (
        <div className="modal-overlay" onClick={() => setShowEditarCard(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Card de Obra</h2>
              <button className="modal-close" onClick={() => setShowEditarCard(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Título da Obra *</label>
                <input
                  type="text"
                  placeholder="Ex: Fachada ENF CLINIC"
                  value={editCard.titulo}
                  onChange={(e) => setEditCard({ ...editCard, titulo: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Cliente *</label>
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={editCard.nome_cliente}
                  onChange={(e) => setEditCard({ ...editCard, nome_cliente: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Valor da Venda (Orçamento) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={editCard.valor_venda_orcamento}
                  onChange={(e) => setEditCard({ ...editCard, valor_venda_orcamento: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Funcionário Responsável *</label>
                <select
                  value={editCard.id_funcionario}
                  onChange={(e) => setEditCard({ ...editCard, id_funcionario: e.target.value })}
                >
                  <option value="">Selecione um funcionário...</option>
                  {funcionarios.map(func => (
                    <option key={func.id} value={func.id}>
                      {func.nome} ({func.email})
                    </option>
                  ))}
                </select>
                {funcionarios.length === 0 && (
                  <span className="field-hint warning">Nenhum funcionário encontrado</span>
                )}
              </div>
              <div className="info-box warning">
                <AlertCircle size={16} />
                <p>Os valores de saldo e total gasto não podem ser editados aqui. Use "Transferir Verba" ou gerencie as despesas.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditarCard(false)}>Cancelar</button>
              <button 
                className="btn-primary" 
                onClick={editarCard}
                disabled={!editCard.titulo || !editCard.nome_cliente || !editCard.valor_venda_orcamento || !editCard.id_funcionario}
              >
                <CheckCircle size={20} />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Transferir Verba (Admin) */}
      {showTransferirVerba && isAdmin && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowTransferirVerba(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transferir Verba para {selectedCard.titulo}</h2>
              <button className="modal-close" onClick={() => setShowTransferirVerba(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Valor a Transferir</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={transferencia.valor}
                  onChange={(e) => setTransferencia({ valor: e.target.value })}
                />
              </div>
              <div className="info-box">
                <p><strong>Saldo Atual do Card:</strong> {formatarMoeda(selectedCard.saldo_atual)}</p>
                <p><strong>Novo Saldo:</strong> {formatarMoeda(selectedCard.saldo_atual + parseFloat(transferencia.valor || '0'))}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowTransferirVerba(false)}>Cancelar</button>
              <button className="btn-primary" onClick={transferirVerba}>
                <DollarSign size={20} />
                Transferir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nova Despesa (Visualizador) */}
      {showNovaDespesa && !isAdmin && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowNovaDespesa(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Despesa</h2>
              <button className="modal-close" onClick={() => setShowNovaDespesa(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Placas ACM Bege"
                  value={novaDespesa.descricao}
                  onChange={(e) => setNovaDespesa({ ...novaDespesa, descricao: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Valor</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={novaDespesa.valor}
                  onChange={(e) => setNovaDespesa({ ...novaDespesa, valor: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select
                  value={novaDespesa.id_categoria}
                  onChange={(e) => setNovaDespesa({ ...novaDespesa, id_categoria: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {categorias.map(cat => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Comprovante (Imagem/PDF)</label>
                <div className="file-input">
                  <Upload size={20} />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setNovaDespesa({ ...novaDespesa, comprovante: e.target.files?.[0] || null })}
                  />
                  <span>{novaDespesa.comprovante ? novaDespesa.comprovante.name : 'Selecionar arquivo'}</span>
                </div>
              </div>
              <div className="info-box">
                <p><strong>Saldo Disponível:</strong> {formatarMoeda(selectedCard.saldo_atual)}</p>
                <p><strong>Saldo Após Despesa:</strong> {formatarMoeda(selectedCard.saldo_atual - parseFloat(novaDespesa.valor || '0'))}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowNovaDespesa(false)}>Cancelar</button>
              <button className="btn-primary" onClick={registrarDespesa}>
                <TrendingDown size={20} />
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Solicitar Verba (Visualizador) */}
      {showSolicitarVerba && !isAdmin && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowSolicitarVerba(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Solicitar Verba Adicional</h2>
              <button className="modal-close" onClick={() => setShowSolicitarVerba(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Valor Solicitado</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={novaSolicitacao.valor}
                  onChange={(e) => setNovaSolicitacao({ ...novaSolicitacao, valor: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Justificativa</label>
                <textarea
                  placeholder="Explique o motivo da solicitação..."
                  rows={4}
                  value={novaSolicitacao.justificativa}
                  onChange={(e) => setNovaSolicitacao({ ...novaSolicitacao, justificativa: e.target.value })}
                />
              </div>
              <div className="info-box warning">
                <AlertCircle size={20} />
                <p>O card ficará com status "Aguardando Verba" até a aprovação do administrador.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSolicitarVerba(false)}>Cancelar</button>
              <button className="btn-primary" onClick={solicitarVerba}>
                <Send size={20} />
                Enviar Solicitação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar Funcionário (Admin) */}
      {showNovoFuncionario && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowNovoFuncionario(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cadastrar Funcionário</h2>
              <button className="modal-close" onClick={() => setShowNovoFuncionario(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome *</label>
                <input type="text" value={novoFuncionario.nome} onChange={e => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })} placeholder="Nome do funcionário" />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={novoFuncionario.email} onChange={e => setNovoFuncionario({ ...novoFuncionario, email: e.target.value })} placeholder="Email do funcionário" />
              </div>
              <div className="info-box">
                <p>O funcionário será cadastrado com permissão <b>visualizador</b> e poderá acessar suas obras no dashboard.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowNovoFuncionario(false)}>Cancelar</button>
              <button className="btn-primary" onClick={cadastrarFuncionario} disabled={!novoFuncionario.nome || !novoFuncionario.email}>Cadastrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardsDeObra;
