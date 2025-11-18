import { useState, useMemo } from 'react';
import { usePermissao } from '../context/PermissaoContext';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/queries/useDashboard';
import DashboardCharts from '../components/DashboardCharts';
import QuickTransactionCard from '../components/QuickTransactionCard';
import ReceitasDespesasCard from '../components/ReceitasDespesasCard';
import CompromissosWidget from '../components/CompromissosWidget';
import PageHeader from '../components/PageHeader';
import { formatCurrency } from '../utils/formatCurrency';
import PeperaioLogo from '../components/PeperaioLogo';
import './DashboardNew.css';
import './Dashboard-fab.css';

// Força reload do CSS
if (typeof window !== 'undefined') {
  const timestamp = Date.now();
  console.log('Dashboard CSS carregado:', timestamp);
}

interface Transacao {
  id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  origem: string;
  data: string;
  observacao: string;
  categoria: string;
}
interface GastosPorCategoria {
  categoria: string;
  valor: number;
  percentual: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
export default function Dashboard() {
  const { isAdmin } = usePermissao();
  const { user } = useAuth();
  
  // Usando TanStack Query para buscar dados
  const { data, isLoading, error } = useDashboardData();

  // Determinar role do usuário
  const userRole = isAdmin ? 'admin' : 'visualizador';

  // Calcular estatísticas com useMemo para otimização
  const stats = useMemo(() => {
    if (!data) return { saldoCaixa: 0, totalReceber: 0, dividasAtivas: 0, lucroTotal: 0 };

    const caixaData: Transacao[] = data.transacoes || [];
    const receberData: any[] = data.recebiveis || [];
    const dividasData: any[] = data.dividas || [];
    const obrasData: any[] = data.obras || [];

    const saldoCaixa = caixaData.reduce((acc, t) => (t.tipo === 'entrada' ? acc + t.valor : acc - t.valor), 0);
    const totalReceber = receberData.reduce((acc: number, r: any) => acc + ((Number(r.valor_total) || 0) - (Number(r.valor_pago) || 0)), 0);
    const dividasAtivas = dividasData.filter((d: any) => d.status !== 'quitado').reduce((acc: number, d: any) => acc + (d.valorRestante ?? d.valor ?? 0), 0);
    
    // LUCRO TOTAL: Soma dos lucros de obras finalizadas (valor_recebido - gastos)
    const obrasFinalizadas = obrasData.filter((o: any) => o.finalizada);
    const lucroTotal = obrasFinalizadas.reduce((acc: number, o: any) => {
      const totalGastosObra = (o.gastos_obra || []).reduce((sum: number, g: any) => sum + (g.valor || 0), 0);
      const valorRecebido = o.valor_recebido || 0;
      const lucroObra = valorRecebido - totalGastosObra;
      return acc + lucroObra;
    }, 0);
    
    return { saldoCaixa, totalReceber, dividasAtivas, lucroTotal };
  }, [data]);

  const gastosPorCategoria = useMemo(() => {
    if (!data) return [];

    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth();
    const anoAtual = dataAtual.getFullYear();

    const caixaData: Transacao[] = data.transacoes || [];
    const gastosObraData: any[] = data.gastosObra || [];
    const despesasCardsData: any[] = data.despesasObra || [];

    // GASTOS POR CATEGORIA - Mês atual apenas, incluindo caixa, obras e cards
    const categoriaMap = new Map<string, number>();
    
    // Gastos do caixa do mês atual
    caixaData
      .filter((t) => {
        if (t.tipo !== 'saida') return false;
        const dataTransacao = new Date(t.data);
        return dataTransacao.getMonth() === mesAtual && dataTransacao.getFullYear() === anoAtual;
      })
      .forEach((g) => {
        const categoria = g.categoria || 'Outros';
        categoriaMap.set(categoria, (categoriaMap.get(categoria) || 0) + g.valor);
      });

    // Gastos de obras do mês atual
    gastosObraData
      .filter((g) => {
        const dataGasto = new Date(g.data);
        return dataGasto.getMonth() === mesAtual && dataGasto.getFullYear() === anoAtual;
      })
      .forEach((g) => {
        const categoria = g.categoria || 'Outros';
        categoriaMap.set(categoria, (categoriaMap.get(categoria) || 0) + g.valor);
      });

    // Despesas de cards do mês atual
    despesasCardsData
      .filter((d) => {
        const dataDespesa = new Date(d.data);
        return dataDespesa.getMonth() === mesAtual && dataDespesa.getFullYear() === anoAtual;
      })
      .forEach((d) => {
        const categoria = d.categorias_de_gasto?.nome || 'Outros';
        categoriaMap.set(categoria, (categoriaMap.get(categoria) || 0) + d.valor);
      });

    const totalGastos = Array.from(categoriaMap.values()).reduce((acc, v) => acc + v, 0);
    const gastosPorCategoriaArr: GastosPorCategoria[] = Array.from(categoriaMap.entries())
      .map(([categoria, valor]) => ({
        categoria,
        valor,
        percentual: totalGastos > 0 ? (valor / totalGastos) * 100 : 0,
      }))
      .sort((a, b) => b.valor - a.valor);
    
    return gastosPorCategoriaArr;
  }, [data]);

  const fluxoMensal = useMemo(() => {
    if (!data) return [];

    const obrasData: any[] = data.obras || [];
    const obrasFinalizadas = obrasData.filter((o: any) => o.finalizada);

    // TOP 5 OBRAS MAIS LUCRATIVAS - Por porcentagem de ganho
    const obrasComLucro = obrasFinalizadas.map((o: any) => {
      const totalGastosObra = (o.gastos_obra || []).reduce((sum: number, g: any) => sum + (g.valor || 0), 0);
      const valorRecebido = o.valor_recebido || 0;
      const lucroObra = valorRecebido - totalGastosObra;
      const percentualLucro = valorRecebido > 0 ? (lucroObra / valorRecebido) * 100 : 0;
      return {
        nome: o.nome,
        lucro: lucroObra,
        percentualLucro,
        valorRecebido,
        gastos: totalGastosObra
      };
    });

    const top5Obras = obrasComLucro
      .sort((a, b) => b.percentualLucro - a.percentualLucro)
      .slice(0, 5);

    return top5Obras;
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="dashboard-tooltip">
          <div className="dashboard-tooltip-label">{label}</div>
          {payload.map((p: any, i: number) => (
            <div key={i} className="dashboard-tooltip-row">
              <span style={{ color: p.color, fontWeight: 600 }}>{p.name}</span>
              <span>{formatCurrency(p.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      return (
        <div className="dashboard-tooltip">
          <div className="dashboard-tooltip-label">{p.name}</div>
          <div className="dashboard-tooltip-row"><strong>{formatCurrency(p.value)}</strong><span style={{ opacity: 0.8, marginLeft: 8 }}>{(p.payload.percentual || 0).toFixed(1)}%</span></div>
        </div>
      );
    }
    return null;
  };

  // Preparar dados para os gráficos
  const chartData = useMemo(() => ({
    totalReceitas: stats.saldoCaixa + stats.totalReceber,
    totalDespesas: stats.dividasAtivas,
    lucroTotal: stats.lucroTotal,
    obrasMaisLucrativas: fluxoMensal.map((item: any) => ({
      nome: item.nome || `Obra ${item.mes}`,
      lucro: item.lucro || item.saldo || 0,
      percentualLucro: item.percentualLucro || 0
    })),
    gastosPorCategoria: gastosPorCategoria.map((item, index) => ({
      categoria: item.categoria,
      valor: item.valor,
      cor: COLORS[index % COLORS.length]
    })),
    tendenciaMensal: []
  }), [stats, fluxoMensal, gastosPorCategoria]);

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <PageHeader 
          title={<PeperaioLogo size="small" animate={true} />}
          subtitle="Carregando..."
          showDashboardSwitch={true}
        />
        <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <PageHeader 
          title={<PeperaioLogo size="small" animate={true} />}
          subtitle="Erro ao carregar dados"
          showDashboardSwitch={true}
        />
        <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <p style={{ color: 'red' }}>Erro ao carregar dados do dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <PageHeader 
        title={<PeperaioLogo size="small" animate={true} />}
        subtitle={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        showDashboardSwitch={true}
      />
      <div className="dashboard-content">
        <QuickTransactionCard />
        <CompromissosWidget />
        <ReceitasDespesasCard />
        <DashboardCharts data={chartData} />
      </div>
    </div>
  );
}
