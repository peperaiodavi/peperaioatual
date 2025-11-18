// DashboardCharts - Gráficos animados e inteligentes para o Dashboard
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import './DashboardCharts.css';

interface ChartData {
  totalReceitas: number;
  totalDespesas: number;
  lucroTotal: number;
  obrasMaisLucrativas: Array<{ nome: string; lucro: number; percentualLucro?: number }>;
  gastosPorCategoria: Array<{ categoria: string; valor: number; cor: string }>;
  tendenciaMensal: Array<{ mes: string; valor: number }>;
}

interface DashboardChartsProps {
  data: ChartData;
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [data]);

  const lucroPercentual = data.totalReceitas > 0 
    ? ((data.lucroTotal / data.totalReceitas) * 100).toFixed(1)
    : '0.0';

  const lucroPositivo = data.lucroTotal >= 0;

  return (
    <div className="dashboard-charts">
      {/* Cartão Principal - Lucro Total */}
      <motion.div 
        className="chart-card chart-card-primary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="chart-card-header">
          <div className="chart-icon-wrapper lucro">
            {lucroPositivo ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
          <div className="chart-header-info">
            <h3>Lucro Total</h3>
            <p>Balanço geral do sistema</p>
          </div>
        </div>
        
        <div className="chart-card-content">
          <motion.div 
            className={`chart-value-primary ${lucroPositivo ? 'positive' : 'negative'}`}
            key={`lucro-${animationKey}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            R$ {data.lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </motion.div>
          
          <div className="chart-progress-wrapper">
            <div className="chart-progress-labels">
              <span className="chart-label">Margem de Lucro</span>
              <span className={`chart-percentage ${lucroPositivo ? 'positive' : 'negative'}`}>
                {lucroPercentual}%
              </span>
            </div>
            <motion.div 
              className="chart-progress-bar"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <motion.div 
                className={`chart-progress-fill ${lucroPositivo ? 'positive' : 'negative'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(parseFloat(lucroPercentual), 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </motion.div>
          </div>
        </div>

        {/* Glow Effect */}
        <div className={`chart-glow ${lucroPositivo ? 'positive' : 'negative'}`} />
      </motion.div>

      {/* Gráfico de Pizza - Gastos por Categoria */}
      <motion.div 
        className="chart-card chart-card-donut"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="chart-card-header">
          <div className="chart-icon-wrapper categorias">
            <PieChart size={20} />
          </div>
          <div className="chart-header-info">
            <h3>Gastos por Categoria</h3>
            <p>Distribuição de despesas</p>
          </div>
        </div>

        <div className="donut-chart-wrapper">
          <svg viewBox="0 0 200 200" className="donut-chart">
            {data.gastosPorCategoria.map((item, index) => {
              const total = data.gastosPorCategoria.reduce((acc, cat) => acc + cat.valor, 0);
              const percentage = (item.valor / total) * 100;
              const radius = 70;
              const circumference = 2 * Math.PI * radius;
              const offset = data.gastosPorCategoria
                .slice(0, index)
                .reduce((acc, cat) => acc + (cat.valor / total) * circumference, 0);

              return (
                <motion.circle
                  key={item.categoria}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={item.cor}
                  strokeWidth="30"
                  strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
                  strokeDashoffset={-offset}
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${(percentage / 100) * circumference} ${circumference}` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  style={{ transformOrigin: '100px 100px', transform: 'rotate(-90deg)' }}
                />
              );
            })}
          </svg>
          
          <div className="donut-center">
            <Activity size={32} className="donut-icon" />
          </div>
        </div>

        <div className="chart-legend">
          {data.gastosPorCategoria.map((item, index) => (
            <motion.div 
              key={item.categoria}
              className="legend-item"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
            >
              <div className="legend-color" style={{ backgroundColor: item.cor }} />
              <span className="legend-label">{item.categoria}</span>
              <span className="legend-value">
                R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Top Obras Lucrativas */}
      <motion.div 
        className="chart-card chart-card-ranking"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="chart-card-header">
          <div className="chart-icon-wrapper obras">
            <BarChart3 size={20} />
          </div>
          <div className="chart-header-info">
            <h3>Top 5 Obras Mais Lucrativas</h3>
            <p>Ranking de desempenho</p>
          </div>
        </div>

        <div className="ranking-list">
          {data.obrasMaisLucrativas.map((obra, index) => (
            <motion.div 
              key={obra.nome}
              className="ranking-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
            >
              <div className="ranking-position">{index + 1}</div>
              <div className="ranking-info">
                <span className="ranking-name">{obra.nome}</span>
                {obra.percentualLucro !== undefined && (
                  <span className="ranking-percentage">
                    +{obra.percentualLucro.toFixed(1)}% de lucro
                  </span>
                )}
              </div>
              <div className="ranking-value positive">
                R$ {obra.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
