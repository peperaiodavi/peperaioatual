import React, { useState, useEffect } from 'react';
import { Building2, TrendingUp, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';
import './CardsDeObraWidget.css';

interface CardDeObra {
  id_card: string;
  titulo: string;
  nome_cliente: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'AGUARDANDO_VERBA' | 'EM_ANALISE' | 'FINALIZADO' | 'CANCELADO';
  valor_venda_orcamento: number;
  saldo_atual: number;
  total_gasto: number;
}

interface Props {
  userRole: 'admin' | 'visualizador';
}

const CardsDeObraWidget: React.FC<Props> = ({ userRole }) => {
  const [cards, setCards] = useState<CardDeObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    emAndamento: 0,
    aguardandoVerba: 0,
    finalizados: 0
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Carregar cards (admin vê todos, visualizador só os seus)
      let query = supabase.from('cards_de_obra').select('*');
      
      if (userRole === 'visualizador') {
        query = query.eq('id_visualizador_responsavel', user.id);
      }

      const { data: cardsData, error: cardsError } = await query
        .order('created_at', { ascending: false })
        .limit(3);

      if (cardsError) {
        console.error('Erro ao carregar cards:', cardsError);
        throw cardsError;
      }

      setCards(cardsData || []);

      // Calcular estatísticas
      const { data: allCards } = await (userRole === 'admin' 
        ? supabase.from('cards_de_obra').select('status')
        : supabase.from('cards_de_obra').select('status').eq('id_visualizador_responsavel', user.id));

      if (allCards) {
        setStats({
          total: allCards.length,
          emAndamento: allCards.filter(c => c.status === 'EM_ANDAMENTO').length,
          aguardandoVerba: allCards.filter(c => c.status === 'AGUARDANDO_VERBA').length,
          finalizados: allCards.filter(c => c.status === 'FINALIZADO').length
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar cards de obra');
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return { label: 'Pendente', color: '#f59e0b', icon: Clock };
      case 'EM_ANDAMENTO':
        return { label: 'Em Andamento', color: '#3b82f6', icon: TrendingUp };
      case 'AGUARDANDO_VERBA':
        return { label: 'Aguardando Verba', color: '#8b5cf6', icon: AlertCircle };
      case 'EM_ANALISE':
        return { label: 'Em Análise', color: '#06b6d4', icon: CheckCircle };
      case 'FINALIZADO':
        return { label: 'Finalizado', color: '#10b981', icon: CheckCircle };
      case 'CANCELADO':
        return { label: 'Cancelado', color: '#ef4444', icon: AlertCircle };
      default:
        return { label: status, color: '#6b7280', icon: AlertCircle };
    }
  };

  const calcularProgresso = (card: CardDeObra) => {
    if (card.valor_venda_orcamento === 0) return 0;
    return Math.min((card.total_gasto / card.valor_venda_orcamento) * 100, 100);
  };

  if (loading) {
    return (
      <div className="cards-obra-widget loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="cards-obra-widget">
      <div className="widget-header">
        <div className="widget-icon obra">
          <Building2 size={24} />
        </div>
        <div className="widget-title-section">
          <h3>{userRole === 'admin' ? 'Todos os Cards de Obra' : 'Meus Cards de Obra'}</h3>
          <span className="widget-subtitle">Projetos em andamento</span>
        </div>
      </div>

      <div className="widget-stats">
        <div className="stat-item">
          <span className="stat-valor">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-valor">{stats.emAndamento}</span>
          <span className="stat-label">Ativas</span>
        </div>
        <div className="stat-item">
          <span className="stat-valor">{stats.aguardandoVerba}</span>
          <span className="stat-label">Aguardando</span>
        </div>
        <div className="stat-item">
          <span className="stat-valor">{stats.finalizados}</span>
          <span className="stat-label">Finalizadas</span>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="widget-empty">
          <Building2 size={32} />
          <p>Nenhum card de obra encontrado</p>
        </div>
      ) : (
        <div className="cards-lista">
          {cards.map((card) => {
            const statusConfig = getStatusConfig(card.status);
            const progresso = calcularProgresso(card);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={card.id_card} className="card-item">
                <div className="card-item-header">
                  <div className="card-item-info">
                    <h4>{card.titulo}</h4>
                    <span className="card-cliente">{card.nome_cliente}</span>
                  </div>
                  <span 
                    className="card-status"
                    style={{
                      backgroundColor: `${statusConfig.color}20`,
                      color: statusConfig.color
                    }}
                  >
                    <StatusIcon size={12} />
                    {statusConfig.label}
                  </span>
                </div>

                <div className="card-financeiro">
                  <div className="financeiro-item">
                    <span className="financeiro-label">Orçamento</span>
                    <span className="financeiro-valor">{formatarMoeda(card.valor_venda_orcamento)}</span>
                  </div>
                  <div className="financeiro-item">
                    <span className="financeiro-label">Saldo</span>
                    <span className="financeiro-valor saldo">{formatarMoeda(card.saldo_atual)}</span>
                  </div>
                  <div className="financeiro-item">
                    <span className="financeiro-label">Gasto</span>
                    <span className="financeiro-valor gasto">{formatarMoeda(card.total_gasto)}</span>
                  </div>
                </div>

                <div className="card-progresso">
                  <div className="progresso-header">
                    <span className="progresso-label">Progresso</span>
                    <span className="progresso-percentual">{progresso.toFixed(0)}%</span>
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
          })}
        </div>
      )}

      <button 
        className="widget-ver-mais" 
        onClick={() => window.location.href = userRole === 'admin' ? '/cards-de-obra' : '/minhas-obras'}
      >
        Ver Todos os Cards →
      </button>
    </div>
  );
};

export default CardsDeObraWidget;
