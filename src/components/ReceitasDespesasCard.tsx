// ReceitasDespesasCard - Card estilizado com receitas e despesas do mês
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import './ReceitasDespesasCard.css';

interface DadosMes {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  quantidadeEntradas: number;
  quantidadeSaidas: number;
}

export default function ReceitasDespesasCard() {
  const [dados, setDados] = useState<DadosMes>({
    totalEntradas: 0,
    totalSaidas: 0,
    saldo: 0,
    quantidadeEntradas: 0,
    quantidadeSaidas: 0
  });
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const hoje = new Date();
      setMesAtual(hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));

      // Buscar TODAS as transações para calcular o saldo total em caixa
      const { data: todasTransacoes, error: erroTotal } = await supabase
        .from('transacoes')
        .select('tipo, valor');

      if (erroTotal) throw erroTotal;

      // Calcular saldo TOTAL em caixa (todas as transações desde sempre)
      const totalEntradas = todasTransacoes?.filter(t => t.tipo === 'entrada')
        .reduce((sum, t) => sum + (t.valor || 0), 0) || 0;
      const totalSaidas = todasTransacoes?.filter(t => t.tipo === 'saida')
        .reduce((sum, t) => sum + (t.valor || 0), 0) || 0;
      const saldoAtualEmCaixa = totalEntradas - totalSaidas;

      // Buscar transações do mês atual para quantidade
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      const primeiroDiaStr = primeiroDia.toISOString().split('T')[0];
      const ultimoDiaStr = ultimoDia.toISOString().split('T')[0];

      const { data: transacoesMes, error: erroMes } = await supabase
        .from('transacoes')
        .select('tipo, valor')
        .gte('data', primeiroDiaStr)
        .lte('data', ultimoDiaStr);

      if (erroMes) throw erroMes;

      const entradasMes = transacoesMes?.filter(t => t.tipo === 'entrada') || [];
      const saidasMes = transacoesMes?.filter(t => t.tipo === 'saida') || [];

      const totalEntradasMes = entradasMes.reduce((sum, t) => sum + (t.valor || 0), 0);
      const totalSaidasMes = saidasMes.reduce((sum, t) => sum + (t.valor || 0), 0);

      setDados({
        totalEntradas: totalEntradasMes,
        totalSaidas: totalSaidasMes,
        saldo: saldoAtualEmCaixa, // SALDO ATUAL EM CAIXA (total geral)
        quantidadeEntradas: entradasMes.length,
        quantidadeSaidas: saidasMes.length
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (loading) {
    return (
      <div className="receitas-despesas-card loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <motion.div 
      className="receitas-despesas-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header do Card */}
      <div className="rd-header">
        <div className="rd-header-content">
          <DollarSign className="rd-header-icon" size={24} />
          <div>
            <h3>Fluxo de Caixa</h3>
            <p className="rd-mes">
              <Calendar size={14} />
              {mesAtual}
            </p>
          </div>
        </div>
      </div>

      {/* Saldo Atual em Caixa */}
      <div className="rd-saldo-section">
        <div className="rd-saldo-label">Saldo em Caixa Atual</div>
        <motion.div 
          className={`rd-saldo-valor ${dados.saldo >= 0 ? 'positivo' : 'negativo'}`}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          {formatarMoeda(dados.saldo)}
        </motion.div>
      </div>

      {/* Receitas e Despesas */}
      <div className="rd-valores-grid">
        {/* Receitas */}
        <motion.div 
          className="rd-valor-card receita"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="rd-valor-header">
            <div className="rd-valor-icon receita">
              <TrendingUp size={20} />
            </div>
            <span className="rd-valor-label">Receitas</span>
          </div>
          <div className="rd-valor-principal">
            {formatarMoeda(dados.totalEntradas)}
          </div>
          <div className="rd-valor-info">
            <span className="rd-quantidade">{dados.quantidadeEntradas}</span>
            <span className="rd-texto">
              {dados.quantidadeEntradas === 1 ? 'entrada' : 'entradas'}
            </span>
          </div>
          <div className="rd-barra-progresso">
            <motion.div 
              className="rd-barra-fill receita"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </motion.div>

        {/* Despesas */}
        <motion.div 
          className="rd-valor-card despesa"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="rd-valor-header">
            <div className="rd-valor-icon despesa">
              <TrendingDown size={20} />
            </div>
            <span className="rd-valor-label">Despesas</span>
          </div>
          <div className="rd-valor-principal">
            {formatarMoeda(dados.totalSaidas)}
          </div>
          <div className="rd-valor-info">
            <span className="rd-quantidade">{dados.quantidadeSaidas}</span>
            <span className="rd-texto">
              {dados.quantidadeSaidas === 1 ? 'saída' : 'saídas'}
            </span>
          </div>
          <div className="rd-barra-progresso">
            <motion.div 
              className="rd-barra-fill despesa"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </div>
        </motion.div>
      </div>

      {/* Indicador de Desempenho */}
      <div className="rd-footer">
        <div className="rd-indicador">
          {dados.saldo >= 0 ? (
            <>
              <TrendingUp size={16} className="rd-indicador-icon positivo" />
              <span className="rd-indicador-texto positivo">Mês positivo</span>
            </>
          ) : (
            <>
              <TrendingDown size={16} className="rd-indicador-icon negativo" />
              <span className="rd-indicador-texto negativo">Mês negativo</span>
            </>
          )}
        </div>
        {dados.totalEntradas > 0 && (
          <div className="rd-percentual">
            <span className="rd-percentual-label">Margem:</span>
            <span className={`rd-percentual-valor ${dados.saldo >= 0 ? 'positivo' : 'negativo'}`}>
              {((dados.saldo / dados.totalEntradas) * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
