import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import {
  analisarFinancasComML,
  verificarHealthML,
  converterTransacoesParaML,
  converterGastosParaML,
  type PadraoCategoria,
  type InsightML,
  type PrevisaoFluxo,
  type AnaliseComportamento,
} from '../services/mlApiService';

interface Transaction {
  id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  data: string;
  categoria: string;
  origem: string;
}

interface ObraGasto {
  id: string;
  obra_id: string;
  categoria: string;
  valor: number;
  data: string;
  descricao: string;
}

// Usar tipos do serviço ML
type FinancialPattern = PadraoCategoria;
type InsightFinanceiro = InsightML;
type PrevisaoFluxoCaixa = PrevisaoFluxo;
type AnaliseComportamentoType = AnaliseComportamento;

export interface FinancialAIData {
  padroesPorCategoria: FinancialPattern[];
  insights: InsightFinanceiro[];
  previsaoFluxoCaixa: PrevisaoFluxoCaixa[];
  analiseComportamento: AnaliseComportamentoType;
  saudeFinanceira: number; // 0-100
  recomendacoes: string[];
  loading: boolean;
}

export const useFinancialAI = () => {
  const [data, setData] = useState<FinancialAIData>({
    padroesPorCategoria: [],
    insights: [],
    previsaoFluxoCaixa: [],
    analiseComportamento: {
      diaMaisGastos: '',
      horarioMaisAtivo: '',
      categoriaDominante: '',
      padraoSazonal: false,
      eficienciaFinanceira: 0,
    },
    saudeFinanceira: 0,
    recomendacoes: [],
    loading: true,
  });

  useEffect(() => {
    loadAndAnalyze();
  }, []);

  const loadAndAnalyze = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }));

      // SEMPRE tentar usar API ML (obrigatório)
      const mlDisponivel = await verificarHealthML();
      
      if (!mlDisponivel) {
        console.error('Backend ML não disponível. É necessário executar o backend Python.');
        setData(prev => ({
          ...prev,
          insights: [{
            id: 'warning-ml',
            tipo: 'alerta',
            titulo: '🔌 Backend ML Offline',
            descricao: 'O servidor de análise não está rodando. Execute "py app.py" no diretório backend-ml.',
            impacto: 'alto',
            icon: '🔌',
            cor: '#ef4444',
          }],
          recomendacoes: [
            '1. Abra um terminal PowerShell',
            '2. cd "c:\\dev\\Peperaio Cvisual\\backend-ml"',
            '3. py app.py',
            '4. Aguarde o servidor iniciar em http://localhost:5000',
            '5. Clique em "Atualizar Análise" nesta página',
          ],
          saudeFinanceira: 0,
          loading: false,
        }));
        return;
      }

      // Carregar dados dos últimos 12 meses
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 12);
      const dataInicioStr = dataInicio.toISOString().split('T')[0];

      // 1. Carregar TODAS as transações do caixa (para calcular saldo correto)
      const { data: todasTransacoes, error: errorAllTrans } = await supabase
        .from('transacoes')
        .select('*')
        .order('data', { ascending: true });

      // 2. Carregar transações dos últimos 12 meses (para análise)
      const { data: transacoes, error: errorTrans } = await supabase
        .from('transacoes')
        .select('*')
        .gte('data', dataInicioStr)
        .order('data', { ascending: true });

      // 3. Carregar dívidas ativas
      const { data: dividas, error: errorDividas } = await supabase
        .from('dividas')
        .select('*')
        .neq('status', 'quitado')
        .order('vencimento', { ascending: true });

      if (errorTrans || errorAllTrans || errorDividas) {
        console.error('Erro ao carregar dados:', errorTrans || errorAllTrans || errorDividas);
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      const transacoesData = transacoes || [];
      const dividasData = dividas || [];
      
      // Calcular saldo atual do caixa
      const saldoAtual = (todasTransacoes || []).reduce((acc: number, t: any) => {
        const valor = Number(t.valor) || 0;
        return t.tipo === 'entrada' ? acc + valor : acc - valor;
      }, 0);

      // Calcular total de dívidas ativas
      const totalDividas = dividasData.reduce((acc: number, d: any) => {
        const valor = Number(d.valorRestante || d.valor) || 0;
        return acc + valor;
      }, 0);

      // Usar API ML (obrigatório)
      const transacoesML = converterTransacoesParaML(transacoesData);
      const resultado = await analisarFinancasComML(
        transacoesML, 
        [], // Não enviar gastos de obras
        saldoAtual,
        totalDividas,
        dividasData
      );
      
      if (!resultado.sucesso) {
        throw new Error(resultado.erro || 'Erro na análise ML');
      }

      // Atualizar estado com resultados
      setData({
        padroesPorCategoria: resultado.padroesPorCategoria,
        insights: resultado.insights,
        previsaoFluxoCaixa: resultado.previsaoFluxoCaixa,
        analiseComportamento: resultado.analiseComportamento,
        saudeFinanceira: resultado.saudeFinanceira,
        recomendacoes: resultado.recomendacoes,
        loading: false,
      });
    } catch (error) {
      console.error('Erro na análise financeira:', error);
      setData(prev => ({
        ...prev,
        insights: [{
          id: 'exception',
          tipo: 'alerta',
          titulo: 'Erro ao processar dados',
          descricao: error instanceof Error ? error.message : 'Erro desconhecido',
          impacto: 'alto',
          icon: '❌',
          cor: '#ef4444',
        }],
        loading: false,
      }));
    }
  };

  // Análise JavaScript como fallback (quando backend ML não está disponível)
  const analisarComJavaScript = (
    transacoes: any[], 
    gastos: any[], 
    categoriasLista: any[],
    saldoAtual: number
  ) => {
    // Criar mapa de categorias cadastradas
    const categoriasValidas = new Set(categoriasLista.map((c: any) => c.nome));
    
    // Análise de padrões por categoria (apenas categorias cadastradas)
    const categorias = new Map<string, number[]>();
    const todosDados = [...transacoes.filter((t: any) => t.tipo === 'saida'), ...gastos];

    todosDados.forEach((item: any) => {
      let categoria = item.categoria || 'Outros';
      
      // Usar apenas categorias cadastradas
      if (!categoriasValidas.has(categoria)) {
        categoria = 'Outros';
      }
      
      const mes = new Date(item.data).getMonth();
      const valor = Number(item.valor) || 0;

      if (!categorias.has(categoria)) {
        categorias.set(categoria, Array(12).fill(0));
      }
      categorias.get(categoria)![mes] += valor;
    });

    const padroes: any[] = [];
    categorias.forEach((valores, categoria) => {
      const valoresNaoZero = valores.filter((v: number) => v > 0);
      if (valoresNaoZero.length === 0) return;

      const media = valoresNaoZero.reduce((a: number, b: number) => a + b, 0) / valoresNaoZero.length;
      const ultimos3 = valores.slice(-3).filter((v: number) => v > 0);
      const anteriores3 = valores.slice(-6, -3).filter((v: number) => v > 0);
      
      const mediaUltimos = ultimos3.length > 0 ? ultimos3.reduce((a: number, b: number) => a + b, 0) / ultimos3.length : 0;
      const mediaAnteriores = anteriores3.length > 0 ? anteriores3.reduce((a: number, b: number) => a + b, 0) / anteriores3.length : 0;
      const variacao = mediaAnteriores > 0 ? ((mediaUltimos - mediaAnteriores) / mediaAnteriores) * 100 : 0;

      let tendencia: 'crescente' | 'estavel' | 'decrescente' = 'estavel';
      if (variacao > 10) tendencia = 'crescente';
      else if (variacao < -10) tendencia = 'decrescente';

      const previsao = mediaUltimos > 0 ? mediaUltimos * 1.05 : media;
      const desvio = Math.sqrt(valoresNaoZero.reduce((sum: number, v: number) => sum + Math.pow(v - media, 2), 0) / valoresNaoZero.length);
      const confianca = Math.max(50, Math.min(95, 100 - (desvio / media) * 50));

      padroes.push({
        categoria,
        mediaGastoMensal: media,
        tendencia,
        variacao,
        previsaoProximoMes: previsao,
        confianca,
        desvio_padrao: desvio,
      });
    });

    padroes.sort((a, b) => b.mediaGastoMensal - a.mediaGastoMensal);

    // Insights
    const insights: any[] = [];
    let idCounter = 1;

    // Insight sobre saldo em caixa
    if (saldoAtual < 0) {
      insights.push({
        id: `insight-${idCounter++}`,
        tipo: 'alerta',
        titulo: 'Saldo em caixa negativo',
        descricao: `Seu caixa está com saldo de R$ ${saldoAtual.toFixed(2)}. Atenção urgente necessária!`,
        impacto: 'alto',
        valor: Math.abs(saldoAtual),
        icon: '🚨',
        cor: '#ef4444',
      });
    } else if (saldoAtual < 10000) {
      insights.push({
        id: `insight-${idCounter++}`,
        tipo: 'alerta',
        titulo: 'Saldo em caixa baixo',
        descricao: `Saldo atual: R$ ${saldoAtual.toFixed(2)}. Considere aumentar reservas.`,
        impacto: 'medio',
        valor: saldoAtual,
        icon: '⚠️',
        cor: '#f59e0b',
      });
    } else if (saldoAtual > 50000) {
      insights.push({
        id: `insight-${idCounter++}`,
        tipo: 'oportunidade',
        titulo: 'Saldo em caixa saudável',
        descricao: `Excelente! Saldo de R$ ${saldoAtual.toFixed(2)}. Considere investir o excedente.`,
        impacto: 'alto',
        valor: saldoAtual,
        icon: '💎',
        cor: '#22c55e',
      });
    }

    // Categorias crescendo
    padroes.forEach((padrao) => {
      if (padrao.tendencia === 'crescente' && padrao.variacao > 25) {
        insights.push({
          id: `insight-${idCounter++}`,
          tipo: 'alerta',
          titulo: `${padrao.categoria} crescendo rapidamente`,
          descricao: `Aumento de ${padrao.variacao.toFixed(1)}% nos gastos recentes`,
          impacto: padrao.variacao > 50 ? 'alto' : 'medio',
          categoria: padrao.categoria,
          valor: padrao.variacao,
          icon: '📈',
          cor: '#ef4444',
        });
      }
    });

    // Fluxo de caixa
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    const transacoesMes = transacoes.filter((t: any) => {
      const data = new Date(t.data);
      return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    });

    const entradasMes = transacoesMes.filter((t: any) => t.tipo === 'entrada').reduce((sum: number, t: any) => sum + Number(t.valor), 0);
    const saidasMes = transacoesMes.filter((t: any) => t.tipo === 'saida').reduce((sum: number, t: any) => sum + Number(t.valor), 0);
    const saldoMes = entradasMes - saidasMes;

    if (saldoMes < 0) {
      insights.push({
        id: `insight-${idCounter++}`,
        tipo: 'alerta',
        titulo: 'Fluxo negativo este mês',
        descricao: `Déficit de R$ ${Math.abs(saldoMes).toFixed(2)}`,
        impacto: 'alto',
        valor: Math.abs(saldoMes),
        icon: '⚠️',
        cor: '#f59e0b',
      });
    }

    // Previsão de fluxo de caixa
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const previsoes: any[] = [];
    const mediaEntradas = transacoes.filter((t: any) => t.tipo === 'entrada').reduce((sum: number, t: any) => sum + Number(t.valor), 0) / 12;
    const mediaSaidas = transacoes.filter((t: any) => t.tipo === 'saida').reduce((sum: number, t: any) => sum + Number(t.valor), 0) / 12;
    
    let saldoAcumulado = 0;
    for (let i = 0; i < 6; i++) {
      const mes = (mesAtual + i + 1) % 12;
      const fator = 1 + (i * 0.02);
      const entradaPrevista = mediaEntradas * fator;
      const saidaPrevista = mediaSaidas * fator;
      saldoAcumulado += entradaPrevista - saidaPrevista;

      previsoes.push({
        mes: meses[mes],
        previsaoEntrada: entradaPrevista,
        previsaoSaida: saidaPrevista,
        saldoPrevisto: saldoAcumulado,
        confianca: Math.max(50, 95 - (i * 8)),
      });
    }

    // Análise de comportamento
    const gastosPorDia = Array(7).fill(0);
    todosDados.forEach((item: any) => {
      const dia = new Date(item.data).getDay();
      gastosPorDia[dia] += Number(item.valor) || 0;
    });
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diaMaisGastos = diasSemana[gastosPorDia.indexOf(Math.max(...gastosPorDia))];

    const comportamento = {
      diaMaisGastos,
      horarioMaisAtivo: 'Comercial',
      categoriaDominante: padroes[0]?.categoria || 'N/A',
      padraoSazonal: false,
      eficienciaFinanceira: Math.round(Math.max(0, Math.min(100, 50 + (saldoMes / Math.max(1, entradasMes)) * 50))),
      saldoAtual: saldoAtual,
    };

    // Saúde financeira
    const totalEntradas = transacoes.filter((t: any) => t.tipo === 'entrada').reduce((sum: number, t: any) => sum + Number(t.valor), 0);
    const totalSaidas = transacoes.filter((t: any) => t.tipo === 'saida').reduce((sum: number, t: any) => sum + Number(t.valor), 0);
    let saude = 50;
    if (totalEntradas > totalSaidas) {
      saude += Math.min(30, ((totalEntradas - totalSaidas) / totalEntradas) * 100);
    }
    const tendenciasPositivas = padroes.filter((p: any) => p.tendencia !== 'crescente').length;
    saude += (tendenciasPositivas / Math.max(1, padroes.length)) * 20;
    saude = Math.round(Math.max(0, Math.min(100, saude)));

    // Recomendações baseadas em saldo e saúde financeira
    const recomendacoes: string[] = [];
    
    // Recomendações baseadas no saldo
    if (saldoAtual < 0) {
      recomendacoes.push('🚨 URGENTE: Regularize o saldo negativo imediatamente');
      recomendacoes.push('💰 Pare novos gastos até estabilizar o caixa');
    } else if (saldoAtual < 5000) {
      recomendacoes.push('⚠️ Aumente suas reservas de emergência urgentemente');
      recomendacoes.push('💡 Priorize recebimentos e reduza gastos não essenciais');
    }
    
    // Recomendações baseadas na saúde
    if (saude < 40) {
      recomendacoes.push('🚨 Revise todos os gastos e corte despesas desnecessárias');
      recomendacoes.push('📋 Renegocie contratos e prazos de pagamento');
    } else if (saude < 70) {
      recomendacoes.push('📊 Monitore de perto as categorias em crescimento');
      recomendacoes.push('💰 Busque otimizar custos operacionais');
    } else {
      recomendacoes.push('✅ Excelente gestão! Continue monitorando');
      if (saldoAtual > 30000) {
        recomendacoes.push('💎 Considere investir parte do excedente');
      }
    }
    
    // Recomendações sobre categorias
    if (padroes[0] && padroes[0].tendencia === 'crescente') {
      recomendacoes.push(`🔍 Atenção: "${padroes[0].categoria}" está crescendo ${padroes[0].variacao.toFixed(0)}%`);
    }
    
    if (categoriasLista.length > 0) {
      recomendacoes.push(`📂 ${categoriasLista.length} categorias cadastradas sendo monitoradas`);
    }

    return {
      padroesPorCategoria: padroes,
      insights: insights.slice(0, 8),
      previsaoFluxoCaixa: previsoes,
      analiseComportamento: comportamento,
      saudeFinanceira: saude,
      recomendacoes: recomendacoes.slice(0, 6),
      sucesso: true,
    };
  };

  return { data, refresh: loadAndAnalyze };
};
