import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  ArrowLeft, 
  Filter,
  Search
} from 'lucide-react';
import { usePermissao } from '../context/PermissaoContext';
import type { StatusProjeto } from '../types/financeiro';

// Hooks customizados
import { useCardsDeObra } from '../hooks/useCardsDeObra';
import { useDespesasDeObra } from '../hooks/useDespesasDeObra';

// Components
import { CardObraItem } from '../components/cards/CardObraItem';
import { TransferirVerbaModal } from '../components/cards/TransferirVerbaModal';

// CSS
import './CardsDeObra.css';

/**
 * Página de Gerenciamento de Cards de Obra (ADMIN)
 * Responsável por visualizar, criar, editar e gerenciar cards
 */
const CardsDeObra: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = usePermissao();

  // Hooks
  const { 
    cards, 
    loading,
    selectedCard,
    setSelectedCard,
    transferirVerba,
    aprovarCard,
    rejeitarCard
  } = useCardsDeObra();

  const { categorias } = useDespesasDeObra();

  // Estados locais de UI
  const [filtroStatus, setFiltroStatus] = useState<StatusProjeto | 'TODOS'>('TODOS');
  const [busca, setBusca] = useState('');
  const [showTransferirVerba, setShowTransferirVerba] = useState(false);
  const [cardParaTransferir, setCardParaTransferir] = useState<typeof cards[0] | null>(null);

  // ============================================
  // FILTROS
  // ============================================

  const cardsFiltrados = cards.filter(card => {
    const matchStatus = filtroStatus === 'TODOS' || card.status === filtroStatus;
    const matchBusca = busca === '' || 
      card.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      card.nome_cliente.toLowerCase().includes(busca.toLowerCase());
    
    return matchStatus && matchBusca;
  });

  // ============================================
  // HANDLERS
  // ============================================

  const handleTransferirVerba = (card: typeof cards[0]) => {
    setCardParaTransferir(card);
    setShowTransferirVerba(true);
  };

  const handleAprovar = async (card: typeof cards[0]) => {
    const confirmacao = window.confirm(
      `Deseja aprovar a obra "${card.titulo}"?\n\n` +
      `O saldo restante (R$ ${card.saldo_atual.toFixed(2)}) será devolvido ao orçamento.`
    );

    if (confirmacao) {
      await aprovarCard(card);
    }
  };

  const handleRejeitar = async (card: typeof cards[0]) => {
    const motivo = window.prompt(
      `Motivo da rejeição da obra "${card.titulo}":`
    );

    if (motivo !== null) {
      await rejeitarCard(card.id_card, motivo);
    }
  };

  const handleTransferirSubmit = async (valor: number) => {
    if (cardParaTransferir) {
      await transferirVerba(cardParaTransferir, valor);
      setShowTransferirVerba(false);
      setCardParaTransferir(null);
    }
  };

  // ============================================
  // UTILIDADES
  // ============================================

  const getStatusColor = (status: StatusProjeto) => {
    const cores: Record<StatusProjeto, string> = {
      'PENDENTE': '#f59e0b',
      'EM_ANDAMENTO': '#3b82f6',
      'AGUARDANDO_VERBA': '#8b5cf6',
      'EM_ANALISE': '#06b6d4',
      'FINALIZADO': '#10b981',
      'CANCELADO': '#ef4444'
    };
    return cores[status] || '#6b7280';
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando cards...</p>
      </div>
    );
  }

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
              <h1>Cards de Obra</h1>
              <p>Gerencie os cards de obra e transfira verbas</p>
            </div>
          </div>

          {isAdmin && (
            <button className="btn-primary" onClick={() => navigate('/obras')}>
              <Plus size={20} />
              Ver Obras
            </button>
          )}
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por título ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="filtros">
          <Filter size={18} />
          <button
            className={`filtro-btn ${filtroStatus === 'TODOS' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('TODOS')}
          >
            Todos
          </button>
          <button
            className={`filtro-btn ${filtroStatus === 'EM_ANDAMENTO' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('EM_ANDAMENTO')}
          >
            Em Andamento
          </button>
          <button
            className={`filtro-btn ${filtroStatus === 'EM_ANALISE' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('EM_ANALISE')}
          >
            Em Análise
          </button>
          <button
            className={`filtro-btn ${filtroStatus === 'FINALIZADO' ? 'active' : ''}`}
            onClick={() => setFiltroStatus('FINALIZADO')}
          >
            Finalizados
          </button>
        </div>
      </div>

      {/* Lista de Cards */}
      <div className="cards-grid">
        {cardsFiltrados.length === 0 ? (
          <div className="empty-state">
            <Building2 size={64} />
            <h3>Nenhum card encontrado</h3>
            <p>
              {busca 
                ? 'Tente ajustar os filtros de busca' 
                : 'Crie um novo card para começar'}
            </p>
          </div>
        ) : (
          cardsFiltrados.map((card) => (
            <CardObraItem
              key={card.id_card}
              card={card}
              onSelect={setSelectedCard}
              onTransferirVerba={handleTransferirVerba}
              onAprovar={handleAprovar}
              onRejeitar={handleRejeitar}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>

      {/* Modal: Transferir Verba */}
      {showTransferirVerba && cardParaTransferir && (
        <TransferirVerbaModal
          card={cardParaTransferir}
          onClose={() => {
            setShowTransferirVerba(false);
            setCardParaTransferir(null);
          }}
          onTransferir={handleTransferirSubmit}
        />
      )}
    </div>
  );
};

export default CardsDeObra;
