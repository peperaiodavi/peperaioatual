import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  ArrowLeft,
  Calendar,
  DollarSign,
  PieChart,
  Filter,
  Trash2
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';
import PessoalLayout from '../components/PessoalLayout';
import './FinanceiroPessoal.css';

interface Transacao {
  id_transacao: string;
  tipo: 'ENTRADA' | 'SAIDA';
  descricao: string;
  valor: number;
  data: string;
  created_at: string;
}

const FinanceiroPessoal: React.FC = () => {
  const navigate = useNavigate();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS');

  // Form state
  const [novaTransacao, setNovaTransacao] = useState({
    tipo: 'ENTRADA' as 'ENTRADA' | 'SAIDA',
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    carregarTransacoes();
  }, []);

  const carregarTransacoes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('transacoes_pessoais')
        .select('*')
        .eq('id_usuario', user.id)
        .order('data', { ascending: false });

      if (error) throw error;

      setTransacoes(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar transações:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const deletarTransacao = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transacoes_pessoais')
        .delete()
        .eq('id_transacao', id);

      if (error) throw error;

      toast.success('Transação deletada com sucesso!');
      carregarTransacoes();
    } catch (error: any) {
      console.error('Erro ao deletar transação:', error);
      toast.error('Erro ao deletar transação');
    }
  };

  const adicionarTransacao = async () => {
    try {
      if (!novaTransacao.descricao || !novaTransacao.valor) {
        toast.error('Preencha todos os campos');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { error } = await supabase
        .from('transacoes_pessoais')
        .insert([{
          id_usuario: user.id,
          tipo: novaTransacao.tipo,
          descricao: novaTransacao.descricao,
          valor: parseFloat(novaTransacao.valor),
          data: new Date(novaTransacao.data).toISOString()
        }]);

      if (error) throw error;

      toast.success('Transação adicionada com sucesso!');
      setShowModal(false);
      setNovaTransacao({
        tipo: 'ENTRADA',
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0]
      });
      carregarTransacoes();
    } catch (error: any) {
      console.error('Erro ao adicionar transação:', error);
      toast.error('Erro ao adicionar transação');
    }
  };

  const calcularResumo = () => {
    const transacoesFiltradas = filtroTipo === 'TODOS' 
      ? transacoes 
      : transacoes.filter(t => t.tipo === filtroTipo);

    const entradas = transacoesFiltradas
      .filter(t => t.tipo === 'ENTRADA')
      .reduce((acc, t) => acc + t.valor, 0);

    const saidas = transacoesFiltradas
      .filter(t => t.tipo === 'SAIDA')
      .reduce((acc, t) => acc + t.valor, 0);

    const saldo = entradas - saidas;

    return { entradas, saidas, saldo };
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

  const { entradas, saidas, saldo } = calcularResumo();

  const transacoesFiltradas = filtroTipo === 'TODOS'
    ? transacoes
    : transacoes.filter(t => t.tipo === filtroTipo);

  return (
    <PessoalLayout>
      <div className="financeiro-pessoal-container">
        {/* Header */}
        <div className="financeiro-header">
          <button 
            className="btn-voltar"
            onClick={() => navigate('/dashboard-selector')}
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>

          <div className="financeiro-header-content">
            <div className="financeiro-title-section">
              <div className="financeiro-icon">
                <Wallet size={32} />
              </div>
              <div>
                <h1 className="financeiro-title">Meu Financeiro Pessoal</h1>
                <p className="financeiro-subtitle">Controle suas finanças de forma privada</p>
              </div>
            </div>

            <button 
              className="btn-adicionar"
              onClick={() => setShowModal(true)}
            >
              <Plus size={20} />
              <span>Nova Transação</span>
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="financeiro-resumo">
          <div className="resumo-card saldo">
            <div className="resumo-card-header">
              <span className="resumo-label">Saldo Atual</span>
              <DollarSign size={20} />
            </div>
            <div className="resumo-valor">{formatarMoeda(saldo)}</div>
            <div className={`resumo-badge ${saldo >= 0 ? 'positivo' : 'negativo'}`}>
              {saldo >= 0 ? 'Positivo' : 'Negativo'}
            </div>
          </div>

          <div className="resumo-card entradas">
            <div className="resumo-card-header">
              <span className="resumo-label">Entradas</span>
              <TrendingUp size={20} />
            </div>
            <div className="resumo-valor">{formatarMoeda(entradas)}</div>
            <div className="resumo-badge positivo">
              {transacoes.filter(t => t.tipo === 'ENTRADA').length} transações
            </div>
          </div>

          <div className="resumo-card saidas">
            <div className="resumo-card-header">
              <span className="resumo-label">Saídas</span>
              <TrendingDown size={20} />
            </div>
            <div className="resumo-valor">{formatarMoeda(saidas)}</div>
            <div className="resumo-badge negativo">
              {transacoes.filter(t => t.tipo === 'SAIDA').length} transações
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="financeiro-filtros">
          <div className="filtros-header">
            <h2 className="filtros-title">
              <Filter size={20} />
              Histórico de Transações
            </h2>
            <div className="filtros-buttons">
              <button
                className={`filtro-btn ${filtroTipo === 'TODOS' ? 'active' : ''}`}
                onClick={() => setFiltroTipo('TODOS')}
              >
                Todos
              </button>
              <button
                className={`filtro-btn entrada ${filtroTipo === 'ENTRADA' ? 'active' : ''}`}
                onClick={() => setFiltroTipo('ENTRADA')}
              >
                Entradas
              </button>
              <button
                className={`filtro-btn saida ${filtroTipo === 'SAIDA' ? 'active' : ''}`}
                onClick={() => setFiltroTipo('SAIDA')}
              >
                Saídas
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Transações */}
        <div className="financeiro-transacoes">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Carregando transações...</p>
            </div>
          ) : transacoesFiltradas.length === 0 ? (
            <div className="empty-state">
              <PieChart size={64} />
              <h3>Nenhuma transação encontrada</h3>
              <p>Adicione sua primeira transação para começar!</p>
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={20} />
                Adicionar Transação
              </button>
            </div>
          ) : (
            <div className="transacoes-lista">
              {transacoesFiltradas.map((transacao) => (
                <div key={transacao.id_transacao} className={`transacao-item ${transacao.tipo.toLowerCase()}`}>
                  <div className="transacao-icon">
                    {transacao.tipo === 'ENTRADA' ? (
                      <TrendingUp size={24} />
                    ) : (
                      <TrendingDown size={24} />
                    )}
                  </div>
                  
                  <div className="transacao-info">
                    <h3 className="transacao-descricao">{transacao.descricao}</h3>
                    <div className="transacao-meta">
                      <Calendar size={14} />
                      <span>{formatarData(transacao.data)}</span>
                    </div>
                  </div>

                  <div className="transacao-valor-container">
                    <span className={`transacao-valor ${transacao.tipo.toLowerCase()}`}>
                      {transacao.tipo === 'ENTRADA' ? '+' : '-'} {formatarMoeda(transacao.valor)}
                    </span>
                    <button 
                      className="btn-delete"
                      onClick={() => deletarTransacao(transacao.id_transacao)}
                      title="Deletar transação"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Nova Transação */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Nova Transação</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Tipo</label>
                  <div className="tipo-buttons">
                    <button
                      className={`tipo-btn entrada ${novaTransacao.tipo === 'ENTRADA' ? 'active' : ''}`}
                      onClick={() => setNovaTransacao({ ...novaTransacao, tipo: 'ENTRADA' })}
                    >
                      <TrendingUp size={20} />
                      Entrada
                    </button>
                    <button
                      className={`tipo-btn saida ${novaTransacao.tipo === 'SAIDA' ? 'active' : ''}`}
                      onClick={() => setNovaTransacao({ ...novaTransacao, tipo: 'SAIDA' })}
                    >
                      <TrendingDown size={20} />
                      Saída
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Salário, Aluguel, Compras..."
                    value={novaTransacao.descricao}
                    onChange={(e) => setNovaTransacao({ ...novaTransacao, descricao: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={novaTransacao.valor}
                    onChange={(e) => setNovaTransacao({ ...novaTransacao, valor: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={novaTransacao.data}
                    onChange={(e) => setNovaTransacao({ ...novaTransacao, data: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-primary"
                  onClick={adicionarTransacao}
                >
                  <Plus size={20} />
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PessoalLayout>
  );
};

export default FinanceiroPessoal;
