import React from 'react';
import { motion } from 'framer-motion';
import { useFinancialAI } from '../hooks/useFinancialAI';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  Activity,
  Calendar,
  DollarSign,
  BarChart3,
  RefreshCw,
  Sparkles,
  Wallet,
} from 'lucide-react';
import './InteligenciaFinanceira.css';

export default function InteligenciaFinanceira() {
  const { data, refresh } = useFinancialAI();

  const getSaudeColor = (saude: number) => {
    if (saude >= 70) return { bg: '#22c55e', label: 'Excelente', emoji: '🎉' };
    if (saude >= 50) return { bg: '#f59e0b', label: 'Moderada', emoji: '⚠️' };
    return { bg: '#ef4444', label: 'Crítica', emoji: '🚨' };
  };

  const saudeInfo = getSaudeColor(data.saudeFinanceira);

  const getInsightIcon = (tipo: string) => {
    switch (tipo) {
      case 'alerta': return <AlertTriangle size={20} />;
      case 'oportunidade': return <Lightbulb size={20} />;
      case 'previsao': return <TrendingUp size={20} />;
      case 'recomendacao': return <Target size={20} />;
      default: return <Sparkles size={20} />;
    }
  };

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'crescente': return <TrendingUp size={16} className="trend-icon up" />;
      case 'decrescente': return <TrendingDown size={16} className="trend-icon down" />;
      default: return <Activity size={16} className="trend-icon stable" />;
    }
  };

  if (data.loading) {
    return (
      <div className="ia-financeira-container">
        <div className="ia-loading">
          <motion.div
            className="ia-loading-brain"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Brain size={48} />
          </motion.div>
          <h2>Analisando seus dados financeiros...</h2>
          <p>Processando padrões, tendências e gerando insights</p>
        </div>
      </div>
    );
  }

  // Verificar se o backend está offline
  const backendOffline = data.insights.some(i => i.id === 'warning-ml');

  return (
    <div className="ia-financeira-container">
      {/* Header */}
      <motion.div
        className="ia-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="ia-header-content">
          <div className="ia-header-title">
            <Brain className="ia-brain-icon" />
            <div>
              <h1>Inteligência Financeira</h1>
              <p>Análise preditiva e insights automáticos baseados em IA</p>
            </div>
          </div>
          <motion.button
            className="ia-refresh-btn"
            onClick={refresh}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw size={18} />
            Atualizar Análise
          </motion.button>
        </div>
      </motion.div>

      {/* Mensagem de Backend Offline */}
      {backendOffline && (
        <motion.div
          className="ia-offline-banner"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <AlertTriangle size={24} />
            Backend ML Offline
          </h2>
          <p style={{ margin: '0 0 15px 0' }}>
            O servidor de análise não está rodando. Siga os passos abaixo para ativar:
          </p>
          <ol style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
            {data.recomendacoes.map((rec, idx) => (
              <li key={idx} style={{ marginBottom: '8px' }}>{rec}</li>
            ))}
          </ol>
        </motion.div>
      )}

      {/* Saúde Financeira */}
      {!backendOffline && (
        <motion.div
          className="ia-saude-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="ia-saude-header">
            <h2>
              <Activity size={24} />
              Saúde Financeira
            </h2>
            <span className="ia-saude-emoji">{saudeInfo.emoji}</span>
          </div>
        <div className="ia-saude-score">
          <motion.div
            className="ia-saude-circle"
            style={{ borderColor: saudeInfo.bg }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <motion.div
              className="ia-saude-fill"
              style={{ background: saudeInfo.bg }}
              initial={{ height: 0 }}
              animate={{ height: `${data.saudeFinanceira}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
            <div className="ia-saude-value">{data.saudeFinanceira}</div>
          </motion.div>
          <div className="ia-saude-info">
            <h3>{saudeInfo.label}</h3>
            <p>Baseado em {data.padroesPorCategoria.length} categorias analisadas</p>
            <div className="ia-comportamento-grid">
              <div className="ia-comportamento-item">
                <Calendar size={16} />
                <div>
                  <span className="label">Dia mais ativo</span>
                  <span className="value">{data.analiseComportamento.diaMaisGastos}</span>
                </div>
              </div>
              <div className="ia-comportamento-item">
                <Target size={16} />
                <div>
                  <span className="label">Categoria principal</span>
                  <span className="value">{data.analiseComportamento.categoriaDominante}</span>
                </div>
              </div>
              <div className="ia-comportamento-item">
                <BarChart3 size={16} />
                <div>
                  <span className="label">Eficiência</span>
                  <span className="value">{data.analiseComportamento.eficienciaFinanceira}%</span>
                </div>
              </div>
              {data.analiseComportamento.saldoAtual !== undefined && (
                <div className="ia-comportamento-item">
                  <Wallet size={16} />
                  <div>
                    <span className="label">Saldo em Caixa</span>
                    <span className={`value ${data.analiseComportamento.saldoAtual < 0 ? 'negativo' : data.analiseComportamento.saldoAtual < 10000 ? 'atencao' : 'positivo'}`}>
                      R$ {data.analiseComportamento.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </motion.div>
      )}

      {/* Insights */}
      <div className="ia-section">
        <h2 className="ia-section-title">
          <Sparkles size={24} />
          Insights Inteligentes
        </h2>
        <div className="ia-insights-grid">
          {data.insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              className={`ia-insight-card ${insight.tipo} ${insight.impacto}`}
              style={{ borderLeftColor: insight.cor }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 8 }}
            >
              <div className="ia-insight-icon" style={{ color: insight.cor }}>
                {getInsightIcon(insight.tipo)}
              </div>
              <div className="ia-insight-content">
                <div className="ia-insight-header">
                  <h3>{insight.titulo}</h3>
                  <span className="ia-insight-badge" style={{ background: `${insight.cor}20`, color: insight.cor }}>
                    {insight.tipo}
                  </span>
                </div>
                <p>{insight.descricao}</p>
                {insight.valor !== undefined && (
                  <div className="ia-insight-value">
                    <DollarSign size={14} />
                    R$ {insight.valor.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="ia-insight-emoji">{insight.icon}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Padrões por Categoria */}
      {!backendOffline && data.padroesPorCategoria.length > 0 && (
      <div className="ia-section">
        <h2 className="ia-section-title">
          <BarChart3 size={24} />
          Padrões de Gastos por Categoria
        </h2>
        <div className="ia-patterns-grid">
          {data.padroesPorCategoria.slice(0, 6).map((padrao, index) => (
            <motion.div
              key={padrao.categoria}
              className="ia-pattern-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -5 }}
            >
              <div className="ia-pattern-header">
                <h3>{padrao.categoria}</h3>
                {getTendenciaIcon(padrao.tendencia)}
              </div>
              <div className="ia-pattern-stats">
                <div className="ia-pattern-stat">
                  <span className="label">Média Mensal</span>
                  <span className="value">R$ {padrao.mediaGastoMensal.toFixed(2)}</span>
                </div>
                <div className="ia-pattern-stat">
                  <span className="label">Variação</span>
                  <span className={`value ${padrao.variacao > 0 ? 'negative' : 'positive'}`}>
                    {padrao.variacao > 0 ? '+' : ''}{padrao.variacao.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="ia-pattern-prediction">
                <div className="ia-pattern-prediction-label">
                  <span>Previsão próximo mês</span>
                  <span className="confidence">{padrao.confianca.toFixed(0)}% confiança</span>
                </div>
                <div className="ia-pattern-prediction-value">
                  R$ {padrao.previsaoProximoMes.toFixed(2)}
                </div>
              </div>
              <div className="ia-pattern-confidence-bar">
                <motion.div
                  className="ia-pattern-confidence-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${padrao.confianca}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.08 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      )}

      {/* Previsão de Fluxo de Caixa */}
      {!backendOffline && data.previsaoFluxoCaixa.length > 0 && (
      <div className="ia-section">
        <h2 className="ia-section-title">
          <TrendingUp size={24} />
          Previsão de Fluxo de Caixa (6 meses)
        </h2>
        <div className="ia-forecast-container">
          <div className="ia-forecast-chart">
            {data.previsaoFluxoCaixa.map((previsao, index) => {
              const maxValor = Math.max(
                ...data.previsaoFluxoCaixa.map(p => Math.max(p.previsaoEntrada, p.previsaoSaida))
              );
              const heightEntrada = (previsao.previsaoEntrada / maxValor) * 100;
              const heightSaida = (previsao.previsaoSaida / maxValor) * 100;

              return (
                <motion.div
                  key={previsao.mes}
                  className="ia-forecast-bar"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="ia-forecast-bars">
                    <motion.div
                      className="ia-forecast-bar-entrada"
                      initial={{ height: 0 }}
                      animate={{ height: `${heightEntrada}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                      title={`Entrada prevista: R$ ${previsao.previsaoEntrada.toFixed(2)}`}
                    />
                    <motion.div
                      className="ia-forecast-bar-saida"
                      initial={{ height: 0 }}
                      animate={{ height: `${heightSaida}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                      title={`Saída prevista: R$ ${previsao.previsaoSaida.toFixed(2)}`}
                    />
                  </div>
                  <div className="ia-forecast-label">{previsao.mes}</div>
                  <div className="ia-forecast-saldo" style={{ 
                    color: previsao.saldoPrevisto >= 0 ? '#22c55e' : '#ef4444' 
                  }}>
                    {previsao.saldoPrevisto >= 0 ? '+' : ''}
                    {(previsao.saldoPrevisto / 1000).toFixed(1)}k
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="ia-forecast-legend">
            <div className="ia-forecast-legend-item">
              <div className="ia-forecast-legend-color entrada" />
              <span>Entradas Previstas</span>
            </div>
            <div className="ia-forecast-legend-item">
              <div className="ia-forecast-legend-color saida" />
              <span>Saídas Previstas</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Recomendações */}
      {!backendOffline && data.recomendacoes.length > 0 && (
      <motion.div
        className="ia-recommendations"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="ia-section-title">
          <Target size={24} />
          Recomendações Personalizadas
        </h2>
        <div className="ia-recommendations-list">
          {data.recomendacoes.map((rec, index) => (
            <motion.div
              key={index}
              className="ia-recommendation-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ x: 8 }}
            >
              <div className="ia-recommendation-number">{index + 1}</div>
              <p>{rec}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
      )}
    </div>
  );
}
