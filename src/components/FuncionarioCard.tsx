import React from 'react';
import { Edit2, Trash2, DollarSign, TrendingDown, Calendar } from 'lucide-react';
import './FuncionarioCard.css';

interface FuncionarioCardProps {
  nome: string;
  cargo?: string;
  categoria: string;
  avatar_url?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  badgeLabel: string;
  salario?: number;
  totalVales?: number;
  totalSaidas?: number;
  dataPagamentoCLT?: string;
}

export const FuncionarioCard: React.FC<FuncionarioCardProps> = ({
  nome,
  cargo,
  categoria,
  avatar_url,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  badgeLabel,
  salario,
  totalVales,
  totalSaidas,
  dataPagamentoCLT,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <div className="func-card-modern">
      {/* Header com Avatar e Info */}
      <div className="func-card-header">
        <div className="func-avatar-container">
          {avatar_url ? (
            <img src={avatar_url} alt={nome} className="func-avatar" />
          ) : (
            <div className="func-avatar-fallback">
              {nome.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="func-info-main">
          <h3 className="func-name">{nome}</h3>
          {categoria !== 'dono' && cargo && (
            <p className="func-cargo">{cargo}</p>
          )}
        </div>

        <div className="func-actions-top">
          {canEdit && (
            <button
              className="func-action-btn func-edit-btn"
              onClick={onEdit}
              title="Editar"
              type="button"
            >
              <Edit2 size={16} />
            </button>
          )}
          {canDelete && (
            <button
              className="func-action-btn func-delete-btn"
              onClick={onDelete}
              title="Excluir"
              type="button"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Badge de Categoria */}
      <div className="func-badge-container">
        <span className={`func-badge func-badge-${categoria}`}>
          {badgeLabel}
        </span>
      </div>

      {/* Informações Financeiras */}
      <div className="func-financial-info">
        {/* CLT: Salário e Data de Pagamento */}
        {categoria === 'clt' && salario && (
          <>
            <div className="func-info-row">
              <div className="func-info-item">
                <DollarSign className="func-info-icon" size={16} />
                <span className="func-info-label">Salário Mensal</span>
              </div>
              <span className="func-info-value primary">{formatCurrency(salario)}</span>
            </div>
            {dataPagamentoCLT && (
              <div className="func-info-row subtle">
                <div className="func-info-item">
                  <Calendar className="func-info-icon" size={14} />
                  <span className="func-info-label-small">Último pagamento</span>
                </div>
                <span className="func-info-value-small">{formatDate(dataPagamentoCLT)}</span>
              </div>
            )}
          </>
        )}

        {/* Contrato: Diária */}
        {categoria === 'contrato' && salario && (
          <div className="func-info-row">
            <div className="func-info-item">
              <DollarSign className="func-info-icon" size={16} />
              <span className="func-info-label">Valor Diária</span>
            </div>
            <span className="func-info-value primary">{formatCurrency(salario)}</span>
          </div>
        )}

        {/* Dono: Total de Saídas */}
        {categoria === 'dono' && (
          <div className="func-info-row">
            <div className="func-info-item">
              <TrendingDown className="func-info-icon" size={16} />
              <span className="func-info-label">Total Retiradas</span>
            </div>
            <span className="func-info-value warning">{formatCurrency(totalSaidas || 0)}</span>
          </div>
        )}

        {/* Vales (CLT e Contrato) */}
        {categoria !== 'dono' && totalVales !== undefined && totalVales > 0 && (
          <div className="func-info-row subtle">
            <div className="func-info-item">
              <DollarSign className="func-info-icon" size={14} />
              <span className="func-info-label-small">Total em Vales</span>
            </div>
            <span className="func-info-value-small danger">{formatCurrency(totalVales)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
