import React from 'react';
import { Edit2, Trash2, DollarSign, TrendingDown, Calendar, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
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

  const getCategoriaColor = () => {
    switch (categoria) {
      case 'clt': return { primary: '#8b5cf6', secondary: '#a78bfa' };
      case 'contrato': return { primary: '#0ea5e9', secondary: '#38bdf8' };
      case 'dono': return { primary: '#f59e0b', secondary: '#fbbf24' };
      default: return { primary: '#6366f1', secondary: '#818cf8' };
    }
  };

  const colors = getCategoriaColor();

  return (
    <motion.div 
      className="func-card-tech"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
    >
      {/* Gradiente de fundo animado */}
      <div className="func-card-gradient" style={{
        background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.secondary}08 100%)`
      }} />
      
      {/* Linha de scan animada */}
      <motion.div 
        className="func-card-scan-line"
        style={{ background: colors.primary }}
        animate={{ 
          top: ['-100%', '200%'],
          opacity: [0, 0.5, 0]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Header com Avatar */}
      <div className="func-card-header-tech">
        <div className="func-avatar-tech-wrapper">
          <motion.div 
            className="func-avatar-tech-border"
            style={{ borderColor: colors.primary }}
            animate={{ 
              rotate: 360,
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          {avatar_url ? (
            <img src={avatar_url} alt={nome} className="func-avatar-tech" />
          ) : (
            <div className="func-avatar-tech-fallback" style={{ 
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` 
            }}>
              <span>{nome.charAt(0).toUpperCase()}</span>
              <Sparkles className="func-avatar-sparkle" size={12} />
            </div>
          )}
        </div>

        <div className="func-info-tech">
          <h3 className="func-name-tech">{nome}</h3>
          {categoria !== 'dono' && cargo && (
            <p className="func-cargo-tech">{cargo}</p>
          )}
        </div>

        {/* Badge categórico */}
        <motion.div 
          className={`func-badge-tech func-badge-tech-${categoria}`}
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            boxShadow: `0 0 20px ${colors.primary}40`
          }}
          whileHover={{ scale: 1.05 }}
        >
          <span>{badgeLabel}</span>
        </motion.div>
      </div>

      {/* Divisor holográfico */}
      <div className="func-divider-tech" style={{ 
        background: `linear-gradient(90deg, transparent, ${colors.primary}40, transparent)` 
      }} />

      {/* Informações Financeiras */}
      <div className="func-financial-tech">
        {/* CLT: Salário e Data de Pagamento */}
        {categoria === 'clt' && salario && (
          <div className="func-info-section-tech">
            <motion.div 
              className="func-info-card-tech"
              whileHover={{ scale: 1.02 }}
            >
              <div className="func-info-icon-wrapper" style={{ background: `${colors.primary}20` }}>
                <DollarSign size={18} style={{ color: colors.primary }} />
              </div>
              <div className="func-info-content-tech">
                <span className="func-info-label-tech">Salário Mensal</span>
                <span className="func-info-value-tech primary" style={{ color: colors.primary }}>
                  {formatCurrency(salario)}
                </span>
              </div>
            </motion.div>
            
            {dataPagamentoCLT && (
              <motion.div 
                className="func-info-card-tech subtle"
                whileHover={{ scale: 1.02 }}
              >
                <div className="func-info-icon-wrapper small" style={{ background: `${colors.secondary}20` }}>
                  <Calendar size={14} style={{ color: colors.secondary }} />
                </div>
                <div className="func-info-content-tech">
                  <span className="func-info-label-tech small">Último pagamento</span>
                  <span className="func-info-value-tech small">{formatDate(dataPagamentoCLT)}</span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Contrato: Diária */}
        {categoria === 'contrato' && salario && (
          <motion.div 
            className="func-info-card-tech"
            whileHover={{ scale: 1.02 }}
          >
            <div className="func-info-icon-wrapper" style={{ background: `${colors.primary}20` }}>
              <DollarSign size={18} style={{ color: colors.primary }} />
            </div>
            <div className="func-info-content-tech">
              <span className="func-info-label-tech">Valor Diária</span>
              <span className="func-info-value-tech primary" style={{ color: colors.primary }}>
                {formatCurrency(salario)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Dono: Total de Saídas */}
        {categoria === 'dono' && (
          <motion.div 
            className="func-info-card-tech"
            whileHover={{ scale: 1.02 }}
          >
            <div className="func-info-icon-wrapper" style={{ background: `${colors.primary}20` }}>
              <TrendingDown size={18} style={{ color: colors.primary }} />
            </div>
            <div className="func-info-content-tech">
              <span className="func-info-label-tech">Total Retiradas</span>
              <span className="func-info-value-tech warning" style={{ color: colors.primary }}>
                {formatCurrency(totalSaidas || 0)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Vales (CLT e Contrato) */}
        {categoria !== 'dono' && totalVales !== undefined && totalVales > 0 && (
          <motion.div 
            className="func-info-card-tech alert"
            whileHover={{ scale: 1.02 }}
          >
            <div className="func-info-icon-wrapper" style={{ background: '#ef444420' }}>
              <DollarSign size={14} style={{ color: '#ef4444' }} />
            </div>
            <div className="func-info-content-tech">
              <span className="func-info-label-tech small">Total em Vales</span>
              <span className="func-info-value-tech danger">{formatCurrency(totalVales)}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Botões de ação flutuantes */}
      <div className="func-actions-tech">
        {canEdit && (
          <motion.button
            className="func-action-btn-tech edit"
            onClick={onEdit}
            title="Editar"
            type="button"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Edit2 size={16} />
          </motion.button>
        )}
        {canDelete && (
          <motion.button
            className="func-action-btn-tech delete"
            onClick={onDelete}
            title="Excluir"
            type="button"
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 size={16} />
          </motion.button>
        )}
      </div>

      {/* Efeito de brilho no hover */}
      <motion.div 
        className="func-card-glow"
        style={{ background: `radial-gradient(circle at center, ${colors.primary}20, transparent)` }}
      />
    </motion.div>
  );
};
