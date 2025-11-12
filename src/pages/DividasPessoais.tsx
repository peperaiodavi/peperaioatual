import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingDown, Plus, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';
import PessoalLayout from '../components/PessoalLayout';
import './FinanceiroPessoal.css';

interface Divida {
  id_divida: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'paga' | 'atrasada';
  created_at: string;
}

const DividasPessoais: React.FC = () => {
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'pendente' | 'paga' | 'atrasada'>('TODOS');

  const [novaDivida, setNovaDivida] = useState({
    descricao: '',
    valor: '',
    data_vencimento: new Date().toISOString().split('T')[0],
    status: 'pendente' as 'pendente' | 'paga' | 'atrasada'
  });

  useEffect(() => {
    carregarDividas();
  }, []);

  const carregarDividas = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('dividas_pessoais')
        .select('*')
        .eq('id_usuario', user.id)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      setDividas(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar dívidas:', error);
      toast.error('Erro ao carregar dívidas');
    } finally {
      setLoading(false);
    }
  };

  const adicionarDivida = async () => {
    try {
      if (!novaDivida.descricao || !novaDivida.valor) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { error } = await supabase
        .from('dividas_pessoais')
        .insert([{
          id_usuario: user.id,
          descricao: novaDivida.descricao,
          valor: parseFloat(novaDivida.valor),
          data_vencimento: novaDivida.data_vencimento,
          status: novaDivida.status
        }]);

      if (error) throw error;

      toast.success('Dívida adicionada com sucesso!');
      setShowModal(false);
      setNovaDivida({
        descricao: '',
        valor: '',
        data_vencimento: new Date().toISOString().split('T')[0],
        status: 'pendente'
      });
      carregarDividas();
    } catch (error: any) {
      console.error('Erro ao adicionar dívida:', error);
      toast.error('Erro ao adicionar dívida');
    }
  };

  const deletarDivida = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dividas_pessoais')
        .delete()
        .eq('id_divida', id);

      if (error) throw error;

      toast.success('Dívida deletada com sucesso!');
      carregarDividas();
    } catch (error: any) {
      console.error('Erro ao deletar dívida:', error);
      toast.error('Erro ao deletar dívida');
    }
  };

  const atualizarStatus = async (id: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('dividas_pessoais')
        .update({ status: novoStatus })
        .eq('id_divida', id);

      if (error) throw error;

      toast.success('Status atualizado com sucesso!');
      carregarDividas();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const calcularResumo = () => {
    const dividasFiltradas = filtroStatus === 'TODOS'
      ? dividas
      : dividas.filter(d => d.status === filtroStatus);

    const totalPendente = dividasFiltradas
      .filter(d => d.status === 'pendente')
      .reduce((acc, d) => acc + d.valor, 0);

    const totalPaga = dividasFiltradas
      .filter(d => d.status === 'paga')
      .reduce((acc, d) => acc + d.valor, 0);

    const totalAtrasada = dividasFiltradas
      .filter(d => d.status === 'atrasada')
      .reduce((acc, d) => acc + d.valor, 0);

    return { totalPendente, totalPaga, totalAtrasada, total: totalPendente + totalPaga + totalAtrasada };
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

  const { totalPendente, totalPaga, totalAtrasada } = calcularResumo();

  const dividasFiltradas = filtroStatus === 'TODOS'
    ? dividas
    : dividas.filter(d => d.status === filtroStatus);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pendente': return 'warning';
      case 'paga': return 'positivo';
      case 'atrasada': return 'negativo';
      default: return 'info';
    }
  };

  return (
    <PessoalLayout>
      <div className="financeiro-pessoal-container">
        {/* Header */}
        <div className="financeiro-header">
          <div className="financeiro-header-content">
            <div className="financeiro-title-section">
              <div className="financeiro-icon">
                <CreditCard size={32} />
              </div>
              <div>
                <h1 className="financeiro-title">Minhas Dívidas Pessoais</h1>
                <p className="financeiro-subtitle">Acompanhe suas dívidas e compromissos financeiros</p>
              </div>
            </div>

            <button 
              className="btn-adicionar"
              onClick={() => setShowModal(true)}
            >
              <Plus size={20} />
              <span>Nova Dívida</span>
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="financeiro-resumo">
          <div className="resumo-card warning">
            <div className="resumo-card-header">
              <span className="resumo-label">Pendentes</span>
              <TrendingDown size={20} />
            </div>
            <div className="resumo-valor">{formatarMoeda(totalPendente)}</div>
            <div className="resumo-badge warning">
              {dividas.filter(d => d.status === 'pendente').length} dívidas
            </div>
          </div>

          <div className="resumo-card info">
            <div className="resumo-card-header">
              <span className="resumo-label">Pagas</span>
              <TrendingDown size={20} />
            </div>
            <div className="resumo-valor">{formatarMoeda(totalPaga)}</div>
            <div className="resumo-badge positivo">
              {dividas.filter(d => d.status === 'paga').length} dívidas
            </div>
          </div>

          <div className="resumo-card danger">
            <div className="resumo-card-header">
              <span className="resumo-label">Atrasadas</span>
              <TrendingDown size={20} />
            </div>
            <div className="resumo-valor">{formatarMoeda(totalAtrasada)}</div>
            <div className="resumo-badge negativo">
              {dividas.filter(d => d.status === 'atrasada').length} dívidas
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="financeiro-filtros">
          <div className="filtros-header">
            <h2 className="filtros-title">Lista de Dívidas</h2>
            <div className="filtros-buttons">
              {(['TODOS', 'pendente', 'paga', 'atrasada'] as const).map((status) => (
                <button
                  key={status}
                  className={`filtro-btn ${filtroStatus === status ? 'active' : ''}`}
                  onClick={() => setFiltroStatus(status)}
                >
                  {status === 'TODOS' ? 'Todas' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Dívidas */}
        <div className="financeiro-transacoes">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Carregando dívidas...</p>
            </div>
          ) : dividasFiltradas.length === 0 ? (
            <div className="empty-state">
              <CreditCard size={64} />
              <h3>Nenhuma dívida encontrada</h3>
              <p>Adicione sua primeira dívida para começar a acompanhar!</p>
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={20} />
                Adicionar Dívida
              </button>
            </div>
          ) : (
            <div className="transacoes-lista">
              {dividasFiltradas.map((divida) => (
                <div key={divida.id_divida} className={`transacao-item ${divida.status}`}>
                  <div className="transacao-icon">
                    <CreditCard size={24} />
                  </div>
                  
                  <div className="transacao-info">
                    <h3 className="transacao-descricao">{divida.descricao}</h3>
                    <div className="transacao-meta">
                      <Calendar size={14} />
                      <span>Vencimento: {formatarData(divida.data_vencimento)}</span>
                    </div>
                  </div>

                  <div className="transacao-valor-container">
                    <div className="status-control">
                      <select 
                        value={divida.status}
                        onChange={(e) => atualizarStatus(divida.id_divida, e.target.value)}
                        className="status-select"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="paga">Paga</option>
                        <option value="atrasada">Atrasada</option>
                      </select>
                    </div>
                    <span className={`transacao-valor ${getStatusBadge(divida.status)}`}>
                      {formatarMoeda(divida.valor)}
                    </span>
                    <button 
                      className="btn-delete"
                      onClick={() => deletarDivida(divida.id_divida)}
                      title="Deletar dívida"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Nova Dívida */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Nova Dívida Pessoal</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Descrição *</label>
                  <input
                    type="text"
                    placeholder="Ex: Empréstimo, Cartão de crédito..."
                    value={novaDivida.descricao}
                    onChange={(e) => setNovaDivida({ ...novaDivida, descricao: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={novaDivida.valor}
                    onChange={(e) => setNovaDivida({ ...novaDivida, valor: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Data de Vencimento</label>
                  <input
                    type="date"
                    value={novaDivida.data_vencimento}
                    onChange={(e) => setNovaDivida({ ...novaDivida, data_vencimento: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={novaDivida.status}
                    onChange={(e) => setNovaDivida({ ...novaDivida, status: e.target.value as 'pendente' | 'paga' | 'atrasada' })}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="paga">Paga</option>
                    <option value="atrasada">Atrasada</option>
                  </select>
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
                  onClick={adicionarDivida}
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

export default DividasPessoais;
