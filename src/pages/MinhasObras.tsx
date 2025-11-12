import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Trash2,
  ArrowLeft, 
  DollarSign, 
  TrendingDown,
  AlertCircle,
  Package,
  FileText,
  Upload,
  X,
  Eye,
  Calendar,
  User,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';
import type { 
  CardDeObra, 
  DespesaDeObra, 
  CategoriaDeGasto 
} from '../types/financeiro';
import './MinhasObras.css';

const MinhasObras: React.FC = () => {
  const navigate = useNavigate();
  const [obras, setObras] = useState<CardDeObra[]>([]);
  const [obraSelecionada, setObraSelecionada] = useState<CardDeObra | null>(null);
  const [despesas, setDespesas] = useState<DespesaDeObra[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDeGasto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [showModalGasto, setShowModalGasto] = useState(false);
  const [showModalDetalhes, setShowModalDetalhes] = useState(false);

  // Form
  const [novoGasto, setNovoGasto] = useState({
    descricao: '',
    valor: '',
    id_categoria: '',
    comprovante: null as File | null
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      await Promise.all([
        carregarObras(),
        carregarCategorias()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar suas obras');
    } finally {
      setLoading(false);
    }
  };

  const carregarObras = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca apenas obras atribuídas ao visualizador logado
      const { data, error } = await supabase
        .from('cards_de_obra')
        .select('*')
        .eq('id_visualizador_responsavel', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setObras(data || []);
    } catch (error) {
      console.error('Erro ao carregar obras:', error);
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

  const abrirDetalhesObra = async (obra: CardDeObra) => {
    try {
      setObraSelecionada(obra);

      // Carregar despesas da obra
      const { data: despesasData, error } = await supabase
        .from('despesas_de_obra')
        .select(`
          *,
          categoria:categorias_de_gasto(*)
        `)
        .eq('id_card', obra.id_card)
        .order('data', { ascending: false });

      if (error) throw error;
      
      // Filtrar despesas de transferência de verba (só aparecem na página Obras)
      const despesasFiltradas = (despesasData || []).filter(
        (despesa) => {
          const comprovante = despesa?.url_comprovante ?? '';
          return !comprovante.startsWith('verba_');
        }
      );
      
      setDespesas(despesasFiltradas);
      setShowModalDetalhes(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes da obra');
    }
  };

  const registrarGasto = async () => {
    try {
      if (!obraSelecionada || !novoGasto.descricao || !novoGasto.valor || !novoGasto.id_categoria) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      // Validação do UUID da categoria
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(novoGasto.id_categoria)) {
        console.error('ID Categoria inválido:', novoGasto.id_categoria);
        toast.error('Categoria inválida selecionada');
        return;
      }

      const valorGasto = parseFloat(novoGasto.valor);

      // Validação: verifica se há saldo suficiente
      if (valorGasto > obraSelecionada.saldo_atual) {
        toast.error('Saldo insuficiente na obra!');
        return;
      }

      if (valorGasto <= 0) {
        toast.error('Valor deve ser maior que zero');
        return;
      }

      // TODO: Upload do comprovante para Storage (será implementado)
      const urlComprovante = novoGasto.comprovante 
        ? 'pending_upload' 
        : 'sem_comprovante';

      const novoSaldo = obraSelecionada.saldo_atual - valorGasto;
      const novoTotalGasto = obraSelecionada.total_gasto + valorGasto;

      // Debug: log dos dados antes de enviar
      const dataToInsert = {
        id_card: obraSelecionada.id_card,
        id_categoria: novoGasto.id_categoria,
        descricao: novoGasto.descricao,
        valor: valorGasto,
        url_comprovante: urlComprovante,
        status: 'PENDENTE'
      };
      console.log('Dados a inserir em despesas_de_obra:', dataToInsert);
      console.log('Tipos:', {
        id_card: typeof obraSelecionada.id_card,
        id_categoria: typeof novoGasto.id_categoria,
        descricao: typeof novoGasto.descricao,
        valor: typeof valorGasto,
        url_comprovante: typeof urlComprovante,
        status: typeof 'PENDENTE'
      });

      // Inserir despesa
      const { error: despesaError, data: despesaData } = await supabase
        .from('despesas_de_obra')
        .insert([dataToInsert]);
      
      if (despesaError) {
        console.error('Erro Supabase ao inserir despesa:', despesaError);
        throw despesaError;
      }
      
      console.log('Despesa inserida com sucesso:', despesaData);

      if (despesaError) throw despesaError;

      // Atualizar saldo e total gasto do card
      const { error: updateError } = await supabase
        .from('cards_de_obra')
        .update({ 
          saldo_atual: novoSaldo,
          total_gasto: novoTotalGasto
        })
        .eq('id_card', obraSelecionada.id_card);

      if (updateError) throw updateError;

      toast.success('Gasto registrado com sucesso!');
      
      // Limpar form
      setNovoGasto({ descricao: '', valor: '', id_categoria: '', comprovante: null });
      setShowModalGasto(false);
      
      // Recarregar dados
      await carregarObras();
      
      // Atualizar obra selecionada
      const obraAtualizada = { 
        ...obraSelecionada, 
        saldo_atual: novoSaldo,
        total_gasto: novoTotalGasto
      };
      setObraSelecionada(obraAtualizada);
      
      // Recarregar despesas
      await abrirDetalhesObra(obraAtualizada);
    } catch (error: any) {
      console.error('Erro ao registrar gasto:', error);
      console.error('Detalhes do erro:', error?.message || error);
      const errorMsg = error?.message || 'Erro ao registrar gasto';
      toast.error(errorMsg);
    }
  };

  const excluirGasto = async (despesa: DespesaDeObra) => {
    try {
      if (!obraSelecionada) return;

      const confirmacao = window.confirm(
        `Deseja realmente excluir o gasto "${despesa.descricao}"?\n\n` +
        `Valor: ${formatarMoeda(despesa.valor)}\n\n` +
        `O valor será devolvido ao saldo da obra.`
      );

      if (!confirmacao) return;

      const novoSaldo = obraSelecionada.saldo_atual + despesa.valor;
      const novoTotalGasto = obraSelecionada.total_gasto - despesa.valor;

      // Deletar despesa
      const { error: deleteError, data: deleteData } = await supabase
        .from('despesas_de_obra')
        .delete()
        .eq('id_despesa', despesa.id_despesa);

      if (deleteError) {
        console.error('Erro Supabase ao deletar despesa:', deleteError);
        throw deleteError;
      }
      
      console.log('Despesa deletada com sucesso:', deleteData);

      // Atualizar card
      const { error: updateError } = await supabase
        .from('cards_de_obra')
        .update({ 
          saldo_atual: novoSaldo,
          total_gasto: novoTotalGasto
        })
        .eq('id_card', obraSelecionada.id_card);

      if (updateError) {
        console.error('Erro ao atualizar card:', updateError);
        throw updateError;
      }

      toast.success('Gasto excluído com sucesso!');
      
      // Recarregar dados
      await carregarObras();
      
      // Atualizar obra selecionada
      const obraAtualizada = { 
        ...obraSelecionada, 
        saldo_atual: novoSaldo,
        total_gasto: novoTotalGasto
      };
      setObraSelecionada(obraAtualizada);
      
      // Recarregar despesas
      await abrirDetalhesObra(obraAtualizada);
    } catch (error: any) {
      console.error('Erro ao excluir gasto:', error);
      console.error('Detalhes do erro:', error?.message || error);
      const errorMsg = error?.message || 'Erro ao excluir gasto';
      toast.error(errorMsg);
    }
  };

  const finalizarObra = async () => {
    try {
      if (!obraSelecionada) return;

      // Só pode finalizar se estiver EM_ANDAMENTO
      if (obraSelecionada.status !== 'EM_ANDAMENTO') {
        toast.error('Apenas obras em andamento podem ser finalizadas');
        return;
      }

      const confirmacao = window.confirm(
        `Deseja realmente finalizar a obra "${obraSelecionada.titulo}"?\n\n` +
        `Ela será enviada para análise do administrador.\n` +
        `Gastos remanescentes serão calculados como estorno.`
      );

      if (!confirmacao) return;

      // Atualizar status para EM_ANALISE
      const { error: updateError } = await supabase
        .from('cards_de_obra')
        .update({ 
          status: 'EM_ANALISE',
          finalizado_em: new Date().toISOString()
        })
        .eq('id_card', obraSelecionada.id_card);

      if (updateError) {
        console.error('Erro ao finalizar obra:', updateError);
        throw updateError;
      }

      toast.success('Obra finalizada! Aguardando análise do administrador.');
      
      // Recarregar dados
      await carregarObras();
      setShowModalDetalhes(false);
      setObraSelecionada(null);
    } catch (error: any) {
      console.error('Erro ao finalizar obra:', error);
      console.error('Detalhes do erro:', error?.message || error);
      const errorMsg = error?.message || 'Erro ao finalizar obra';
      toast.error(errorMsg);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calcularProgresso = (obra: CardDeObra) => {
    if (obra.valor_venda_orcamento === 0) return 0;
    return Math.min((obra.total_gasto / obra.valor_venda_orcamento) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    const cores = {
      'PENDENTE': '#f59e0b',
      'EM_ANDAMENTO': '#3b82f6',
      'AGUARDANDO_VERBA': '#8b5cf6',
      'EM_ANALISE': '#06b6d4',
      'FINALIZADO': '#10b981',
      'CANCELADO': '#ef4444'
    };
    return cores[status as keyof typeof cores] || '#6b7280';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'PENDENTE': 'Aguardando Início',
      'EM_ANDAMENTO': 'Em Andamento',
      'AGUARDANDO_VERBA': 'Aguardando Verba',
      'EM_ANALISE': 'Em Análise',
      'FINALIZADO': 'Finalizado',
      'CANCELADO': 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="minhas-obras-page">
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
              <h1>Minhas Obras</h1>
              <p>Gerencie os gastos das suas obras atribuídas</p>
            </div>
          </div>

          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-label">Total de Obras</span>
              <span className="stat-valor">{obras.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Em Andamento</span>
              <span className="stat-valor">{obras.filter(o => o.status === 'EM_ANDAMENTO').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Obras */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando suas obras...</p>
        </div>
      ) : obras.length === 0 ? (
        <div className="empty-state">
          <Building2 size={64} />
          <h3>Nenhuma obra atribuída</h3>
          <p>Aguarde o administrador atribuir obras para você gerenciar</p>
        </div>
      ) : (
        <div className="obras-grid">
          {obras.map(obra => {
            const progresso = calcularProgresso(obra);
            const statusColor = getStatusColor(obra.status);
            const podeRegistrarGastos = obra.status === 'EM_ANDAMENTO';

            return (
              <div 
                key={obra.id_card} 
                className="obra-card"
                style={{ borderColor: `${statusColor}30` }}
              >
                {/* Header do Card */}
                <div className="obra-card-header">
                  <div className="obra-titulo-section">
                    <h3>{obra.titulo}</h3>
                    <span 
                      className="obra-status-badge"
                      style={{ 
                        backgroundColor: `${statusColor}20`,
                        color: statusColor 
                      }}
                    >
                      {getStatusLabel(obra.status)}
                    </span>
                  </div>
                  <div className="obra-cliente">
                    <User size={14} />
                    <span>{obra.nome_cliente}</span>
                  </div>
                </div>

                {/* Resumo Financeiro */}
                <div className="obra-financeiro">
                  <div className="financeiro-row">
                    <div className="financeiro-item orcamento">
                      <span className="financeiro-label">Orçamento Total</span>
                      <span className="financeiro-valor">{formatarMoeda(obra.valor_venda_orcamento)}</span>
                    </div>
                    <div className="financeiro-item saldo">
                      <span className="financeiro-label">Saldo Disponível</span>
                      <span className="financeiro-valor">{formatarMoeda(obra.saldo_atual)}</span>
                    </div>
                  </div>
                  <div className="financeiro-row">
                    <div className="financeiro-item gasto">
                      <span className="financeiro-label">Total Gasto</span>
                      <span className="financeiro-valor">{formatarMoeda(obra.total_gasto)}</span>
                    </div>
                    <div className="financeiro-item progresso-info">
                      <span className="financeiro-label">Execução</span>
                      <span className="financeiro-valor">{progresso.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="obra-progresso">
                  <div className="progresso-bar">
                    <div 
                      className="progresso-fill"
                      style={{ 
                        width: `${progresso}%`,
                        backgroundColor: statusColor
                      }}
                    />
                  </div>
                </div>

                {/* Ações */}
                <div className="obra-acoes">
                  <button 
                    className="btn-acao ver-detalhes"
                    onClick={() => abrirDetalhesObra(obra)}
                  >
                    <Eye size={18} />
                    Ver Detalhes
                  </button>
                  <button 
                    className="btn-acao registrar-gasto"
                    onClick={() => {
                      setObraSelecionada(obra);
                      setShowModalGasto(true);
                    }}
                    disabled={!podeRegistrarGastos}
                  >
                    <Plus size={18} />
                    Registrar Gasto
                  </button>
                </div>

                {/* Alerta se não pode registrar gastos */}
                {!podeRegistrarGastos && (
                  <div className="obra-alerta">
                    <AlertCircle size={16} />
                    <span>
                      {obra.status === 'PENDENTE' && 'Aguardando início da obra'}
                      {obra.status === 'AGUARDANDO_VERBA' && 'Aguardando aprovação de verba'}
                      {obra.status === 'EM_ANALISE' && 'Obra em análise pelo admin'}
                      {obra.status === 'FINALIZADO' && 'Obra finalizada'}
                      {obra.status === 'CANCELADO' && 'Obra cancelada'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Registrar Gasto */}
      {showModalGasto && obraSelecionada && (
        <div className="modal-overlay" onClick={() => setShowModalGasto(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Registrar Gasto</h2>
                <p>{obraSelecionada.titulo}</p>
              </div>
              <button className="modal-close" onClick={() => setShowModalGasto(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="saldo-info-destaque">
                <DollarSign size={24} />
                <div>
                  <span className="saldo-label">Saldo Disponível</span>
                  <span className="saldo-valor">{formatarMoeda(obraSelecionada.saldo_atual)}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Descrição do Gasto *</label>
                <input
                  type="text"
                  placeholder="Ex: Placas ACM Bege, Mão de obra instalação..."
                  value={novoGasto.descricao}
                  onChange={(e) => setNovoGasto({ ...novoGasto, descricao: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor do Gasto *</label>
                  <div className="input-with-icon">
                    <DollarSign size={18} />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={novoGasto.valor}
                      onChange={(e) => setNovoGasto({ ...novoGasto, valor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Categoria *</label>
                  <select
                    value={novoGasto.id_categoria}
                    onChange={(e) => setNovoGasto({ ...novoGasto, id_categoria: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {categorias.map(cat => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Comprovante (Opcional)</label>
                <div className="file-upload-area">
                  <Upload size={24} />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setNovoGasto({ ...novoGasto, comprovante: e.target.files?.[0] || null })}
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="file-label">
                    {novoGasto.comprovante ? (
                      <span className="file-selected">{novoGasto.comprovante.name}</span>
                    ) : (
                      <>
                        <span>Clique para selecionar</span>
                        <span className="file-hint">JPG, PNG ou PDF (máx. 5MB)</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {novoGasto.valor && parseFloat(novoGasto.valor) > 0 && (
                <div className="preview-calculo">
                  <div className="calculo-item">
                    <span>Saldo Atual:</span>
                    <span>{formatarMoeda(obraSelecionada.saldo_atual)}</span>
                  </div>
                  <div className="calculo-item destaque">
                    <span>Valor do Gasto:</span>
                    <span className="negativo">-{formatarMoeda(parseFloat(novoGasto.valor))}</span>
                  </div>
                  <div className="calculo-divider"></div>
                  <div className="calculo-item total">
                    <span>Saldo Restante:</span>
                    <span className={
                      (obraSelecionada.saldo_atual - parseFloat(novoGasto.valor)) < 0 
                        ? 'negativo' 
                        : 'positivo'
                    }>
                      {formatarMoeda(obraSelecionada.saldo_atual - parseFloat(novoGasto.valor))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModalGasto(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={registrarGasto}>
                <Plus size={20} />
                Registrar Gasto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhes da Obra */}
      {showModalDetalhes && obraSelecionada && (
        <div className="modal-overlay" onClick={() => setShowModalDetalhes(false)}>
          <div className="modal-detalhes" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{obraSelecionada.titulo}</h2>
                <p>{obraSelecionada.nome_cliente}</p>
              </div>
              <button className="modal-close" onClick={() => setShowModalDetalhes(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body-detalhes">
              {/* Resumo Financeiro Expandido */}
              <div className="resumo-financeiro-expandido">
                <div className="resumo-card orcamento">
                  <Package size={24} />
                  <div>
                    <span className="resumo-label">Orçamento Total</span>
                    <span className="resumo-valor">{formatarMoeda(obraSelecionada.valor_venda_orcamento)}</span>
                  </div>
                </div>
                <div className="resumo-card saldo">
                  <DollarSign size={24} />
                  <div>
                    <span className="resumo-label">Saldo Disponível</span>
                    <span className="resumo-valor">{formatarMoeda(obraSelecionada.saldo_atual)}</span>
                  </div>
                </div>
                <div className="resumo-card gasto">
                  <TrendingDown size={24} />
                  <div>
                    <span className="resumo-label">Total Gasto</span>
                    <span className="resumo-valor">{formatarMoeda(obraSelecionada.total_gasto)}</span>
                  </div>
                </div>
              </div>

              {/* Lista de Gastos */}
              <div className="gastos-section">
                <div className="section-header">
                  <h3>
                    <FileText size={20} />
                    Gastos Registrados
                  </h3>
                  {obraSelecionada.status === 'EM_ANDAMENTO' && (
                    <button 
                      className="btn-adicionar-pequeno"
                      onClick={() => {
                        setShowModalDetalhes(false);
                        setShowModalGasto(true);
                      }}
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  )}
                </div>

                {despesas.length === 0 ? (
                  <div className="empty-message">
                    <FileText size={48} />
                    <p>Nenhum gasto registrado ainda</p>
                  </div>
                ) : (
                  <div className="gastos-lista">
                    {despesas.map(despesa => (
                      <div key={despesa.id_despesa} className="gasto-item">
                        <div className="gasto-info">
                          <div className="gasto-header">
                            <h4>{despesa.descricao}</h4>
                            <span className="gasto-valor">-{formatarMoeda(despesa.valor)}</span>
                          </div>
                          <div className="gasto-meta">
                            <span className="gasto-categoria">
                              {(despesa as any).categoria?.nome || 'Sem categoria'}
                            </span>
                            <span className="gasto-data">
                              <Calendar size={14} />
                              {formatarData(despesa.data)}
                            </span>
                            <span 
                              className="gasto-status"
                              style={{
                                color: despesa.status === 'APROVADO' ? '#10b981' :
                                       despesa.status === 'REPROVADO' ? '#ef4444' : '#f59e0b'
                              }}
                            >
                              {despesa.status}
                            </span>
                          </div>
                        </div>
                        {obraSelecionada.status === 'EM_ANDAMENTO' && (
                          <button 
                            className="btn-excluir"
                            onClick={() => excluirGasto(despesa)}
                            title="Excluir gasto"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer com botão de Finalizar */}
            <div className="modal-footer-detalhes">
              <button 
                className="btn-secondary" 
                onClick={() => setShowModalDetalhes(false)}
              >
                Fechar
              </button>
              {obraSelecionada.status === 'EM_ANDAMENTO' && (
                <button 
                  className="btn-finalizar"
                  onClick={finalizarObra}
                >
                  <CheckCircle size={20} />
                  Finalizar Obra
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinhasObras;
