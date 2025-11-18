/**
 * Serviço de comunicação com a API de Machine Learning (Python/Flask)
 * Usa Pandas e Scikit-learn para análises avançadas
 */

const ML_API_URL = 'http://localhost:5000';

export interface TransacaoML {
  id: number;
  data: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  categoria: string;
  descricao?: string;
}

export interface GastoObraML {
  id: number;
  data: string;
  valor: number;
  categoria: string;
  obra_id?: number;
  obra_nome?: string;
}

export interface PadraoCategoria {
  categoria: string;
  mediaGastoMensal: number;
  tendencia: 'crescente' | 'decrescente' | 'estavel';
  variacao: number;
  previsaoProximoMes: number;
  confianca: number;
  desvio_padrao: number;
}

export interface InsightML {
  id: string;
  tipo: 'alerta' | 'oportunidade' | 'previsao' | 'recomendacao';
  titulo: string;
  descricao: string;
  impacto: 'alto' | 'medio' | 'baixo';
  valor?: number;
  categoria?: string;
  icon: string;
  cor: string;
}

export interface PrevisaoFluxo {
  mes: string;
  previsaoEntrada: number;
  previsaoSaida: number;
  saldoPrevisto: number;
  confianca: number;
}

export interface AnaliseComportamento {
  diaMaisGastos: string;
  horarioMaisAtivo: string;
  categoriaDominante: string;
  padraoSazonal: boolean;
  eficienciaFinanceira: number;
  saldoAtual?: number;
}

export interface ResultadoAnaliseML {
  padroesPorCategoria: PadraoCategoria[];
  insights: InsightML[];
  previsaoFluxoCaixa: PrevisaoFluxo[];
  analiseComportamento: AnaliseComportamento;
  saudeFinanceira: number;
  recomendacoes: string[];
  sucesso: boolean;
  erro?: string;
}

/**
 * Verifica se a API ML está funcionando
 */
export async function verificarHealthML(): Promise<boolean> {
  try {
    console.log('🔍 Verificando backend ML em:', ML_API_URL);
    
    // Timeout de 5 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${ML_API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('✅ Backend ML respondeu:', response.status);
    
    if (!response.ok) {
      console.error('❌ Backend ML retornou erro:', response.status);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Backend ML online:', data);
    return data.status === 'ok';
  } catch (error) {
    console.error('❌ Erro ao conectar com backend ML:', error);
    return false;
  }
}

/**
 * Realiza análise completa dos dados financeiros usando ML
 * @param transacoes - Lista de transações (entradas e saídas)
 * @param gastos_obras - Lista de gastos específicos de obras (não usado mais)
 * @param saldoAtual - Saldo atual do caixa
 * @param totalDividas - Total de dívidas ativas
 * @param dividas - Lista de dívidas
 */
export async function analisarFinancasComML(
  transacoes: TransacaoML[],
  gastos_obras: GastoObraML[] = [],
  saldoAtual?: number,
  totalDividas?: number,
  dividas?: any[]
): Promise<ResultadoAnaliseML> {
  try {
    // Timeout de 10 segundos para análise
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${ML_API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transacoes,
        gastos_obras: [], // Não enviar mais gastos de obras
        saldo_atual: saldoAtual,
        total_dividas: totalDividas,
        dividas: dividas || [],
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Erro na API ML: ${response.status} ${response.statusText}`);
    }
    
    const resultado: ResultadoAnaliseML = await response.json();
    
    if (!resultado.sucesso) {
      throw new Error(resultado.erro || 'Erro desconhecido na análise ML');
    }
    
    return resultado;
  } catch (err) {
    // Erro silencioso - usa fallback JavaScript automaticamente no hook
    const error = err as Error;
    throw new Error(error.message || 'Erro ao conectar com API ML');
  }
}

/**
 * Converte transações do Supabase para formato ML
 */
export function converterTransacoesParaML(transacoes: any[]): TransacaoML[] {
  return transacoes.map(t => ({
    id: t.id,
    data: t.data,
    valor: parseFloat(t.valor),
    tipo: t.tipo,
    categoria: t.categoria || 'Outros',
    descricao: t.descricao,
  }));
}

/**
 * Converte gastos de obras para formato ML
 */
export function converterGastosParaML(gastos: any[]): GastoObraML[] {
  return gastos.map(g => ({
    id: g.id,
    data: g.data,
    valor: parseFloat(g.valor),
    categoria: g.categoria || 'Outros',
    obra_id: g.obra_id,
    obra_nome: g.obra_nome,
  }));
}
