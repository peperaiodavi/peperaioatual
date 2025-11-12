import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { usePermissao } from '../context/PermissaoContext';
import { useAuth } from '../context/AuthContext';
import CaixaAdiantamentoWidget from '../components/CaixaAdiantamentoWidget';
import CardsDeObraWidget from '../components/CardsDeObraWidget';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { formatCurrency } from '../utils/formatCurrency';
import { Calendar, TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, BarChart3, Activity, Wallet } from 'lucide-react';
import './DashboardNew.css';
import './Dashboard-fab.css';

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
  const [stats, setStats] = useState({
    saldoCaixa: 0,
    totalReceber: 0,
    dividasAtivas: 0,
    lucroTotal: 0,
  });
  const [gastosPorCategoria, setGastosPorCategoria] = useState<GastosPorCategoria[]>([]);
  const [fluxoMensal, setFluxoMensal] = useState<any[]>([]);
  const [comparativoEntradaSaida, setComparativoEntradaSaida] = useState<any[]>([]);
  
  // Determinar role do usuário
  const userRole = isAdmin ? 'admin' : 'visualizador';

  useEffect(() => {
    loadDashboardData();
    // Realtime could be added later (supabase subscription)
  }, []);

  const loadDashboardData = async () => {
    try {
      const [{ data: caixa }, { data: receber }, { data: dividas }, { data: obras }] = await Promise.all([
        supabase.from('transacoes').select('*'),
        supabase.from('recebiveis').select('*'),
        supabase.from('dividas').select('*'),
        supabase.from('obras').select('*'),
      ]);
      const caixaData: Transacao[] = (caixa as any[]) || [];
      const receberData: any[] = (receber as any[]) || [];
      const dividasData: any[] = (dividas as any[]) || [];
      const obrasData: any[] = (obras as any[]) || [];

      const saldoCaixa = caixaData.reduce((acc, t) => (t.tipo === 'entrada' ? acc + t.valor : acc - t.valor), 0);
      const totalReceber = receberData.reduce((acc: number, r: any) => acc + ((Number(r.valor_total) || 0) - (Number(r.valor_pago) || 0)), 0);
      const dividasAtivas = dividasData.filter((d: any) => d.status !== 'quitado').reduce((acc: number, d: any) => acc + (d.valorRestante ?? d.valor ?? 0), 0);
      const lucroTotal = obrasData.filter((o: any) => o.finalizada).reduce((acc: number, o: any) => acc + (o.lucro || 0), 0);
      setStats({ saldoCaixa, totalReceber, dividasAtivas, lucroTotal });

      // Gastos por categoria
      const gastos = caixaData.filter((t) => t.tipo === 'saida');
      const totalGastos = gastos.reduce((acc, t) => acc + t.valor, 0);
      const categoriaMap = new Map<string, number>();
      gastos.forEach((g) => categoriaMap.set(g.categoria, (categoriaMap.get(g.categoria) || 0) + g.valor));
      const gastosPorCategoriaArr: GastosPorCategoria[] = Array.from(categoriaMap.entries()).map(([categoria, valor]) => ({
        categoria,
        valor,
        percentual: totalGastos > 0 ? (valor / totalGastos) * 100 : 0,
      }));
      setGastosPorCategoria(gastosPorCategoriaArr);

      // Fluxo mensal (últimos 6 meses)
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const fluxoMap = new Map<string, { entradas: number; saidas: number }>();
      caixaData.forEach((t) => {
        const date = new Date(t.data);
        const mesAno = `${meses[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`;
        if (!fluxoMap.has(mesAno)) fluxoMap.set(mesAno, { entradas: 0, saidas: 0 });
        const atual = fluxoMap.get(mesAno)!;
        if (t.tipo === 'entrada') atual.entradas += t.valor; else atual.saidas += t.valor;
      });
      const fluxoData = Array.from(fluxoMap.entries()).map(([mes, valores]) => ({ mes, entradas: valores.entradas, saidas: valores.saidas, saldo: valores.entradas - valores.saidas })).slice(-6);
      setFluxoMensal(fluxoData);

      const totalEntradas = caixaData.filter((t) => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
      const totalSaidas = caixaData.filter((t) => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
      setComparativoEntradaSaida([{ name: 'Entradas', valor: totalEntradas }, { name: 'Saídas', valor: totalSaidas }]);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard', err);
    }
  };

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

  return (
    <div className="dashboard-container">
      <div className="dashboard-page">
        <header className="dashboard-hero">
          <div>
            <h2 className="dashboard-hero-title"><Activity /> Dashboard</h2>
            <p className="dashboard-hero-sub">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </header>

        <main className="dashboard-main">
          {/* Card harmonizado: Meus Cards de Obras */}
          <section className="dashboard-cards-harmonic">
            <div className="widget-container">
              <CardsDeObraWidget userRole={userRole} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
