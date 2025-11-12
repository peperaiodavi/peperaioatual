import React from 'react';
import { Building2, User, DollarSign, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
import type { CardDeObra } from '../../types/financeiro';

interface CardObraItemProps {
  card: CardDeObra;
  onSelect: (card: CardDeObra) => void;
  onTransferirVerba?: (card: CardDeObra) => void;
  onAprovar?: (card: CardDeObra) => void;
  onRejeitar?: (card: CardDeObra) => void;
  isAdmin?: boolean;
}

export const CardObraItem: React.FC<CardObraItemProps> = ({
  card,
  onSelect,
  onTransferirVerba,
  onAprovar,
  onRejeitar,
  isAdmin = false
}) => {
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

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="card-obra-item">
      <div className="card-header">
        <div className="card-title-section">
          <div className="widget-icon">
            <Building2 size={24} />
          </div>
          <div className="card-info">
            <h3>{card.titulo}</h3>
            <p className="card-cliente">
              <User size={14} />
              {card.nome_cliente}
            </p>
          </div>
        </div>

        <span 
          className="card-status-badge"
          style={{ backgroundColor: getStatusColor(card.status) }}
        >
          {getStatusLabel(card.status)}
        </span>
      </div>

      <div className="card-stats">
        <div className="stat-item orcamento">
          <div className="stat-icon">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="stat-label">Orçamento</span>
            <span className="stat-value">{formatarMoeda(card.valor_venda_orcamento)}</span>
          </div>
        </div>

        <div className="stat-item saldo">
          <div className="stat-icon">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="stat-label">Saldo Atual</span>
            <span className="stat-value">{formatarMoeda(card.saldo_atual)}</span>
          </div>
        </div>

        <div className="stat-item gasto">
          <div className="stat-icon">
            <TrendingDown size={18} />
          </div>
          <div>
            <span className="stat-label">Total Gasto</span>
            <span className="stat-value">{formatarMoeda(card.total_gasto)}</span>
          </div>
        </div>
      </div>

      <div className="card-actions">
        <button 
          className="btn-secondary btn-icon" 
          onClick={() => onSelect(card)}
          title="Ver detalhes"
        >
          Ver Detalhes
        </button>

        {isAdmin && card.status === 'EM_ANDAMENTO' && onTransferirVerba && (
          <button 
            className="btn-primary btn-icon"
            onClick={() => onTransferirVerba(card)}
            title="Transferir verba"
          >
            <DollarSign size={18} />
            Transferir Verba
          </button>
        )}

        {isAdmin && card.status === 'EM_ANALISE' && (
          <>
            {onAprovar && (
              <button 
                className="btn-acao aprovar"
                onClick={() => onAprovar(card)}
                title="Aprovar obra"
              >
                <CheckCircle size={18} />
                Aprovar
              </button>
            )}
            {onRejeitar && (
              <button 
                className="btn-acao rejeitar"
                onClick={() => onRejeitar(card)}
                title="Rejeitar obra"
              >
                <XCircle size={18} />
                Rejeitar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
