import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { usePermissao } from '../context/PermissaoContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Minus, TrendingUp, TrendingDown, FileDown, Wallet, Trash2, Tag, ChevronLeft, ChevronRight, History, RotateCcw, AlertTriangle, Archive, Folder, FolderOpen, Download, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import jsPDF from 'jspdf';
import { ConfirmDialog } from '../components/ConfirmDialog';
import CaixaArquivos from '../components/CaixaArquivos';
import './Caixa.css';
import './Caixa-fab.css';
import '../styles/ios-premium.css';

// Função auxiliar para detectar mobile
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Função auxiliar para download de PDF em mobile
const downloadPDFMobile = async (doc: jsPDF, filename: string) => {
  try {
    if (isMobileDevice()) {
      // Mobile: sempre usa compartilhamento
      const blob = doc.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.share) {
        try {
          await navigator.share({
            files: [file],
            title: 'Extrato do Caixa',
            text: 'Extrato financeiro gerado pelo sistema PEPERAIO'
          });
          toast.success('PDF compartilhado com sucesso!');
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error('Erro ao compartilhar:', error);
            toast.error('Erro ao compartilhar PDF');
          }
        }
      } else {
        // Fallback: abre em nova aba se Web Share API não disponível
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.info('PDF aberto em nova aba');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } else {
      // Desktop: download tradicional
      doc.save(filename);
      toast.success('PDF exportado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    toast.error('Erro ao exportar PDF. Tente novamente.');
  }
};

interface Transacao {
  id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  origem: string;
  data: string;
  observacao: string;
  categoria: string;
}

interface TransacaoExcluida extends Transacao {
  data_exclusao: string;
  excluido_por?: string;
  motivo_exclusao?: string;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: 'entrada' | 'saida' | 'ambos';
}

const ITEMS_PER_PAGE = 10;

export default function Caixa() {
  // ...hooks e funções auxiliares...
  const { canCreate, canDelete } = usePermissao();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [historico, setHistorico] = useState<TransacaoExcluida[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isEntradaDialogOpen, setIsEntradaDialogOpen] = useState(false);
  const [isSaidaDialogOpen, setIsSaidaDialogOpen] = useState(false);
  const [isCategoriaDialogOpen, setIsCategoriaDialogOpen] = useState(false);
  const [deleteJustificativaDialog, setDeleteJustificativaDialog] = useState<{ isOpen: boolean; id: string | null; justificativa: string }>({ isOpen: false, id: null, justificativa: '' });
  const [confirmDeleteHistoricoDialog, setConfirmDeleteHistoricoDialog] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [filtroTipo, setFiltroTipo] = useState<'data' | 'mes'>('data');
  const [filtroData, setFiltroData] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReceber, setTotalReceber] = useState(0);
  const [dividasAtivas, setDividasAtivas] = useState(0);
  const [entradaFormData, setEntradaFormData] = useState({
    valor: '',
    origem: '',
    data: new Date().toISOString().split('T')[0],
    observacao: '',
    categoria: '',
  });
  const [saidaFormData, setSaidaFormData] = useState({
    valor: '',
    origem: '',
    data: new Date().toISOString().split('T')[0],
    observacao: '',
    categoria: '',
  });
  const [categoriaFormData, setCategoriaFormData] = useState({
    nome: '',
    tipo: 'ambos' as 'entrada' | 'saida' | 'ambos',
  });

  // Estados para Sistema de Arquivamento (dados carregados pelo componente CaixaArquivos)
  const [arquivos, setArquivos] = useState<{mes: string; ano: string; total_entradas: number; total_saidas: number; quantidade: number}[]>([]);
  
  // Estado para saldo real (incluindo transações arquivadas)
  const [saldoTotal, setSaldoTotal] = useState<number>(0);
  
  // Estados para controle de visualização
  const [viewMode, setViewMode] = useState<'caixa' | 'historico' | 'arquivos'>('caixa');

  useEffect(() => {
    loadTransacoes();
    loadSaldoTotal();
    loadCategorias();
    loadResumoFinanceiro();
    loadHistorico();
    loadArquivos();
    
    // Listener para atualizar saldo quando arquivar/restaurar
    const handleAtualizacao = () => {
      console.log('🔄 Evento de atualização detectado - recarregando saldo');
      loadSaldoTotal();
      loadArquivos();
    };
    
    window.addEventListener('transacao-atualizada', handleAtualizacao);
    return () => window.removeEventListener('transacao-atualizada', handleAtualizacao);
  }, []);


  // Corrigir valor a receber: soma de todos os valores que ainda faltam receber das obras
  const loadResumoFinanceiro = async () => {
    // Busca todas as obras
    const { data: obras, error } = await supabase.from('obras').select('valor_total, valor_recebido, status');
    let totalReceberCalc = 0;
    if (!error && obras) {
      totalReceberCalc = obras
        .filter((obra: any) => obra.status !== 'Finalizada' && obra.status !== 'Cancelada')
        .reduce((acc: number, obra: any) => {
          const valorTotal = Number(obra.valor_total) || 0;
          const valorRecebido = Number(obra.valor_recebido) || 0;
          return acc + (valorTotal - valorRecebido);
        }, 0);
    }
    setTotalReceber(totalReceberCalc);

    // Busca dividas
    const { data: dividas } = await supabase.from('dividas').select('*');
    const dividasData = dividas || [];
    const dividasAtivasCalc = dividasData
      .filter((d: any) => d.status !== 'quitado')
      .reduce((acc: number, d: any) => acc + (d.valorRestante ?? d.valor ?? 0), 0);
    setDividasAtivas(dividasAtivasCalc);
  };

  const loadCategorias = () => {
    supabase.from('categorias').select('*').then(({ data, error }) => {
      if (!error && data) {
        setCategorias(data);
      } else {
        toast.error('Erro ao buscar categorias!');
      }
    });
  };

  const saveCategorias = (data: Categoria[]) => {
  // Não usado mais, agora é Supabase
  setCategorias(data);
  };

  // Carregar saldo total (incluindo arquivadas)
  const loadSaldoTotal = async () => {
    const { data, error } = await supabase
      .from('transacoes')
      .select('tipo, valor');

    if (!error && data) {
      const saldo = data.reduce((acc, t) => t.tipo === 'entrada' ? acc + t.valor : acc - t.valor, 0);
      console.log('💰 Saldo total (incluindo arquivadas):', saldo);
      setSaldoTotal(saldo);
    }
  };

  const loadTransacoes = () => {
    console.log('🔄 Recarregando transações do caixa...');
    supabase
      .from('transacoes')
      .select('*')
      .eq('arquivado', false) // Só mostrar transações NÃO arquivadas
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          console.log('✅ Transações visíveis:', data.length, 'itens');
          setTransacoes(data);
        } else {
          console.error('❌ Erro ao buscar transações:', error);
          toast.error('Erro ao buscar transações!');
        }
      });
    
    // Sempre atualizar saldo total
    loadSaldoTotal();
  };

  const loadHistorico = () => {
    console.log('loadHistorico chamado');
    supabase.from('transacoes_excluidas').select('*').order('data_exclusao', { ascending: false }).then(({ data, error }) => {
      console.log('Dados recebidos do histórico:', data);
      console.log('Erro ao carregar histórico:', error);
      if (!error && data) {
        console.log('Atualizando estado do histórico com', data.length, 'itens');
        setHistorico(data);
      }
    });
  };

  // Função auxiliar para carregar arquivos (usada pelo componente CaixaArquivos)
  const loadArquivos = async () => {
    try {
      const { data, error } = await supabase
        .from('transacoes_arquivadas')
        .select('*')
        .order('mes_referencia', { ascending: false });
      
      if (error) {
        console.error('Erro ao carregar arquivos:', error);
        if (error.code === 'PGRST204' || error.message?.includes('schema cache')) {
          console.warn('Tabela transacoes_arquivadas não existe. Execute o SQL.');
        }
        return;
      }
      
      if (!data) return;
      
      // Agrupa por mês e calcula totais
      const arquivosMap = new Map();
      data.forEach((item: any) => {
        const key = item.mes_referencia;
        if (!arquivosMap.has(key)) {
          const [ano, mes] = key.split('-');
          console.log('📁 Criando arquivo:', { mes_referencia: key, ano, mes });
          arquivosMap.set(key, {
            mes: mes,
            ano: ano,
            total_entradas: 0,
            total_saidas: 0,
            quantidade: 0
          });
        }
        const arquivo = arquivosMap.get(key);
        // Calcula totais baseado no tipo da transação
        if (item.tipo === 'entrada') {
          arquivo.total_entradas += item.valor || 0;
        } else {
          arquivo.total_saidas += item.valor || 0;
        }
        arquivo.quantidade += 1;
      });
      setArquivos(Array.from(arquivosMap.values()));
    } catch (err) {
      console.error('Erro ao processar arquivos:', err);
    }
  };

  const saveTransacoes = (data: Transacao[]) => {
  // Não usado mais, agora é Supabase
  setTransacoes(data);
  };

  const handleEntradaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    (async () => {
      const { error } = await supabase.from('transacoes').insert({
        tipo: 'entrada',
        valor: parseFloat(entradaFormData.valor),
        origem: entradaFormData.origem,
        data: entradaFormData.data,
        observacao: entradaFormData.observacao,
        categoria: entradaFormData.categoria,
      });
      if (!error) {
        loadTransacoes();
        toast.success('Entrada registrada com sucesso!');
        setEntradaFormData({
          valor: '',
          origem: '',
          data: new Date().toISOString().split('T')[0],
          observacao: '',
          categoria: '',
        });
        setIsEntradaDialogOpen(false);
        setCurrentPage(1);
      } else {
        toast.error('Erro ao registrar entrada!');
      }
    })();
  } // <-- FALTAVA FECHAR AQUI

  const handleSaidaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    (async () => {
      const { error } = await supabase.from('transacoes').insert({
        tipo: 'saida',
        valor: parseFloat(saidaFormData.valor),
        origem: saidaFormData.origem,
        data: saidaFormData.data,
        observacao: saidaFormData.observacao,
        categoria: saidaFormData.categoria,
      });
      if (!error) {
        loadTransacoes();
        toast.success('Saída registrada com sucesso!');
        setSaidaFormData({
          valor: '',
          origem: '',
          data: new Date().toISOString().split('T')[0],
          observacao: '',
          categoria: '',
        });
        setIsSaidaDialogOpen(false);
        setCurrentPage(1);
      } else {
        toast.error('Erro ao registrar saída!');
      }
    })();
  } // <-- FALTAVA FECHAR AQUI

  const handleCategoriaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    (async () => {
      const { error } = await supabase.from('categorias').insert({
        nome: categoriaFormData.nome,
        tipo: categoriaFormData.tipo,
      });
      if (!error) {
        loadCategorias();
        toast.success('Categoria criada com sucesso!');
        setCategoriaFormData({ nome: '', tipo: 'ambos' });
        setIsCategoriaDialogOpen(false);
      } else {
        toast.error('Erro ao criar categoria!');
      }
    })();
  } // <-- FALTAVA FECHAR AQUI

  const handleDeleteCategoria = (id: string) => {
    if (!canDelete) return;
    (async () => {
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (!error) {
        loadCategorias();
        toast.success('Categoria removida com sucesso!');
      } else {
        toast.error('Erro ao remover categoria!');
      }
    })();
  } // <-- FALTAVA FECHAR ESSA FUNÇÃO

  // Funções de cálculo e renderização
  const calcularSaldo = () => {
    // Retornar saldo total (incluindo arquivadas)
    return saldoTotal;
  };

  const calcularTotalEntradas = () => {
    return transacoes
      .filter((t) => t.tipo === 'entrada')
      .reduce((acc, t) => acc + t.valor, 0);
  };

  const calcularTotalSaidas = () => {
    return transacoes
      .filter((t) => t.tipo === 'saida')
      .reduce((acc, t) => acc + t.valor, 0);
  };

  const filtrarTransacoes = (tipo?: 'entrada' | 'saida') => {
    let filtered = transacoes;
    if (tipo) {
      filtered = filtered.filter((t) => t.tipo === tipo);
    }

    // Apply date or month filter
    if (filtroTipo === 'data' && filtroData) {
      filtered = filtered.filter((t) => t.data >= filtroData);
    } else if (filtroTipo === 'mes' && filtroMes) {
      const [year, month] = filtroMes.split('-');
      filtered = filtered.filter((t) => {
        const tDate = new Date(t.data);
        return (
          tDate.getFullYear() === parseInt(year) &&
          tDate.getMonth() + 1 === parseInt(month)
        );
      });
    }

    return filtered.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  };

  const getPaginatedTransacoes = (lista: Transacao[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return lista.slice(startIndex, endIndex);
  };

  // Função para exportar o extrato em PDF
  async function exportarExtrato() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Determina lista filtrada para exportação
    // Exporta exatamente o que está sendo exibido na tab ativa e filtro
    let transacoesExportar = todasTransacoes;
    const tabAtiva = document.querySelector('.caixa-tabs-list .caixa-tab-trigger[aria-selected="true"]');
    if (tabAtiva) {
      const tab = tabAtiva.textContent;
      if (tab?.includes('Entradas')) transacoesExportar = entradas;
      else if (tab?.includes('Saídas')) transacoesExportar = saidas;
      else transacoesExportar = todasTransacoes;
    }
    // Se filtro de data/mês estiver ativo, filtra também
    if (filtroTipo === 'data' && filtroData) {
      // Se filtroData tem formato YYYY-MM-DD, filtra pelo dia exato
      transacoesExportar = transacoesExportar.filter((t) => t.data === filtroData);
    } else if (filtroTipo === 'mes' && filtroMes) {
      const [year, month] = filtroMes.split('-');
      transacoesExportar = transacoesExportar.filter((t) => {
        const tDate = new Date(t.data);
        return (
          tDate.getFullYear() === parseInt(year) &&
          tDate.getMonth() + 1 === parseInt(month)
        );
      });
    }
    // Calcular totais
    const totalEntradas = transacoesExportar
      .filter((t) => t.tipo === 'entrada')
      .reduce((acc, t) => acc + t.valor, 0);
    const totalSaidas = transacoesExportar
      .filter((t) => t.tipo === 'saida')
      .reduce((acc, t) => acc + t.valor, 0);
    const saldoFinal = totalEntradas - totalSaidas;

    // ===== BACKGROUND ESCURO =====
    doc.setFillColor(15, 23, 42); // #0f172a - Fundo escuro suave
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // ===== CABEÇALHO PRINCIPAL =====
    doc.setFillColor(7, 16, 41); // #071029 - Cor do sistema
    doc.rect(0, 0, 210, 35, 'F');
    
    // Barra de destaque azul no topo
    doc.setFillColor(96, 165, 250); // #60a5fa
    doc.rect(0, 0, 210, 3, 'F');
    
    // Logo/Título
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(230, 238, 248); // #e6eef8 - Texto claro
    doc.text('PEPERAIO', 105, 15, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Comunicação Visual', 105, 23, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // #94a3b8
    doc.text('EXTRATO DO CAIXA', 105, 30, { align: 'center' });

    // ===== INFORMAÇÕES DO EXTRATO =====
    let yPos = 45;
    
    // Box de informações principais
    doc.setFillColor(21, 26, 46); // #151a2e
    doc.setDrawColor(35, 42, 69); // #232a45
    doc.setLineWidth(0.5);
    doc.roundedRect(15, yPos, 180, 50, 3, 3, 'FD');
    
    yPos += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(96, 165, 250); // #60a5fa - Azul destaque
    doc.text('Movimentações Financeiras', 20, yPos);
    
    yPos += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // #94a3b8 - Texto secundário
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 20, yPos);

    // Cards de resumo em 3 colunas
    yPos += 10;
    const cardWidth = 54;
    const cardHeight = 22;
    const cardSpacing = 6;
    
  // Card 1 - Entradas
  doc.setFillColor(21, 26, 46); // #151a2e - Fundo do card
  doc.setDrawColor(52, 211, 153); // #34d399 - Borda verde
  doc.setLineWidth(1);
  doc.roundedRect(20, yPos, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(52, 211, 153); // #34d399 - Label verde
  doc.text('TOTAL ENTRADAS', 22, yPos + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 211, 153); // #34d399 - Valor verde
  doc.text(formatCurrency(totalEntradas), 22, yPos + 12);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // #94a3b8 - Texto secundário
  doc.text(`${transacoesExportar.filter(t => t.tipo === 'entrada').length} lançamento(s)`, 22, yPos + 18);
    
  // Card 2 - Saídas
  doc.setFillColor(21, 26, 46); // #151a2e - Fundo do card
  doc.setDrawColor(248, 113, 113); // #f87171 - Borda vermelha
  doc.roundedRect(20 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(248, 113, 113); // #f87171 - Label vermelha
  doc.text('TOTAL SAÍDAS', 22 + cardWidth + cardSpacing, yPos + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(248, 113, 113); // #f87171 - Valor vermelho
  doc.text(formatCurrency(totalSaidas), 22 + cardWidth + cardSpacing, yPos + 12);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // #94a3b8 - Texto secundário
  doc.text(`${transacoesExportar.filter(t => t.tipo === 'saida').length} lançamento(s)`, 22 + cardWidth + cardSpacing, yPos + 18);
    
  // Card 3 - Saldo Final
  const saldoColor = saldoFinal >= 0 ? [52, 211, 153] : [248, 113, 113]; // Verde ou vermelho
  doc.setFillColor(21, 26, 46); // #151a2e - Fundo do card
  doc.setDrawColor(saldoColor[0], saldoColor[1], saldoColor[2]); // Borda colorida
  doc.roundedRect(20 + (cardWidth + cardSpacing) * 2, yPos, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(saldoColor[0], saldoColor[1], saldoColor[2]); // Label colorida
  doc.text('SALDO FINAL', 22 + (cardWidth + cardSpacing) * 2, yPos + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(saldoColor[0], saldoColor[1], saldoColor[2]); // Valor colorido
  doc.text(formatCurrency(saldoFinal), 22 + (cardWidth + cardSpacing) * 2, yPos + 12);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // #94a3b8 - Texto secundário
  doc.text(saldoFinal >= 0 ? 'Saldo positivo' : 'Saldo negativo', 22 + (cardWidth + cardSpacing) * 2, yPos + 18);

    // ===== TABELA DE TRANSAÇÕES =====
    yPos += 35;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(96, 165, 250); // Azul #60a5fa
    doc.text('DETALHAMENTO DAS TRANSAÇÕES', 20, yPos);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Total de ${transacoesExportar.length} transação(ões)`, 120, yPos);

    yPos += 7;
    
    // Cabeçalho da tabela
    doc.setFillColor(96, 165, 250); // #60a5fa
    doc.rect(15, yPos, 180, 10, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('DATA', 18, yPos + 6);
    doc.text('ORIGEM', 38, yPos + 6);
    doc.text('CATEGORIA', 70, yPos + 6);
    doc.text('TIPO', 110, yPos + 6);
    doc.text('VALOR', 170, yPos + 6);
    
    yPos += 10;

    // Linhas da tabela
  (transacoesExportar || []).forEach((transacao, idx) => {
      // Verifica se precisa adicionar nova página
      if (yPos > 260) {
        doc.addPage();
        // Reaplica background na nova página
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = 20;
        
        // Reaplica cabeçalho da tabela na nova página
        doc.setFillColor(96, 165, 250);
        doc.rect(15, yPos, 180, 10, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Total de ${transacoesExportar.length} transação(ões)`, 120, yPos);
        doc.text('ORIGEM', 38, yPos + 6);
        doc.text('CATEGORIA', 70, yPos + 6);
        doc.text('TIPO', 110, yPos + 6);
        doc.text('VALOR', 170, yPos + 6);
        yPos += 10;
      }

      // Alterna cor de fundo
      if (idx % 2 === 0) {
        doc.setFillColor(26, 31, 58); // #1a1f3a
      } else {
        doc.setFillColor(21, 26, 46); // #151a2e
      }
      
      // Altura da linha (10 se não tem obs, 16 se tem)
      const rowHeight = transacao.observacao ? 16 : 10;
      doc.rect(15, yPos, 180, rowHeight, 'F');
      
      // Borda lateral colorida
      if (transacao.tipo === 'entrada') {
        doc.setDrawColor(52, 211, 153); // Verde
      } else {
        doc.setDrawColor(248, 113, 113); // Vermelho
      }
      doc.setLineWidth(1);
      doc.line(15, yPos, 15, yPos + rowHeight);
      
      // Conteúdo da linha
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(new Date(transacao.data.replace(/-/g, '/')).toLocaleDateString('pt-BR'), 18, yPos + 6);
      
      doc.setTextColor(230, 238, 248);
      doc.setFont('helvetica', 'normal');
  const origemStr = transacao.origem || "";
  const origemTruncada = origemStr.length > 15 ? origemStr.substring(0, 12) + '...' : origemStr;
      doc.text(origemTruncada, 38, yPos + 6);
      
      doc.setTextColor(167, 139, 250); // #a78bfa - roxo para categoria
      doc.setFont('helvetica', 'bold');
  const categoriaStr = transacao.categoria || "";
  const categoriaTruncada = categoriaStr.length > 18 ? categoriaStr.substring(0, 15) + '...' : categoriaStr;
      doc.text(categoriaTruncada, 70, yPos + 6);
      
      // Badge de tipo
      if (transacao.tipo === 'entrada') {
        doc.setTextColor(52, 211, 153); // Verde
        doc.text('Entrada', 110, yPos + 6);
      } else {
        doc.setTextColor(248, 113, 113); // Vermelho
        doc.text('Saída', 110, yPos + 6);
      }
      
      // Valor
      doc.setFont('helvetica', 'bold');
      doc.text((transacao.tipo === 'entrada' ? '+' : '-') + formatCurrency(transacao.valor), 190, yPos + 6, { align: 'right' });
      
      // Observação se existir
      if (transacao.observacao) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139); // #64748b
        const obsTruncada = transacao.observacao.length > 80 ? transacao.observacao.substring(0, 77) + '...' : transacao.observacao;
        doc.text(`Obs: ${obsTruncada}`, 18, yPos + 12);
      }
      
      yPos += rowHeight;
    });

    // Linha de resumo final
    yPos += 2;
    doc.setFillColor(7, 16, 41); // #071029
    doc.rect(15, yPos, 180, 18, 'F');
    doc.setDrawColor(96, 165, 250);
    doc.setLineWidth(2);
    doc.line(15, yPos, 195, yPos);
    
  // Entradas
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 211, 153);
  doc.text('ENTRADAS:', 18, yPos + 6);
  doc.setFontSize(10);
  doc.text(formatCurrency(totalEntradas), 55, yPos + 6);
    
  // Saídas
  doc.setTextColor(248, 113, 113);
  doc.setFontSize(9);
  doc.text('SAÍDAS:', 18, yPos + 12);
  doc.setFontSize(10);
  doc.text(formatCurrency(totalSaidas), 55, yPos + 12);
    
    // Saldo Final
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(230, 238, 248);
    doc.text('SALDO FINAL:', 120, yPos + 9);
    doc.setFontSize(12);
    doc.setTextColor(saldoColor[0], saldoColor[1], saldoColor[2]);
    doc.text(formatCurrency(saldoFinal), 190, yPos + 9, { align: 'right' });

    // ===== RODAPÉ =====
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(7, 16, 41);
      doc.rect(0, 282, 210, 15, 'F');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('PEPERAIO - Comunicação Visual', 105, 290, { align: 'center' });
      doc.text(`Página ${i} de ${pageCount}`, 190, 290, { align: 'right' });
    }

    // Usar função de download otimizada para mobile
    await downloadPDFMobile(doc, 'extrato-caixa.pdf');
  }
  
  function renderTransacoes(lista: Transacao[]) {
    if (!lista.length) {
      return (
        <div className="caixa-empty-state">Nenhuma transação encontrada.</div>
      );
    }
    return (
      <div className="caixa-transactions-list">
        {getPaginatedTransacoes(lista).map((transacao: Transacao) => (
          <div key={transacao.id} className={`caixa-transaction-card ${transacao.tipo}`}>
            <div className="caixa-transaction-content">
              <div className="caixa-transaction-info">
                <span className="caixa-transaction-date">
                  {new Date(transacao.data.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                </span>
                <div className="caixa-transaction-details">
                  {transacao.origem} - {transacao.categoria}
                </div>
                <div className={`caixa-transaction-value ${transacao.tipo}`}>
                  {transacao.tipo === 'entrada' ? '+' : '-'}{formatCurrency(transacao.valor)}
                </div>
                {transacao.observacao && (
                  <div className="caixa-transaction-obs">{transacao.observacao}</div>
                )}
              </div>
              {canDelete && (
                <div className="caixa-transaction-actions">
                  <button
                    className="caixa-delete-btn"
                    title="Excluir lançamento"
                    onClick={() => handleDeleteTransacao(transacao.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Função para excluir transação
  function handleDeleteTransacao(id: string) {
    if (!canDelete) return;
    setDeleteJustificativaDialog({ isOpen: true, id, justificativa: '' });
  }

  async function confirmDelete() {
    if (!deleteJustificativaDialog.id || !deleteJustificativaDialog.justificativa.trim()) {
      toast.error('Por favor, informe o motivo da exclusão!');
      return;
    }
    
    const transacaoParaExcluir = transacoes.find(t => t.id === deleteJustificativaDialog.id);
    if (!transacaoParaExcluir) {
      toast.error('Transação não encontrada!');
      return;
    }

    // Salva no histórico antes de excluir (com justificativa)
    const dadosHistorico = {
      tipo: transacaoParaExcluir.tipo,
      valor: transacaoParaExcluir.valor,
      origem: transacaoParaExcluir.origem,
      data: transacaoParaExcluir.data,
      observacao: transacaoParaExcluir.observacao,
      categoria: transacaoParaExcluir.categoria,
      data_exclusao: new Date().toISOString(),
      motivo_exclusao: deleteJustificativaDialog.justificativa,
    };
    
    const { error: historicoError } = await supabase
      .from('transacoes_excluidas')
      .insert(dadosHistorico);

    if (historicoError) {
      console.error('Erro ao salvar no histórico:', historicoError);
      toast.error('Erro ao salvar no histórico: ' + historicoError.message);
      return;
    }

    // Exclui a transação
    const { error } = await supabase.from('transacoes').delete().eq('id', deleteJustificativaDialog.id);
    if (!error) {
      loadTransacoes();
      loadHistorico();
      toast.success('Transação removida e salva no histórico!');
    } else {
      toast.error('Erro ao remover transação!');
    }

    setDeleteJustificativaDialog({ isOpen: false, id: null, justificativa: '' });
  }

  function cancelDelete() {
    setDeleteJustificativaDialog({ isOpen: false, id: null, justificativa: '' });
  }

  // Função para excluir permanentemente do histórico
  function handleDeleteHistorico(id: string) {
    console.log('handleDeleteHistorico chamado com ID:', id);
    setConfirmDeleteHistoricoDialog({ isOpen: true, id });
  }

  async function confirmDeleteHistorico() {
    console.log('confirmDeleteHistorico chamado');
    console.log('Estado atual:', confirmDeleteHistoricoDialog);
    
    if (!confirmDeleteHistoricoDialog.id) {
      console.log('ID não encontrado, abortando');
      return;
    }

    console.log('Tentando excluir ID:', confirmDeleteHistoricoDialog.id);
    
    try {
      const { error, status } = await supabase
        .from('transacoes_excluidas')
        .delete()
        .eq('id', confirmDeleteHistoricoDialog.id);

      console.log('Status da exclusão:', status);
      console.log('Erro:', error);

      if (!error) {
        console.log('Exclusão bem-sucedida, aguardando um momento...');
        
        // Aguarda um pouco para garantir que o banco processou a exclusão
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Atualiza o estado localmente removendo o item
        setHistorico(prev => {
          const novoHistorico = prev.filter(item => item.id !== confirmDeleteHistoricoDialog.id);
          console.log('Histórico atualizado localmente. Itens restantes:', novoHistorico.length);
          return novoHistorico;
        });
        
        // Depois recarrega do banco para garantir sincronização
        setTimeout(() => {
          console.log('Recarregando do banco de dados...');
          loadHistorico();
        }, 500);
        
        toast.success('Registro excluído permanentemente do histórico!');
      } else {
        console.error('Erro ao excluir do histórico:', error);
        toast.error('Erro ao excluir registro do histórico!');
      }
    } catch (err) {
      console.error('Exceção ao excluir:', err);
      toast.error('Erro ao excluir registro do histórico!');
    }

    setConfirmDeleteHistoricoDialog({ isOpen: false, id: null });
  }

  function cancelDeleteHistorico() {
    setConfirmDeleteHistoricoDialog({ isOpen: false, id: null });
  }

  // Função para reverter exclusão do histórico
  async function handleReverterExclusao(transacaoExcluida: TransacaoExcluida) {
    if (!canCreate) {
      toast.error('Você não tem permissão para restaurar transações!');
      return;
    }

    try {
      // Remove campos específicos do histórico antes de reinserir
      const { id, data_exclusao, motivo_exclusao, excluido_por, created_at, ...transacaoRestaurada } = transacaoExcluida;

      // Reinsere a transação na tabela principal (sem id para gerar novo)
      const { error: insertError } = await supabase
        .from('transacoes')
        .insert({
          ...transacaoRestaurada,
          arquivado: false // Garantir que volta como não arquivada
        });

      if (insertError) {
        console.error('Erro ao restaurar transação:', insertError);
        toast.error('Erro ao restaurar transação!');
        return;
      }

      // Remove do histórico
      const { error: deleteError } = await supabase
        .from('transacoes_excluidas')
        .delete()
        .eq('id', transacaoExcluida.id);

      if (deleteError) {
        console.error('Erro ao remover do histórico:', deleteError);
        toast.error('Transação restaurada, mas erro ao limpar histórico!');
      }

      // Recarrega ambas as listas
      loadTransacoes();
      loadHistorico();
      toast.success('Transação restaurada com sucesso!');
    } catch (error) {
      console.error('Erro ao reverter exclusão:', error);
      toast.error('Erro ao reverter exclusão!');
    }
  }

  // Função para calcular total de páginas
  function getTotalPages(lista: Transacao[]) {
    return Math.max(1, Math.ceil(lista.length / ITEMS_PER_PAGE));
  }

  // Renderização dos controles de paginação
  function renderPagination(lista: Transacao[]) {
    const totalPages = getTotalPages(lista);
    if (totalPages <= 1) return null;
    return (
      <div className="caixa-pagination">
        <button
          className="caixa-pagination-btn"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="caixa-pagination-info">Página {currentPage} de {totalPages}</span>
        <button
          className="caixa-pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // Variáveis de escopo para os componentes
  const entradas = filtrarTransacoes('entrada');
  const saidas = filtrarTransacoes('saida');
  const todasTransacoes = filtrarTransacoes();
  const totalEntradas = calcularTotalEntradas();
  const totalSaidas = calcularTotalSaidas();
  const getCategoriasDisponiveis = (tipo: 'entrada' | 'saida') => {
    return categorias.filter((c) => c.tipo === tipo || c.tipo === 'ambos');
  };

  return (
    <div className="caixa-container">
      {/* Cards de resumo financeiro - Apenas no modo Caixa */}
      {viewMode === 'caixa' && (
        <div className="caixa-summary-grid">
          <div className="caixa-summary-card saldo">
            <div className="caixa-summary-header">
              <span className="caixa-summary-label">Saldo do Caixa</span>
            <div className="caixa-summary-icon blue">
              <Wallet />
            </div>
          </div>
          <div className={`caixa-summary-value ${calcularSaldo() < 0 ? 'red' : ''}`}>
            {formatCurrency(calcularSaldo())}
          </div>
        </div>
        
        <div className="caixa-summary-card receber">
          <div className="caixa-summary-header">
            <span className="caixa-summary-label">Total a Receber</span>
            <div className="caixa-summary-icon green">
              <TrendingUp />
            </div>
          </div>
          <div className="caixa-summary-value green">{formatCurrency(totalReceber)}</div>
        </div>
        
        <div className="caixa-summary-card dividas">
          <div className="caixa-summary-header">
            <span className="caixa-summary-label">Dívidas Ativas</span>
            <div className="caixa-summary-icon red">
              <Minus />
            </div>
          </div>
          <div className="caixa-summary-value red">{formatCurrency(dividasAtivas)}</div>
        </div>
      </div>
      )}

      <div className="caixa-header">
        <div className="caixa-header-content">
          <h1>
            {viewMode === 'caixa' && 'Caixa'}
            {viewMode === 'historico' && 'Histórico de Exclusões'}
            {viewMode === 'arquivos' && 'Arquivos'}
          </h1>
          <p>
            {viewMode === 'caixa' && 'Controle de fluxo financeiro'}
            {viewMode === 'historico' && 'Transações excluídas do sistema'}
            {viewMode === 'arquivos' && 'Transações organizadas por mês'}
          </p>
        </div>
        <div className="caixa-header-actions">
          {viewMode !== 'caixa' && (
            <button 
              className="caixa-btn caixa-btn-outline" 
              onClick={() => setViewMode('caixa')}
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar ao Caixa
            </button>
          )}
          {viewMode === 'caixa' && (
            <>
              <button 
                className="caixa-btn caixa-btn-outline" 
                onClick={() => setViewMode('historico')}
              >
                <History className="h-4 w-4" />
                Histórico ({historico.length})
              </button>
              <button 
                className="caixa-btn caixa-btn-outline" 
                onClick={() => setViewMode('arquivos')}
              >
                <Archive className="h-4 w-4" />
                Arquivos ({arquivos.length})
              </button>
              <button className="caixa-btn caixa-btn-outline" onClick={exportarExtrato}>
                <FileDown className="h-4 w-4" />
                Exportar
              </button>
            </>
          )}
          {canCreate && viewMode === 'caixa' && (
            <>
              <Dialog open={isEntradaDialogOpen} onOpenChange={setIsEntradaDialogOpen}>
                <DialogTrigger asChild>
                  <button className="caixa-btn caixa-btn-entrada">
                    <Plus className="h-4 w-4" />
                    Entrada
                  </button>
                </DialogTrigger>
                <DialogContent className="caixa-dialog-content">
                  <DialogHeader>
                    <DialogTitle className="caixa-dialog-title">Cadastrar Entrada</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEntradaSubmit} className="caixa-form">
                    <div className="caixa-form-field">
                      <label>Valor</label>
                      <input
                        type="number"
                        step="0.01"
                        value={entradaFormData.valor}
                        onChange={(e) => setEntradaFormData({ ...entradaFormData, valor: e.target.value })}
                        required
                      />
                    </div>
                    <div className="caixa-form-field">
                      <label>Origem</label>
                      <input
                        value={entradaFormData.origem}
                        onChange={(e) => setEntradaFormData({ ...entradaFormData, origem: e.target.value })}
                        required
                      />
                    </div>
                    <div className="caixa-form-field">
                      <label>Data</label>
                      <input
                        type="date"
                        value={entradaFormData.data}
                        onChange={(e) => setEntradaFormData({ ...entradaFormData, data: e.target.value })}
                        required
                      />
                    </div>
                    <div className="caixa-form-field">
                      <label>Categoria</label>
                      <Select
                        value={entradaFormData.categoria}
                        onValueChange={(value: string) =>
                          setEntradaFormData({ ...entradaFormData, categoria: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {getCategoriasDisponiveis('entrada').map((cat) => (
                            <SelectItem key={cat.id} value={cat.nome}>
                              {cat.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="caixa-form-field">
                      <label>Observação (opcional)</label>
                      <textarea
                        value={entradaFormData.observacao}
                        onChange={(e) =>
                          setEntradaFormData({ ...entradaFormData, observacao: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                    <button type="submit" className="caixa-btn caixa-btn-primary">
                      Registrar Entrada
                    </button>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isSaidaDialogOpen} onOpenChange={setIsSaidaDialogOpen}>
                <DialogTrigger asChild>
                  <button className="caixa-btn caixa-btn-saida">
                    <Minus className="h-4 w-4" />
                    Saída
                  </button>
                </DialogTrigger>
                <DialogContent className="caixa-dialog-content">
                  <DialogHeader>
                    <DialogTitle className="caixa-dialog-title">Cadastrar Saída</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaidaSubmit} className="caixa-form">
                    <div className="caixa-form-field">
                      <label>Valor</label>
                      <input
                        type="number"
                        step="0.01"
                        value={saidaFormData.valor}
                        onChange={(e) => setSaidaFormData({ ...saidaFormData, valor: e.target.value })}
                        required
                      />
                    </div>
                    <div className="caixa-form-field">
                      <label>Destino</label>
                      <input
                        value={saidaFormData.origem}
                        onChange={(e) => setSaidaFormData({ ...saidaFormData, origem: e.target.value })}
                        required
                      />
                    </div>
                    <div className="caixa-form-field">
                      <label>Data</label>
                      <input
                        type="date"
                        value={saidaFormData.data}
                        onChange={(e) => setSaidaFormData({ ...saidaFormData, data: e.target.value })}
                        required
                      />
                    </div>
                    <div className="caixa-form-field">
                      <label>Categoria</label>
                      <Select
                        value={saidaFormData.categoria}
                        onValueChange={(value: string) =>
                          setSaidaFormData({ ...saidaFormData, categoria: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {getCategoriasDisponiveis('saida').map((cat) => (
                            <SelectItem key={cat.id} value={cat.nome}>
                              {cat.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="caixa-form-field">
                      <label>Observação (opcional)</label>
                      <textarea
                        value={saidaFormData.observacao}
                        onChange={(e) =>
                          setSaidaFormData({ ...saidaFormData, observacao: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                    <button type="submit" className="caixa-btn caixa-btn-primary">
                      Registrar Saída
                    </button>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={isCategoriaDialogOpen} onOpenChange={setIsCategoriaDialogOpen}>
                <DialogTrigger asChild>
                  <button className="caixa-btn caixa-btn-outline">
                    <Tag className="h-4 w-4" />
                    Categorias
                  </button>
                </DialogTrigger>
                <DialogContent className="caixa-dialog-content large">
                  <DialogHeader>
                    <DialogTitle className="caixa-dialog-title">Gerenciar Categorias</DialogTitle>
                  </DialogHeader>
                  <div>
                    <form onSubmit={handleCategoriaSubmit} className="caixa-categoria-form">
                      <h3>Nova Categoria</h3>
                      <div className="caixa-categoria-grid">
                        <div className="caixa-form-field">
                          <label>Nome</label>
                          <input
                            value={categoriaFormData.nome}
                            onChange={(e) =>
                              setCategoriaFormData({ ...categoriaFormData, nome: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="caixa-form-field">
                          <label>Tipo</label>
                          <Select
                            value={categoriaFormData.tipo}
                            onValueChange={(value: 'entrada' | 'saida' | 'ambos') =>
                              setCategoriaFormData({ ...categoriaFormData, tipo: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="entrada">Entrada</SelectItem>
                              <SelectItem value="saida">Saída</SelectItem>
                              <SelectItem value="ambos">Ambos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <button type="submit" className="caixa-btn caixa-btn-primary">
                        Adicionar Categoria
                      </button>
                    </form>
                    <div className="caixa-categorias-list">
                      {categorias.map((categoria) => (
                        <div key={categoria.id} className="caixa-categoria-item">
                          <div className="caixa-categoria-info">
                            <h4>{categoria.nome}</h4>
                            <p>
                              {categoria.tipo === 'ambos' ? 'Entrada e Saída' : categoria.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                            </p>
                          </div>
                          {canDelete && (
                            <button
                              className="caixa-delete-btn"
                              onClick={() => handleDeleteCategoria(categoria.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Filtros e Tabs - Apenas no modo Caixa */}
      {viewMode === 'caixa' && (
        <>
          {/* Filtro */}
          <div className="caixa-filter-card">
            <div className="caixa-filter-buttons">
          <button
            className={`caixa-btn ${filtroTipo === 'data' ? 'caixa-btn-primary' : 'caixa-btn-outline'}`}
            onClick={() => {
              setFiltroTipo('data');
              setFiltroMes('');
              setCurrentPage(1);
            }}
          >
            Filtrar por Data
          </button>
          <button
            className={`caixa-btn ${filtroTipo === 'mes' ? 'caixa-btn-primary' : 'caixa-btn-outline'}`}
            onClick={() => {
              setFiltroTipo('mes');
              setFiltroData('');
              setCurrentPage(1);
            }}
          >
            Filtrar por Mês
          </button>
        </div>

        <div className="caixa-filter-inputs">
          {filtroTipo === 'data' && (
            <div className="caixa-filter-field">
              <label>Filtrar a partir de:</label>
              <input
                type="date"
                value={filtroData}
                onChange={(e) => {
                  setFiltroData(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}

          {filtroTipo === 'mes' && (
            <div className="caixa-filter-field">
              <label>Selecione o mês:</label>
              <input
                type="month"
                value={filtroMes}
                onChange={(e) => {
                  setFiltroMes(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}

          {(filtroData || filtroMes) && (
            <button
              className="caixa-btn caixa-btn-outline"
              onClick={() => {
                setFiltroData('');
                setFiltroMes('');
                setCurrentPage(1);
              }}
            >
              Limpar Filtro
            </button>
          )}
        </div>
      </div>

      {/* Tabs com paginação */}
      <div className="caixa-tabs">
        <Tabs defaultValue="todas" className="w-full" onValueChange={() => setCurrentPage(1)}>
          <TabsList className="caixa-tabs-list">
            <TabsTrigger value="todas" className="caixa-tab-trigger">Todas</TabsTrigger>
            <TabsTrigger value="entradas" className="caixa-tab-trigger">
              Entradas ({entradas.length})
            </TabsTrigger>
            <TabsTrigger value="saidas" className="caixa-tab-trigger">
              Saídas ({saidas.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="todas" className="space-y-4">
            {renderTransacoes(todasTransacoes)}
            {renderPagination(todasTransacoes)}
          </TabsContent>
          <TabsContent value="entradas" className="space-y-4">
            {renderTransacoes(entradas)}
            {renderPagination(entradas)}
          </TabsContent>
          <TabsContent value="saidas" className="space-y-4">
            {renderTransacoes(saidas)}
            {renderPagination(saidas)}
          </TabsContent>
        </Tabs>
      </div>
        </>
      )}

      {/* Visualização de Histórico */}
      {viewMode === 'historico' && (
        <div className="caixa-historico">
          {historico.length === 0 ? (
            <div className="caixa-empty">
              <History size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <p>Nenhum item excluído ainda</p>
            </div>
          ) : (
            <div className="caixa-historico-list">
                {historico.map((item) => (
                  <div key={item.id} className="caixa-historico-item">
                    <div className="caixa-historico-header">
                      <span className={`caixa-historico-tipo ${item.tipo}`}>
                        {item.tipo === 'entrada' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {item.tipo.toUpperCase()}
                      </span>
                      <span className="caixa-historico-data-exclusao">
                        Excluído em: {new Date(item.data_exclusao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="caixa-historico-content">
                      <div>
                        <strong>{item.origem}</strong>
                        {item.categoria && <span className="caixa-tag">{item.categoria}</span>}
                        <p className="caixa-historico-obs">{item.observacao}</p>
                        {item.motivo_exclusao && (
                          <p className="caixa-historico-motivo">
                            <strong>Motivo:</strong> {item.motivo_exclusao}
                          </p>
                        )}
                        <small>Data original: {new Date(item.data).toLocaleDateString('pt-BR')}</small>
                      </div>
                      <div className="caixa-historico-valor">
                        {formatCurrency(item.valor)}
                      </div>
                    </div>
                    <div className="caixa-historico-actions">
                      <button
                        className="caixa-btn-reverter"
                        onClick={() => handleReverterExclusao(item)}
                        title="Restaurar transação"
                      >
                        <RotateCcw size={16} />
                        Reverter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Visualização de Arquivos */}
      {viewMode === 'arquivos' && (
        <CaixaArquivos 
          arquivos={arquivos} 
          onReload={() => {
            loadTransacoes();
            loadArquivos();
          }} 
        />
      )}

      {/* Diálogo de Justificativa de Exclusão */}
      <Dialog open={deleteJustificativaDialog.isOpen} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent className="caixa-dialog-justificativa">
          <div className="caixa-dialog-header">
            <h2 className="caixa-dialog-title">
              <AlertTriangle size={24} />
              Justificar Exclusão
            </h2>
          </div>
          <div className="caixa-justificativa-content">
            <p className="caixa-justificativa-message">
              ⚠️ Por favor, informe o motivo da exclusão desta transação.
              Ela será movida para o histórico com a justificativa registrada.
            </p>
            <div className="space-y-2">
              <Label htmlFor="motivo-exclusao" style={{ color: '#cbd5e1', fontWeight: 600 }}>
                Motivo da Exclusão *
              </Label>
              <Textarea
                id="motivo-exclusao"
                placeholder="Ex: Lançamento duplicado, erro de digitação, pagamento cancelado, etc..."
                value={deleteJustificativaDialog.justificativa}
                onChange={(e) => setDeleteJustificativaDialog(prev => ({ ...prev, justificativa: e.target.value }))}
                rows={5}
                className="caixa-textarea-justificativa"
              />
            </div>
          </div>
          <div className="caixa-justificativa-actions">
            <button
              type="button"
              onClick={cancelDelete}
              className="caixa-btn-cancel"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="caixa-btn-confirm-delete"
              disabled={!deleteJustificativaDialog.justificativa.trim()}
            >
              <Trash2 size={18} />
              Confirmar Exclusão
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão Permanente */}
      <ConfirmDialog
        isOpen={confirmDeleteHistoricoDialog.isOpen}
        title="Excluir Permanentemente"
        message="Tem certeza que deseja excluir este registro permanentemente? Esta ação não pode ser desfeita!"
        onConfirm={confirmDeleteHistorico}
        onCancel={cancelDeleteHistorico}
        confirmText="Sim, excluir permanentemente"
        cancelText="Cancelar"
      />
    </div>
  );
}
