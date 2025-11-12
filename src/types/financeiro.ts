// Tipos do Sistema Financeiro Completo

// --- ENUMS ---
export type TipoTransacao = 'ENTRADA' | 'SAIDA';
export type StatusDespesa = 'PENDENTE' | 'APROVADO' | 'REPROVADO';
export type StatusProjeto = 
  | 'PENDENTE'           // Aguardando primeira verba
  | 'EM_ANDAMENTO'       // Obra ativa
  | 'AGUARDANDO_VERBA'   // Solicitação de verba pendente
  | 'EM_ANALISE'         // Finalizado, aguardando aprovação do admin
  | 'FINALIZADO'         // Obra concluída e aprovada
  | 'CANCELADO';         // Obra cancelada

export type StatusSolicitacaoVerba = 'PENDENTE' | 'APROVADO' | 'REPROVADO';
export type UserRole = 'admin' | 'visualizador';

// --- FINANÇAS PESSOAIS ---
export interface TransacaoPessoal {
  id_transacao: string;
  id_usuario: string;
  tipo: TipoTransacao;
  descricao: string;
  valor: number;
  data: string;
  created_at: string;
}

// --- CAIXA DE ADIANTAMENTO ---
export interface CaixaAdiantamento {
  id_caixa: string;
  id_usuario: string;
  saldo: number;
  updated_at: string;
}

export interface DespesaAdiantamento {
  id_despesa: string;
  id_caixa: string;
  descricao: string;
  valor: number;
  data: string;
  url_comprovante: string;
  status: StatusDespesa;
  notas_admin?: string;
  created_at: string;
}

// --- CATEGORIAS ---
export interface CategoriaDeGasto {
  id_categoria: string;
  nome: string;
  cor: string;
  created_at: string;
}

// --- CARDS DE OBRA (CENTRO DE CUSTO) ---
export interface CardDeObra {
  id_card: string;
  titulo: string;
  nome_cliente: string;
  status: StatusProjeto;
  
  // Financeiro
  valor_venda_orcamento: number;  // Valor da venda total
  saldo_atual: number;             // Saldo disponível no card
  total_gasto: number;             // Total já gasto
  
  // Relacionamentos
  id_visualizador_responsavel: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  finalizado_em?: string;
  aprovado_em?: string;
}

export interface DespesaDeObra {
  id_despesa: string;
  id_card: string;
  id_categoria: string;
  descricao: string;
  valor: number;
  data: string;
  url_comprovante: string;
  status: StatusDespesa;
  notas_admin?: string;
  created_at: string;
  
  // Relacionamentos (joins)
  categoria?: CategoriaDeGasto;
  card?: CardDeObra;
}

export interface SolicitacaoDeVerba {
  id_solicitacao: string;
  id_card: string;
  id_solicitante: string;
  valor: number;
  justificativa: string;
  status: StatusSolicitacaoVerba;
  data_solicitacao: string;
  data_resolucao?: string;
  notas_admin?: string;
  
  // Relacionamentos (joins)
  card?: CardDeObra;
  solicitante?: {
    id: string;
    nome: string;
    email: string;
  };
}

// --- DASHBOARDS ---
export interface ResumoFinanceiroPessoal {
  saldo: number;
  entradas: number;
  saidas: number;
  total_transacoes: number;
  transacoes_recentes: TransacaoPessoal[];
}

export interface ResumoCaixaAdiantamento {
  saldo: number;
  total_despesas: number;
  despesas_pendentes: number;
  despesas_aprovadas: number;
  despesas_reprovadas: number;
}

export interface ResumoCardsDeObra {
  total_cards: number;
  cards_ativos: number;
  cards_em_analise: number;
  cards_finalizados: number;
  valor_total_orcamentos: number;
  valor_total_gasto: number;
  saldo_total_disponivel: number;
}

// --- UPLOAD DE COMPROVANTES ---
export interface ComprovanteUpload {
  file: File;
  pasta: 'adiantamento' | 'obras';
  id_card?: string; // Obrigatório quando pasta === 'obras'
}

export interface ComprovanteResponse {
  url: string;
  path: string;
  publicUrl: string;
}

// --- FILTROS ---
export interface FiltroTransacoes {
  tipo?: TipoTransacao;
  dataInicio?: string;
  dataFim?: string;
  descricao?: string;
}

export interface FiltroCardsObra {
  status?: StatusProjeto;
  id_responsavel?: string;
  cliente?: string;
}

export interface FiltroDespesas {
  status?: StatusDespesa;
  id_categoria?: string;
  dataInicio?: string;
  dataFim?: string;
}

// --- NOTIFICAÇÕES ---
export interface Notificacao {
  id: string;
  tipo: 'SOLICITACAO_VERBA' | 'VERBA_APROVADA' | 'VERBA_REPROVADA' | 'OBRA_EM_ANALISE' | 'DESPESA_REPROVADA';
  titulo: string;
  mensagem: string;
  lida: boolean;
  data: string;
  link?: string;
}

// --- HELPERS ---
export const StatusProjetoLabel: Record<StatusProjeto, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO_VERBA: 'Aguardando Verba',
  EM_ANALISE: 'Em Análise',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado'
};

export const StatusProjetoCor: Record<StatusProjeto, string> = {
  PENDENTE: '#f59e0b',         // Amarelo
  EM_ANDAMENTO: '#3b82f6',     // Azul
  AGUARDANDO_VERBA: '#8b5cf6', // Roxo
  EM_ANALISE: '#06b6d4',       // Ciano
  FINALIZADO: '#10b981',       // Verde
  CANCELADO: '#ef4444'         // Vermelho
};

export const StatusDespesaLabel: Record<StatusDespesa, string> = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado'
};

export const StatusDespesaCor: Record<StatusDespesa, string> = {
  PENDENTE: '#f59e0b',   // Amarelo
  APROVADO: '#10b981',   // Verde
  REPROVADO: '#ef4444'   // Vermelho
};
