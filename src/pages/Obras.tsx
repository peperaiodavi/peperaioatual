import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../utils/supabaseClient';
import { usePermissao } from '../context/PermissaoContext';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, FileDown, CheckCircle, DollarSign, Link2, Send } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import jsPDF from 'jspdf';
import './Obras.css';
import { useCardsDeObra } from '../hooks/useCardsDeObra';
import type { CardDeObra } from '../types/financeiro';

// Função auxiliar para detectar mobile
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Função auxiliar para download de PDF em mobile
const downloadPDFMobile = async (doc: jsPDF, filename: string) => {
  console.log('downloadPDFMobile iniciado (Obras)', { isMobile: isMobileDevice() });
  
  try {
    if (isMobileDevice()) {
      console.log('Dispositivo mobile detectado');
      // Mobile: sempre usa compartilhamento
      const blob = doc.output('blob');
      console.log('PDF gerado como blob', { size: blob.size });
      
      const file = new File([blob], filename, { type: 'application/pdf' });
      console.log('File criado', { name: file.name, type: file.type, size: file.size });
      
      if (navigator.share) {
        console.log('Web Share API disponível');
        try {
          await navigator.share({
            files: [file],
            title: 'Relatório de Obra',
            text: 'Relatório de gastos gerado pelo sistema PEPERAIO'
          });
          console.log('Compartilhamento bem-sucedido');
          toast.success('PDF compartilhado com sucesso!');
        } catch (error: any) {
          console.error('Erro no compartilhamento:', error);
          // Se usuário cancelar, não mostra erro
          if (error.name !== 'AbortError') {
            toast.error('Erro ao compartilhar PDF');
          } else {
            console.log('Usuário cancelou o compartilhamento');
          }
        }
      } else {
        console.log('Web Share API não disponível, usando fallback');
        // Fallback: abre em nova aba se Web Share API não disponível
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        
        if (newWindow) {
          toast.info('PDF aberto em nova aba');
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        } else {
          // Se popup foi bloqueado, tenta download direto
          console.log('Popup bloqueado, tentando download');
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('PDF baixado');
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
      }
    } else {
      console.log('Desktop detectado, usando download padrão');
      // Desktop: download tradicional
      doc.save(filename);
      toast.success('PDF exportado com sucesso!');
    }
  } catch (error) {
    console.error('Erro fatal ao exportar PDF:', error);
    toast.error('Erro ao exportar PDF. Tente novamente.');
  }
};

// Define as interfaces corretas para Obras
interface Gasto {
  id: string;
  obra_id: string;
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  url_comprovante?: string;
}

interface Obra {
  id: string;
  nome: string;
  orcamento: number;
  gastos: Gasto[];
  lucro: number;
  finalizada: boolean;
  valor_recebido?: number;
  cardVinculado?: CardDeObra | null;
}

// O nome do componente deve ser Obras
export default function Obras() {
  const { canEdit, canDelete, canCreate, isAdmin } = usePermissao();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [isObraDialogOpen, setIsObraDialogOpen] = useState(false);
  const [isGastoDialogOpen, setIsGastoDialogOpen] = useState(false);
  const [isPagamentoDialogOpen, setIsPagamentoDialogOpen] = useState(false);
  const [selectedObra, setSelectedObra] = useState<string | null>(null);
  const [selectedObraForPayment, setSelectedObraForPayment] = useState<Obra | null>(null);
  const [editingGasto, setEditingGasto] = useState<{ obraId: string; gasto: Gasto } | null>(null);
  const [obraFormData, setObraFormData] = useState({
    nome: '',
    orcamento: '',
  });
  const [gastoFormData, setGastoFormData] = useState({
    categoria: '',
    descricao: '',
    valor: '',
  });
  const [pagamentoValue, setPagamentoValue] = useState('');
  // Gestão: integração com cards de obra
  const { transferirVerba } = useCardsDeObra();
  const [isVerbaDialogOpen, setIsVerbaDialogOpen] = useState(false);
  const [obraParaVerba, setObraParaVerba] = useState<{ obra: Obra; card: CardDeObra } | null>(null);
  const [verbaValue, setVerbaValue] = useState('');
  // Estados para finalização de obra
  const [isFinalizacaoDialogOpen, setIsFinalizacaoDialogOpen] = useState(false);
  const [selectedObraForFinalization, setSelectedObraForFinalization] = useState<Obra | null>(null);
  const [valorRestanteFinalizacao, setValorRestanteFinalizacao] = useState('');
  // Estado para aba ativa (Lista de Obras ou Analytics)
  const [activeTab, setActiveTab] = useState<'obras' | 'analytics'>('obras');
  // Estados para confirmação de exclusão e finalização
  const [confirmDeleteObraId, setConfirmDeleteObraId] = useState<string | null>(null);
  const [obraToDelete, setObraToDelete] = useState<Obra | null>(null);

  useEffect(() => {
    loadObras();
  }, []);

  const loadObras = async () => {
    setLoading(true);
    // Busca obras e seus gastos relacionados
    const { data: obrasData, error } = await supabase
      .from('obras')
      .select('*, gastos_obra(*)'); // Busca aninhada
      
    if (error) {
      toast.error('Erro ao buscar obras!');
      setLoading(false);
      return;
    }
    const obrasBase = (obrasData || []).map((obra: any) => ({
      ...obra,
      gastos: obra.gastos_obra || [],
      cardVinculado: null,
    }));

    // Integra despesas e cards vinculados às obras
    try {
      const titulosObras = obrasBase.map((o: any) => o.nome).filter(Boolean);
      if (titulosObras.length > 0) {
        const { data: cards, error: cardsErr } = await supabase
          .from('cards_de_obra')
          .select('*')
          .in('titulo', titulosObras);

        if (cardsErr) throw cardsErr;

        const cardsPorTitulo = new Map<string, CardDeObra[]>();
        const cardIdParaTitulo = new Map<string, string>();

        (cards || []).forEach((card: CardDeObra) => {
          if (!card.titulo) return;
          const titulo = card.titulo;
          const lista = cardsPorTitulo.get(titulo) || [];
          lista.push(card);
          cardsPorTitulo.set(titulo, lista);
          cardIdParaTitulo.set(card.id_card, titulo);
        });

        obrasBase.forEach((obra: any) => {
          const cardsObra = cardsPorTitulo.get(obra.nome) || [];
          if (cardsObra.length > 0) {
            const cardAtivo = cardsObra.find(
              (c) => c.status !== 'FINALIZADO' && c.status !== 'CANCELADO'
            ) || cardsObra[0];
            obra.cardVinculado = cardAtivo;
          }
        });

        const cardIds = Array.from(cardIdParaTitulo.keys());

        if (cardIds.length > 0) {
          const { data: despesasCards, error: despErr } = await supabase
            .from('despesas_de_obra')
            .select('id, id_card, descricao, valor, data, status, categorias_de_gasto(nome), url_comprovante')
            .in('id_card', cardIds)
            .eq('status', 'APROVADO');

          if (despErr) throw despErr;

          const gastosPorTitulo = new Map<string, Array<Gasto>>();

          (despesasCards || []).forEach((despesa: any) => {
            const tituloObra = cardIdParaTitulo.get(despesa.id_card);
            if (!tituloObra) return;
            
            // IMPORTANTE: Na página Obras, NÃO filtramos as verbas transferidas
            // Elas devem aparecer como gastos aqui para o admin ver o investimento total
            const lista = gastosPorTitulo.get(tituloObra) || [];
            lista.push({
              id: despesa.id,
              obra_id: '',
              categoria: despesa.categorias_de_gasto?.nome || 'Despesa',
              descricao: despesa.descricao,
              valor: Number(despesa.valor) || 0,
              data: despesa.data,
              url_comprovante: despesa.url_comprovante,
            });
            gastosPorTitulo.set(tituloObra, lista);
          });

          obrasBase.forEach((obra: any) => {
            const extras = gastosPorTitulo.get(obra.nome) || [];
            obra.gastos = [...(obra.gastos || []), ...extras];
          });
        }
      }
    } catch (mergeErr) {
      console.warn('Aviso: não foi possível integrar despesas dos cards na página Obras:', mergeErr);
    }

    setObras(obrasBase);
    setLoading(false);
  };

  const handleDeleteObra = async () => {
    if (!canDelete || !confirmDeleteObraId) return;
    const { error } = await supabase.from('obras').delete().eq('id', confirmDeleteObraId);
    if (!error) {
      setObras((prev) => prev.filter((o) => o.id !== confirmDeleteObraId));
      toast.success('Obra apagada com sucesso!');
      setConfirmDeleteObraId(null);
      setObraToDelete(null);
    } else {
      toast.error('Erro ao apagar obra!');
    }
  };

  const handleEnviarVerba = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!obraParaVerba?.card) return;

    const valorNormalizado = verbaValue.replace(',', '.');
    const valor = parseFloat(valorNormalizado);

    if (isNaN(valor) || valor <= 0) {
      toast.error('Informe um valor válido para enviar a verba');
      return;
    }

    try {
      await transferirVerba(obraParaVerba.card, valor);
      setIsVerbaDialogOpen(false);
      setObraParaVerba(null);
      setVerbaValue('');
      await loadObras();
    } catch (error) {
      console.error('Erro ao enviar verba:', error);
      toast.error('Erro ao enviar verba');
    }
  };

  // Função para criar/editar OBRA
  const handleObraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;

    const { data, error } = await supabase.from('obras').insert({
      nome: obraFormData.nome,
      orcamento: parseFloat(obraFormData.orcamento),
      lucro: 0,
      finalizada: false,
    }).select();

    if (!error && data && data[0]) {
      loadObras(); // Recarrega do banco
      toast.success('Obra adicionada com sucesso!');
      setObraFormData({ nome: '', orcamento: '' });
      setIsObraDialogOpen(false);
    } else {
      toast.error('Erro ao adicionar obra!');
    }
  };
  
  // Função para criar/editar GASTO
  const handleGastoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !selectedObra) return;

    // --- VALIDAÇÃO DO VALOR ---
    const valorNumerico = parseFloat(gastoFormData.valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error('Por favor, insira um valor numérico válido e positivo.');
      return;
    }
    // --- FIM DA VALIDAÇÃO ---

    if (editingGasto) {
      // Atualiza gasto
      const valorAntigo = editingGasto.gasto.valor;
      const diferenca = valorNumerico - valorAntigo;

      const { error } = await supabase
        .from('gastos_obra')
        .update({
          categoria: gastoFormData.categoria,
          descricao: gastoFormData.descricao,
          valor: valorNumerico, // <-- Usa variável validada
        })
        .eq('id', editingGasto.gasto.id);
      
      if (!error) {
        loadObras();
        toast.success('Gasto atualizado com sucesso!');
        setEditingGasto(null);
      } else {
        toast.error('Erro ao atualizar gasto!');
      }
    } else {
      // Adiciona novo gasto
      const dataAtual = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('gastos_obra')
        .insert({
          obra_id: selectedObra,
          categoria: gastoFormData.categoria,
          descricao: gastoFormData.descricao,
          valor: valorNumerico,
          data: dataAtual,
        });
      
      if (!error) {
        // Busca o nome da obra para registrar no caixa
        const obraAtual = obras.find(o => o.id === selectedObra);
        const nomeObra = obraAtual ? obraAtual.nome : 'Obra';
        
        // Registra saída no caixa
        const { error: errorCaixa } = await supabase
          .from('transacoes')
          .insert({
            tipo: 'saida',
            valor: valorNumerico,
            origem: `${nomeObra} - ${gastoFormData.categoria}`,
            data: dataAtual,
            observacao: gastoFormData.descricao,
          });
        
        if (errorCaixa) {
          console.error('Erro ao registrar no caixa:', errorCaixa);
          toast.warning('Gasto adicionado, mas não foi registrado no caixa');
        }
        
        loadObras();
        toast.success('Gasto adicionado e registrado no caixa!');
      } else {
        toast.error('Erro ao adicionar gasto!');
      }
    }
    setGastoFormData({ categoria: '', descricao: '', valor: '' });
    setIsGastoDialogOpen(false);
    setSelectedObra(null);
  };


  const handleEditGasto = (obraId: string, gasto: Gasto) => {
    if (!canEdit) return;
    setEditingGasto({ obraId, gasto });
    setSelectedObra(obraId);
    setGastoFormData({
      categoria: gasto.categoria,
      descricao: gasto.descricao,
      valor: gasto.valor.toString(),
    });
    setIsGastoDialogOpen(true);
  };

  const handleDeleteGasto = async (obraId: string, gastoId: string) => {
    if (!canDelete) return;
    
    // Busca informações do gasto antes de deletar
    const obra = obras.find(o => o.id === obraId);
    const gasto = obra?.gastos.find(g => g.id === gastoId);
    
    const { error } = await supabase.from('gastos_obra').delete().eq('id', gastoId);
    
    if (!error) {
      // Remove a transação correspondente no caixa
      if (gasto && obra) {
        const { error: errorCaixa } = await supabase
          .from('transacoes')
          .delete()
          .eq('tipo', 'saida')
          .eq('origem', `${obra.nome} - ${gasto.categoria}`)
          .eq('valor', gasto.valor)
          .eq('data', gasto.data);

        if (errorCaixa) {
          console.error('Erro ao remover do caixa:', errorCaixa);
          toast.warning('Gasto removido da obra, mas não foi removido do caixa');
        }
      }
      
      loadObras();
      toast.success('Gasto removido da obra e do caixa!');
    } else {
      toast.error('Erro ao remover gasto!');
    }
  };

  // Função para registrar pagamento parcial da obra
  const handlePagamentoObraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !selectedObraForPayment) return;

    const valorPagamento = parseFloat(pagamentoValue);
    
    if (isNaN(valorPagamento) || valorPagamento <= 0) {
      toast.error('Por favor, insira um valor válido');
      return;
    }

    const valorRecebidoAtual = selectedObraForPayment.valor_recebido || 0;
    const novoValorRecebido = valorRecebidoAtual + valorPagamento;

    if (novoValorRecebido > selectedObraForPayment.orcamento) {
      toast.error('O valor total de pagamentos não pode exceder o orçamento!');
      return;
    }

    // Atualiza o valor recebido na obra
    const { error: errorObra } = await supabase
      .from('obras')
      .update({ valor_recebido: novoValorRecebido })
      .eq('id', selectedObraForPayment.id);

    if (errorObra) {
      toast.error('Erro ao registrar pagamento');
      return;
    }

    // Registra entrada no caixa
    const { error: errorCaixa } = await supabase
      .from('transacoes')
      .insert({
        tipo: 'entrada',
        valor: valorPagamento,
        origem: `Recebimento Obra - ${selectedObraForPayment.nome}`,
        data: new Date().toISOString().split('T')[0],
        observacao: 'Pagamento parcial da obra',
      });

    if (errorCaixa) {
      toast.error('Erro ao registrar entrada no caixa');
      return;
    }

    await loadObras();
    // Atualiza o valor a receber na interface
    if (selectedObraForPayment) {
      const valorRecebidoAtualizado = (selectedObraForPayment.valor_recebido || 0) + valorPagamento;
      const aReceber = selectedObraForPayment.orcamento - valorRecebidoAtualizado;
      setSelectedObraForPayment({
        ...selectedObraForPayment,
        valor_recebido: valorRecebidoAtualizado,
      });
      toast.success(`Pagamento registrado! Falta receber: ${formatCurrency(aReceber)}`);
    } else {
      toast.success('Pagamento registrado com sucesso!');
    }
    setPagamentoValue('');
    setIsPagamentoDialogOpen(false);
    setSelectedObraForPayment(null);
  };

  const handleFinalizarObra = async (obra: Obra) => {
    if (!canEdit) return;
    
    // Abre o diálogo para digitar o valor restante
    setSelectedObraForFinalization(obra);
    setIsFinalizacaoDialogOpen(true);
  };

  const handleFinalizacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObraForFinalization) return;

    const valorRestanteNormalizado = valorRestanteFinalizacao.replace(',', '.');
    const valorRestante = parseFloat(valorRestanteNormalizado);

    if (isNaN(valorRestante) || valorRestante < 0) {
      toast.error('Informe um valor válido (pode ser 0 se já recebeu tudo)');
      return;
    }

    const obra = selectedObraForFinalization;
    const totalGastos = obra.gastos.reduce((acc: number, g: Gasto) => acc + g.valor, 0);
    const valorRecebido = (obra.valor_recebido || 0) + valorRestante;
    const lucro = valorRecebido - totalGastos; // Lucro real: o que recebeu menos os gastos
    
    // Atualiza obra como finalizada
    const { error } = await supabase
      .from('obras')
      .update({ 
        finalizada: true, 
        lucro,
        valor_recebido: valorRecebido
      })
      .eq('id', obra.id);

    if (!error) {
      // Lança no caixa apenas o valor restante que foi informado
      if (valorRestante > 0) {
        await supabase.from('transacoes').insert({
          tipo: 'entrada',
          valor: valorRestante,
          origem: `Obra Finalizada - ${obra.nome}`,
          data: new Date().toISOString().split('T')[0],
          observacao: 'Pagamento final da obra',
          categoria: 'Serviços Prestados',
        });
      }
      
      loadObras();
      toast.success(`Obra finalizada! Lucro total: ${formatCurrency(lucro)}${valorRestante > 0 ? ` | Entrada no caixa: ${formatCurrency(valorRestante)}` : ''}`);
      setIsFinalizacaoDialogOpen(false);
      setValorRestanteFinalizacao('');
      setSelectedObraForFinalization(null);
    } else {
      toast.error('Erro ao finalizar obra!');
    }
  };

  const exportarPDF = async (obra: Obra) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const totalGastos = obra.gastos.reduce((acc, g) => acc + g.valor, 0);
    const valorRecebido = obra.valor_recebido || 0;
    const lucroReal = valorRecebido - totalGastos;
    const lucroProjetado = obra.orcamento - totalGastos;
    const percentualGasto = obra.orcamento > 0 ? (totalGastos / obra.orcamento) * 100 : 0;
    const percentualRestante = 100 - percentualGasto;

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
    doc.text('RELATÓRIO DE GASTOS DA OBRA', 105, 30, { align: 'center' });

    // ===== INFORMAÇÕES DA OBRA =====
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
    doc.text(`Obra: ${obra.nome}`, 20, yPos);
    
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
    
    // Card 1 - Orçamento
    doc.setFillColor(21, 26, 46); // #151a2e - Fundo do card
    doc.setDrawColor(96, 165, 250); // #60a5fa - Borda azul
    doc.setLineWidth(1);
    doc.roundedRect(20, yPos, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(96, 165, 250); // #60a5fa - Label azul
    doc.text('ORÇAMENTO TOTAL', 22, yPos + 5);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(230, 238, 248); // #e6eef8 - Valor claro
    doc.text(formatCurrency(obra.orcamento), 22, yPos + 12);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // #94a3b8 - Texto secundário
    doc.text('Valor inicial aprovado', 22, yPos + 18);
    
    // Card 2 - Gastos
    doc.setFillColor(21, 26, 46); // #151a2e - Fundo do card
    doc.setDrawColor(248, 113, 113); // #f87171 - Borda vermelha
    doc.roundedRect(20 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(248, 113, 113); // #f87171 - Label vermelha
    doc.text('TOTAL GASTO', 22 + cardWidth + cardSpacing, yPos + 5);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(248, 113, 113); // #f87171 - Valor vermelho destaque
    doc.text(formatCurrency(totalGastos), 22 + cardWidth + cardSpacing, yPos + 12);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // #94a3b8 - Texto secundário
    doc.text(`${percentualGasto.toFixed(1)}% do orçamento`, 22 + cardWidth + cardSpacing, yPos + 18);
    
    // Card 3 - Lucro Real
    const lucroColor = lucroReal >= 0 ? [52, 211, 153] : [248, 113, 113]; // Verde ou vermelho
    doc.setFillColor(21, 26, 46); // #151a2e - Fundo do card
    doc.setDrawColor(lucroColor[0], lucroColor[1], lucroColor[2]); // Borda colorida
    doc.roundedRect(20 + (cardWidth + cardSpacing) * 2, yPos, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(lucroColor[0], lucroColor[1], lucroColor[2]); // Label colorida
    doc.text('LUCRO REAL', 22 + (cardWidth + cardSpacing) * 2, yPos + 5);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(lucroColor[0], lucroColor[1], lucroColor[2]); // Valor colorido destaque
    doc.text(formatCurrency(lucroReal), 22 + (cardWidth + cardSpacing) * 2, yPos + 12);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // #94a3b8 - Texto secundário
    doc.text(`Recebido - Gastos`, 22 + (cardWidth + cardSpacing) * 2, yPos + 18);

    // ===== GRÁFICO DE PROGRESSO =====
    yPos += 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(96, 165, 250); // Azul #60a5fa
    doc.text('PROGRESSO DE GASTOS', 20, yPos);
    
    yPos += 5;
    // Barra de progresso
    const barWidth = 140;
    const barHeight = 8;
    const barX = 20;
    
    // Fundo da barra
    doc.setFillColor(11, 18, 32); // #0b1220
    doc.roundedRect(barX, yPos, barWidth, barHeight, 2, 2, 'F');
    
    // Preenchimento da barra
    const fillWidth = (barWidth * percentualGasto) / 100;
    if (fillWidth > 0) {
      doc.setFillColor(248, 113, 113); // #f87171
      doc.roundedRect(barX, yPos, fillWidth, barHeight, 2, 2, 'F');
    }
    
    // Percentual ao lado
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(248, 113, 113);
    doc.text(`${percentualGasto.toFixed(1)}%`, barX + barWidth + 5, yPos + 6);

    // ===== TABELA DE GASTOS =====
    yPos += 18;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(96, 165, 250); // Azul #60a5fa
    doc.text('DETALHAMENTO DOS GASTOS', 20, yPos);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Total de ${obra.gastos.length} lançamento(s)`, 120, yPos);

    yPos += 7;
    
    // Cabeçalho da tabela
    doc.setFillColor(96, 165, 250); // #60a5fa
    doc.rect(15, yPos, 180, 10, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('DATA', 18, yPos + 6);
    doc.text('CATEGORIA', 42, yPos + 6);
    doc.text('DESCRIÇÃO', 80, yPos + 6);
    doc.text('VALOR', 170, yPos + 6);
    
    yPos += 10;

    // Linhas da tabela
    obra.gastos.forEach((gasto, idx) => {
      // Verifica se precisa adicionar nova página
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
        
        // Reaplica cabeçalho da tabela na nova página
        doc.setFillColor(96, 165, 250);
        doc.rect(15, yPos, 180, 10, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('DATA', 18, yPos + 6);
        doc.text('CATEGORIA', 42, yPos + 6);
        doc.text('DESCRIÇÃO', 80, yPos + 6);
        doc.text('VALOR', 170, yPos + 6);
        yPos += 10;
      }

      // Alterna cor de fundo
      if (idx % 2 === 0) {
        doc.setFillColor(26, 31, 58); // #1a1f3a
      } else {
        doc.setFillColor(21, 26, 46); // #151a2e
      }
      doc.rect(15, yPos, 180, 10, 'F');
      
      // Borda lateral colorida
      doc.setDrawColor(96, 165, 250);
      doc.setLineWidth(1);
      doc.line(15, yPos, 15, yPos + 10);
      
      // Conteúdo da linha
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(new Date(gasto.data.replace(/-/g, '/')).toLocaleDateString('pt-BR'), 18, yPos + 6);
      
      doc.setTextColor(167, 139, 250); // #a78bfa - roxo para categoria
      doc.setFont('helvetica', 'bold');
      doc.text(gasto.categoria.substring(0, 20), 42, yPos + 6);
      
      doc.setTextColor(230, 238, 248);
      doc.setFont('helvetica', 'normal');
      const descricaoTruncada = gasto.descricao.length > 40 ? gasto.descricao.substring(0, 37) + '...' : gasto.descricao;
      doc.text(descricaoTruncada, 80, yPos + 6);
      
      doc.setTextColor(248, 113, 113); // #f87171 - vermelho para valor
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(gasto.valor), 190, yPos + 6, { align: 'right' });
      
      yPos += 10;
    });

    // Linha de total
    yPos += 2;
    doc.setFillColor(7, 16, 41); // #071029
    doc.rect(15, yPos, 180, 12, 'F');
    doc.setDrawColor(96, 165, 250);
    doc.setLineWidth(2);
    doc.line(15, yPos, 195, yPos);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(230, 238, 248);
    doc.text('TOTAL DE GASTOS:', 18, yPos + 8);
    doc.setFontSize(11);
    doc.setTextColor(248, 113, 113);
    doc.text(formatCurrency(totalGastos), 190, yPos + 8, { align: 'right' });

    // ===== RODAPÉ =====
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(7, 16, 41);
      doc.rect(0, 282, 210, 15, 'F');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Peperaio Comunicação Visual', 15, 290);
      doc.text(`Página ${i} de ${pageCount}`, 195, 290, { align: 'right' });
    }

    // Usar função de download otimizada para mobile
    const filename = `relatorio-obra-${obra.nome.replace(/\s+/g, '-').toLowerCase()}-${new Date().getTime()}.pdf`;
    await downloadPDFMobile(doc, filename);
  };

  const obrasAtivas = obras.filter((o) => !o.finalizada);
  const obrasFinalizadas = obras.filter((o: Obra) => o.finalizada);

  const renderObraCard = (obra: Obra, index: number) => {
  const totalGastos = obra.gastos.reduce((acc: number, g: Gasto) => acc + g.valor, 0);
  const valorRecebido = obra.valor_recebido || 0;
  // Cálculos financeiros:
  // - Lucro Real = Valor Recebido - Gastos Totais
  // - Lucro Projetado = Orçamento - Gastos Totais (se receber todo o orçamento)
  // - A Receber do Cliente = Orçamento - Valor Recebido (quanto falta receber)
  const lucroReal = valorRecebido - totalGastos;
  const lucroProjetado = obra.orcamento - totalGastos;
  const aReceberDoCliente = obra.orcamento - valorRecebido;
  const cardVinculado = obra.cardVinculado ?? null;

    return (
      <div 
        key={obra.id} 
        className={`obras-card ${obra.finalizada ? 'finalizada' : ''}`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="obras-card-header">
          <div className="obras-card-title-section">
            <div className="obras-card-title-row">
              <h3 className="obras-card-title">{obra.nome}</h3>
              {cardVinculado && (
                <span className="obras-badge obras-badge-vinculada">
                  <Link2 className="h-3 w-3" />
                  Vinculada
                </span>
              )}
            </div>
            {obra.finalizada && (
              <div className="obras-badge">
                <CheckCircle />
                Finalizada
              </div>
            )}
          </div>
          <div className="obras-card-actions">
            <button
              className="obras-btn-icon export"
              onClick={() => exportarPDF(obra)}
              title="Exportar PDF"
            >
              <FileDown className="h-4 w-4" />
            </button>
            {!obra.finalizada && canEdit && (
              <button
                className="obras-btn-icon finish"
                onClick={() => handleFinalizarObra(obra)}
                title="Finalizar obra"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                className="obras-btn-icon delete"
                onClick={() => {
                  setConfirmDeleteObraId(obra.id);
                  setObraToDelete(obra);
                }}
                title="Excluir obra"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="obras-stats">
          <div className="obras-stat-item">
            <span className="obras-stat-label">Orçamento Total</span>
            <span className="obras-stat-value">{formatCurrency(obra.orcamento)}</span>
          </div>
          <div className="obras-stat-item">
            <span className="obras-stat-label">Total Gastos</span>
            <span className="obras-stat-value negative">{formatCurrency(totalGastos)}</span>
          </div>
          <div className="obras-stat-item">
            <span className="obras-stat-label">Valor Recebido</span>
            <span className="obras-stat-value positive">{formatCurrency(valorRecebido)}</span>
          </div>
          {!obra.finalizada && (
            <div className="obras-stat-item">
              <span className="obras-stat-label">A Receber do Cliente</span>
              <span className={`obras-stat-value ${aReceberDoCliente > 0 ? 'warning' : 'positive'}`}>
                {formatCurrency(aReceberDoCliente)}
              </span>
            </div>
          )}
          {obra.finalizada && (
            <div className="obras-stat-item">
              <span className="obras-stat-label">Lucro Final</span>
              <span className={`obras-stat-value ${lucroReal >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(lucroReal)}
              </span>
            </div>
          )}
          {cardVinculado && (
            <>
              <div className="obras-stat-item">
                <span className="obras-stat-label">Saldo Card Vinculado</span>
                <span className="obras-stat-value positive">{formatCurrency(cardVinculado.saldo_atual)}</span>
              </div>
              <div className="obras-stat-item">
                <span className="obras-stat-label">Gasto Card (Usuário)</span>
                <span className="obras-stat-value negative">{formatCurrency(cardVinculado.total_gasto)}</span>
              </div>
            </>
          )}
        </div>

        {!obra.finalizada && canCreate && (
          <button
            className="obras-btn obras-btn-pagamento"
            onClick={() => {
              setSelectedObraForPayment(obra);
              setIsPagamentoDialogOpen(true);
            }}
          >
            <DollarSign className="h-4 w-4" />
            Registrar Pagamento
          </button>
        )}

        {cardVinculado && isAdmin && !obra.finalizada && (
          <button
            className="obras-btn obras-btn-transfer"
            onClick={() => {
              setObraParaVerba({ obra, card: cardVinculado });
              setVerbaValue('');
              setIsVerbaDialogOpen(true);
            }}
          >
            <Send className="h-4 w-4" />
            Enviar Verba
          </button>
        )}

        <div className="obras-gastos-section">
          <div className="obras-gastos-header">
            <span className="obras-gastos-title">
              Gastos ({obra.gastos.length})
            </span>
            {obra.gastos.length > 0 && (
              <span className="obras-gastos-total">
                {formatCurrency(totalGastos)}
              </span>
            )}
          </div>

          {Array.isArray(obra.gastos) && obra.gastos.length > 0 ? (
            <div className="obras-gastos-list">
              {obra.gastos.map((gasto) => (
                <div key={gasto.id} className="obras-gasto-item">
                  <div className="obras-gasto-info">
                    <div className="obras-gasto-categoria">{gasto.categoria}</div>
                    <div className="obras-gasto-descricao">{gasto.descricao}</div>
                  </div>
                  <div className="obras-gasto-actions">
                    <span className="obras-gasto-valor">{formatCurrency(gasto.valor)}</span>
                    {canEdit && !obra.finalizada && (
                      <button
                        className="obras-btn-icon edit"
                        onClick={() => handleEditGasto(obra.id, gasto)}
                        title="Editar gasto"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                    {canDelete && !obra.finalizada && (
                      <button
                        className="obras-btn-icon delete"
                        onClick={() => handleDeleteGasto(obra.id, gasto.id)}
                        title="Excluir gasto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="obras-empty-gastos">
              Nenhum gasto registrado
            </div>
          )}

          {canCreate && !obra.finalizada && (
            <button
              className="obras-btn obras-btn-add-gasto"
              onClick={() => {
                setSelectedObra(obra.id);
                setEditingGasto(null);
                setGastoFormData({ categoria: '', descricao: '', valor: '' });
                setIsGastoDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Adicionar Gasto
            </button>
          )}
        </div>
      </div>
    );
  };

  // Função para renderizar Analytics com métricas e gráficos inteligentes
  const renderAnalytics = () => {
    // Cálculos de métricas
    const todasObras = [...obrasAtivas, ...obrasFinalizadas];
    const totalObras = todasObras.length;
    const obrasConcluidas = obrasFinalizadas.length;
    
    // Métricas Financeiras
    const totalOrcado = todasObras.reduce((acc, o) => acc + o.orcamento, 0);
    const totalGasto = todasObras.reduce((acc, o) => 
      acc + o.gastos.reduce((sum, g) => sum + g.valor, 0), 0);
    const totalRecebido = todasObras.reduce((acc, o) => acc + (o.valor_recebido || 0), 0);
    const lucroTotal = obrasFinalizadas.reduce((acc, o) => acc + (o.lucro || 0), 0);
    
    // Médias
    const lucroMedio = obrasFinalizadas.length > 0 ? lucroTotal / obrasFinalizadas.length : 0;
    const gastoMedioPorObra = totalObras > 0 ? totalGasto / totalObras : 0;
    const orcamentoMedio = totalObras > 0 ? totalOrcado / totalObras : 0;
    const margemLucroMedia = orcamentoMedio > 0 ? (lucroMedio / orcamentoMedio) * 100 : 0;
    
    // Obras por status
    const obrasPendentes = obrasAtivas.length;
    const taxaConclusao = totalObras > 0 ? (obrasFinalizadas.length / totalObras) * 100 : 0;
    
    // Análise de previsões
    const lucroProjetadoAtivas = obrasAtivas.reduce((acc, o) => {
      const gastos = o.gastos.reduce((sum, g) => sum + g.valor, 0);
      return acc + (o.orcamento - gastos);
    }, 0);
    
    // Dados para gráfico de distribuição de gastos por obra
    const gastosDistribution = todasObras.slice(0, 10).map(o => ({
      nome: o.nome.length > 15 ? o.nome.substring(0, 15) + '...' : o.nome,
      gastos: o.gastos.reduce((sum, g) => sum + g.valor, 0),
      orcamento: o.orcamento,
      lucro: o.orcamento - o.gastos.reduce((sum, g) => sum + g.valor, 0),
    }));
    
    // Top 5 obras mais lucrativas
    const topLucrativas = [...obrasFinalizadas]
      .sort((a, b) => (b.lucro || 0) - (a.lucro || 0))
      .slice(0, 5);
    
    // Top 5 obras com mais gastos
    const topGastos = [...todasObras]
      .map(o => ({
        ...o,
        totalGastos: o.gastos.reduce((sum, g) => sum + g.valor, 0),
      }))
      .sort((a, b) => b.totalGastos - a.totalGastos)
      .slice(0, 5);

    // Gastos por Categoria
    const categoriasGastos = ['Material', 'Combustível', 'Alimentação', 'Funcionário', 'Frete'];
    const gastosPorCategoria = categoriasGastos.map(cat => {
      const totalCategoria = todasObras.reduce((acc, obra) => {
        const gastosCategoria = obra.gastos
          .filter(g => g.categoria === cat)
          .reduce((sum, g) => sum + g.valor, 0);
        return acc + gastosCategoria;
      }, 0);
      
      const quantidadeGastos = todasObras.reduce((acc, obra) => {
        return acc + obra.gastos.filter(g => g.categoria === cat).length;
      }, 0);

      return {
        categoria: cat,
        total: totalCategoria,
        quantidade: quantidadeGastos,
        percentual: totalGasto > 0 ? (totalCategoria / totalGasto) * 100 : 0,
      };
    }).sort((a, b) => b.total - a.total);

    // Ícones para cada categoria
    const categoriaIcons: { [key: string]: string } = {
      'Material': '🧱',
      'Combustível': '⛽',
      'Alimentação': '🍽️',
      'Funcionário': '👷',
      'Frete': '🚚',
    };

    // Cores para cada categoria
    const categoriaColors: { [key: string]: string } = {
      'Material': '#60a5fa',
      'Combustível': '#f59e0b',
      'Alimentação': '#34d399',
      'Funcionário': '#a78bfa',
      'Frete': '#f87171',
    };

    return (
      <div className="analytics-container">
        {/* Métricas Principais */}
        <div className="analytics-metrics-grid">
          <div className="metric-card metric-primary">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <span className="metric-label">Lucro Total</span>
              <span className="metric-value">{formatCurrency(lucroTotal)}</span>
              <span className="metric-subtitle">{obrasFinalizadas.length} obras finalizadas</span>
            </div>
          </div>

          <div className="metric-card metric-success">
            <div className="metric-icon">📈</div>
            <div className="metric-content">
              <span className="metric-label">Lucro Médio/Obra</span>
              <span className="metric-value">{formatCurrency(lucroMedio)}</span>
              <span className="metric-subtitle">Margem: {margemLucroMedia.toFixed(1)}%</span>
            </div>
          </div>

          <div className="metric-card metric-warning">
            <div className="metric-icon">🎯</div>
            <div className="metric-content">
              <span className="metric-label">Lucro Projetado (Ativas)</span>
              <span className="metric-value">{formatCurrency(lucroProjetadoAtivas)}</span>
              <span className="metric-subtitle">{obrasAtivas.length} obras em andamento</span>
            </div>
          </div>

          <div className="metric-card metric-info">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <span className="metric-label">Taxa de Conclusão</span>
              <span className="metric-value">{taxaConclusao.toFixed(1)}%</span>
              <span className="metric-subtitle">{obrasFinalizadas.length}/{totalObras} concluídas</span>
            </div>
          </div>
        </div>

        {/* Gráficos e Análises */}
        <div className="analytics-charts-grid">
          {/* Top Obras Lucrativas */}
          <div className="analytics-card">
            <h3 className="analytics-card-title">
              <span>🏆</span>
              Top 5 Obras Mais Lucrativas
            </h3>
            <div className="ranking-list">
              {topLucrativas.length > 0 ? (
                topLucrativas.map((obra, index) => (
                  <div key={obra.id} className="ranking-item">
                    <div className="ranking-position">{index + 1}</div>
                    <div className="ranking-info">
                      <span className="ranking-name">{obra.nome}</span>
                      <span className="ranking-subtitle">
                        Lucro: {formatCurrency(obra.lucro || 0)}
                      </span>
                    </div>
                    <div className="ranking-value positive">
                      {((obra.lucro || 0) / obra.orcamento * 100).toFixed(1)}%
                    </div>
                  </div>
                ))
              ) : (
                <div className="analytics-empty">Finalize obras para ver o ranking</div>
              )}
            </div>
          </div>

          {/* Top Obras com Mais Gastos */}
          <div className="analytics-card">
            <h3 className="analytics-card-title">
              <span>💸</span>
              Top 5 Obras com Mais Gastos
            </h3>
            <div className="ranking-list">
              {topGastos.length > 0 ? (
                topGastos.map((obra, index) => (
                  <div key={obra.id} className="ranking-item">
                    <div className="ranking-position danger">{index + 1}</div>
                    <div className="ranking-info">
                      <span className="ranking-name">{obra.nome}</span>
                      <span className="ranking-subtitle">
                        {obra.gastos.length} gastos registrados
                      </span>
                    </div>
                    <div className="ranking-value negative">
                      {formatCurrency(obra.totalGastos)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="analytics-empty">Nenhum gasto registrado ainda</div>
              )}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="analytics-card full-width">
            <h3 className="analytics-card-title">
              <span>📉</span>
              Resumo Financeiro Geral
            </h3>
            <div className="financial-summary">
              <div className="summary-item">
                <div className="summary-bar">
                  <div className="summary-bar-fill orcamento" style={{ width: '100%' }}></div>
                </div>
                <div className="summary-info">
                  <span className="summary-label">Total Orçado</span>
                  <span className="summary-value">{formatCurrency(totalOrcado)}</span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-bar">
                  <div 
                    className="summary-bar-fill recebido" 
                    style={{ width: `${totalOrcado > 0 ? (totalRecebido / totalOrcado) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="summary-info">
                  <span className="summary-label">Total Recebido</span>
                  <span className="summary-value positive">{formatCurrency(totalRecebido)}</span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-bar">
                  <div 
                    className="summary-bar-fill gasto" 
                    style={{ width: `${totalOrcado > 0 ? (totalGasto / totalOrcado) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="summary-info">
                  <span className="summary-label">Total em Gastos</span>
                  <span className="summary-value negative">{formatCurrency(totalGasto)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gastos por Categoria */}
          <div className="analytics-card full-width categoria-card">
            <h3 className="analytics-card-title">
              <span>📊</span>
              Distribuição de Gastos por Categoria
            </h3>
            <div className="categorias-grid">
              {gastosPorCategoria.map((cat, index) => (
                <div 
                  key={cat.categoria} 
                  className="categoria-item"
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    borderColor: `${categoriaColors[cat.categoria]}40`
                  }}
                >
                  <div className="categoria-header">
                    <div className="categoria-icon" style={{ background: `${categoriaColors[cat.categoria]}20` }}>
                      <span style={{ fontSize: '2rem' }}>{categoriaIcons[cat.categoria]}</span>
                    </div>
                    <div className="categoria-info">
                      <h4 className="categoria-nome" style={{ color: categoriaColors[cat.categoria] }}>
                        {cat.categoria}
                      </h4>
                      <span className="categoria-quantidade">
                        {cat.quantidade} {cat.quantidade === 1 ? 'gasto' : 'gastos'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="categoria-valor-container">
                    <span className="categoria-valor" style={{ color: categoriaColors[cat.categoria] }}>
                      {formatCurrency(cat.total)}
                    </span>
                    <span className="categoria-percentual">
                      {cat.percentual.toFixed(1)}% do total
                    </span>
                  </div>

                  <div className="categoria-progress">
                    <div 
                      className="categoria-progress-fill"
                      style={{ 
                        width: `${cat.percentual}%`,
                        background: `linear-gradient(90deg, ${categoriaColors[cat.categoria]}80, ${categoriaColors[cat.categoria]})`
                      }}
                    ></div>
                  </div>

                  {cat.total > 0 && (
                    <div className="categoria-stats">
                      <div className="categoria-stat">
                        <span className="stat-label">Média/Gasto</span>
                        <span className="stat-value">
                          {formatCurrency(cat.quantidade > 0 ? cat.total / cat.quantidade : 0)}
                        </span>
                      </div>
                      <div className="categoria-stat">
                        <span className="stat-label">Participação</span>
                        <span className="stat-value" style={{ color: categoriaColors[cat.categoria] }}>
                          {cat.percentual.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalGasto === 0 && (
              <div className="analytics-empty">
                Nenhum gasto registrado ainda. Adicione gastos às obras para ver a distribuição por categoria.
              </div>
            )}
          </div>

          {/* Insights e Previsões */}
          <div className="analytics-card insights-card full-width">
            <h3 className="analytics-card-title">
              <span>🔮</span>
              Insights & Previsões Inteligentes
            </h3>
            <div className="insights-grid">
              <div className="insight-item">
                <div className="insight-icon">💡</div>
                <div className="insight-content">
                  <h4>Preço Ideal Sugerido</h4>
                  <p>
                    Com base no gasto médio de <strong>{formatCurrency(gastoMedioPorObra)}</strong> por obra, 
                    sugere-se orçar em média <strong>{formatCurrency(gastoMedioPorObra * 1.5)}</strong> para 
                    manter uma margem de lucro saudável de 50%.
                  </p>
                </div>
              </div>

              <div className="insight-item">
                <div className="insight-icon">⚡</div>
                <div className="insight-content">
                  <h4>Performance Atual</h4>
                  <p>
                    {margemLucroMedia >= 40 ? (
                      <>Excelente! Sua margem média de <strong>{margemLucroMedia.toFixed(1)}%</strong> está acima do ideal.</>
                    ) : margemLucroMedia >= 25 ? (
                      <>Bom trabalho! Margem de <strong>{margemLucroMedia.toFixed(1)}%</strong> é saudável para o setor.</>
                    ) : (
                      <>Atenção! Margem de <strong>{margemLucroMedia.toFixed(1)}%</strong> pode ser melhorada. Revise seus custos ou reajuste preços.</>
                    )}
                  </p>
                </div>
              </div>

              <div className="insight-item">
                <div className="insight-icon">🎯</div>
                <div className="insight-content">
                  <h4>Meta de Faturamento</h4>
                  <p>
                    Se concluir todas as obras ativas, o faturamento projetado é de{' '}
                    <strong>{formatCurrency(totalRecebido + lucroProjetadoAtivas)}</strong>, 
                    com lucro adicional estimado em <strong>{formatCurrency(lucroProjetadoAtivas)}</strong>.
                  </p>
                </div>
              </div>

              <div className="insight-item">
                <div className="insight-icon">📊</div>
                <div className="insight-content">
                  <h4>Eficiência Operacional</h4>
                  <p>
                    {totalObras > 0 && (
                      <>
                        Você está gerenciando <strong>{totalObras} obras</strong> com um 
                        ticket médio de <strong>{formatCurrency(orcamentoMedio)}</strong>. 
                        {taxaConclusao >= 50 ? ' Ótima taxa de conclusão!' : ' Foque em finalizar mais obras!'}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="insight-item">
                <div className="insight-icon">💡</div>
                <div className="insight-content">
                  <h4>Análise de Categorias</h4>
                  <p>
                    {gastosPorCategoria.length > 0 && gastosPorCategoria[0].total > 0 ? (
                      <>
                        Sua categoria com maior gasto é <strong>{gastosPorCategoria[0].categoria}</strong> ({gastosPorCategoria[0].percentual.toFixed(1)}% do total).
                        {gastosPorCategoria[0].percentual > 40 ? (
                          <> Considere negociar melhores preços ou buscar fornecedores alternativos para reduzir custos.</>
                        ) : (
                          <> Boa distribuição de gastos entre as categorias!</>
                        )}
                      </>
                    ) : (
                      <>Registre gastos categorizados para obter insights sobre onde seu dinheiro está sendo investido.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return <div className="obras-container"><div style={{textAlign: 'center', padding: '3rem', color: '#94a3b8'}}>Carregando obras...</div></div>;
  }

  return (
    <div className="obras-container">
      <div className="obras-header">
        <div className="obras-header-content">
          <h1>Obras</h1>
          <p>Gerenciamento de obras e seus gastos</p>
        </div>
        <div className="obras-header-actions">
          {canCreate && (
            <Dialog open={isObraDialogOpen} onOpenChange={setIsObraDialogOpen}>
              <DialogTrigger asChild>
                <button className="obras-btn obras-btn-primary">
                  <Plus className="h-4 w-4" />
                  Nova Obra
                </button>
              </DialogTrigger>
              <DialogContent className="obras-dialog-content" aria-describedby="dialog-description-obra">
                <DialogHeader>
                  <DialogTitle className="obras-dialog-title">Nova Obra</DialogTitle>
                  <DialogDescription className="obras-dialog-description" id="dialog-description-obra">
                    Preencha os dados para cadastrar uma nova obra.
                  </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleObraSubmit} className="obras-form">
                <div className="obras-form-field">
                  <label>Nome da Obra</label>
                  <input
                    value={obraFormData.nome}
                    onChange={(e) =>
                      setObraFormData({ ...obraFormData, nome: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="obras-form-field">
                  <label>Orçamento Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    value={obraFormData.orcamento}
                    onChange={(e) =>
                      setObraFormData({ ...obraFormData, orcamento: e.target.value })
                    }
                    required
                  />
                </div>
                <button type="submit" className="obras-btn obras-btn-primary">
                  Criar Obra
                </button>
              </form>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      <div className="obras-tabs">
        <Tabs defaultValue="ativas" className="w-full">
          <TabsList>
            <TabsTrigger value="ativas">Obras Ativas</TabsTrigger>
            <TabsTrigger value="finalizadas">Obras Finalizadas</TabsTrigger>
            <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="ativas">
            {obrasAtivas.length > 0 ? (
              <div className="obras-grid">
                {obrasAtivas.map((obra, index) => renderObraCard(obra, index))}
              </div>
            ) : (
              <div className="obras-empty-state">Nenhuma obra ativa</div>
            )}
          </TabsContent>
          <TabsContent value="finalizadas">
            {obrasFinalizadas.length > 0 ? (
              <div className="obras-grid">
                {obrasFinalizadas.map((obra, index) => renderObraCard(obra, index))}
              </div>
            ) : (
              <div className="obras-empty-state">Nenhuma obra finalizada</div>
            )}
          </TabsContent>
          <TabsContent value="analytics">
            {renderAnalytics()}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={isVerbaDialogOpen}
        onOpenChange={(open) => {
          setIsVerbaDialogOpen(open);
          if (!open) {
            setObraParaVerba(null);
            setVerbaValue('');
          }
        }}
      >
        <DialogContent className="obras-dialog-content" aria-describedby="dialog-description-verba">
          <DialogHeader>
            <DialogTitle className="obras-dialog-title">Enviar Verba</DialogTitle>
            <DialogDescription className="obras-dialog-description" id="dialog-description-verba">
              Informe o valor que deseja disponibilizar para o card vinculado. O valor será debitado do caixa e registrado como gasto da obra.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEnviarVerba} className="obras-form">
            {obraParaVerba && (
              <div className="obras-pagamento-info">
                <div className="obras-info-row">
                  <span>Obra:</span>
                  <strong>{obraParaVerba.obra.nome}</strong>
                </div>
                <div className="obras-info-row">
                  <span>Saldo do Card:</span>
                  <strong className="positive">{formatCurrency(obraParaVerba.card.saldo_atual)}</strong>
                </div>
                <div className="obras-info-row">
                  <span>Gasto do Card:</span>
                  <strong className="negative">{formatCurrency(obraParaVerba.card.total_gasto)}</strong>
                </div>
              </div>
            )}

            <div className="obras-form-field">
              <Label>Valor da Verba</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={verbaValue}
                onChange={(e) => setVerbaValue(e.target.value)}
                required
                placeholder="0,00"
              />
            </div>

            <Button type="submit" className="w-full obras-btn-submit">
              <Send className="h-4 w-4" />
              Confirmar Envio
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPagamentoDialogOpen} onOpenChange={setIsPagamentoDialogOpen}>
        <DialogContent className="obras-dialog-content" aria-describedby="dialog-description-pagamento">
          <DialogHeader>
            <DialogTitle className="obras-dialog-title">
              Registrar Pagamento Parcial
            </DialogTitle>
            <DialogDescription className="obras-dialog-description" id="dialog-description-pagamento">
              Registre o valor recebido da obra. O pagamento será lançado como entrada no caixa.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePagamentoObraSubmit} className="obras-form">
            {selectedObraForPayment && (
              <div className="obras-pagamento-info">
                <div className="obras-info-row">
                  <span>Obra:</span>
                  <strong>{selectedObraForPayment.nome}</strong>
                </div>
                <div className="obras-info-row">
                  <span>Orçamento:</span>
                  <strong>{formatCurrency(selectedObraForPayment.orcamento)}</strong>
                </div>
                <div className="obras-info-row">
                  <span>Já Recebido:</span>
                  <strong className="positive">{formatCurrency(selectedObraForPayment.valor_recebido || 0)}</strong>
                </div>
                <div className="obras-info-row">
                  <span>Total Gastos:</span>
                  <strong className="negative">{formatCurrency(selectedObraForPayment.gastos.reduce((acc, g) => acc + g.valor, 0))}</strong>
                </div>
                <div className="obras-info-row highlight">
                  <span>A Receber do Cliente:</span>
                  <strong className="warning">{formatCurrency(selectedObraForPayment.orcamento - (selectedObraForPayment.valor_recebido || 0))}</strong>
                </div>
              </div>
            )}
            
            <div className="obras-form-field">
              <Label>Valor do Pagamento</Label>
              <Input
                type="number"
                step="0.01"
                value={pagamentoValue}
                onChange={(e) => setPagamentoValue(e.target.value)}
                required
                placeholder="0,00"
              />
            </div>

            <Button type="submit" className="w-full obras-btn-submit">
              <DollarSign className="h-4 w-4" />
              Registrar Pagamento
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Finalização de Obra */}
      <Dialog open={isFinalizacaoDialogOpen} onOpenChange={setIsFinalizacaoDialogOpen}>
        <DialogContent className="obras-dialog-content obras-dialog-finalizacao" aria-describedby="dialog-description-finalizacao">
          <DialogHeader>
            <DialogTitle className="obras-dialog-title">
              <CheckCircle className="h-5 w-5" />
              Finalizar Obra
            </DialogTitle>
            <DialogDescription className="obras-dialog-description" id="dialog-description-finalizacao">
              Informe o valor restante que foi recebido para finalizar a obra. O valor será lançado no caixa e a obra será marcada como concluída.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFinalizacaoSubmit} className="obras-form">
            {selectedObraForFinalization && (
              <div className="obras-finalizacao-info">
                <div className="obras-info-section">
                  <h4>Resumo da Obra</h4>
                  <div className="obras-info-row">
                    <span>Nome da Obra:</span>
                    <strong>{selectedObraForFinalization.nome}</strong>
                  </div>
                  <div className="obras-info-row">
                    <span>Orçamento Total:</span>
                    <strong>{formatCurrency(selectedObraForFinalization.orcamento)}</strong>
                  </div>
                  <div className="obras-info-row">
                    <span>Total em Gastos:</span>
                    <strong className="negative">{formatCurrency(selectedObraForFinalization.gastos.reduce((acc, g) => acc + g.valor, 0))}</strong>
                  </div>
                  <div className="obras-info-row">
                    <span>Já Recebido:</span>
                    <strong className="positive">{formatCurrency(selectedObraForFinalization.valor_recebido || 0)}</strong>
                  </div>
                  <div className="obras-info-row highlight">
                    <span>A Receber do Cliente:</span>
                    <strong className="warning">
                      {formatCurrency(selectedObraForFinalization.orcamento - (selectedObraForFinalization.valor_recebido || 0))}
                    </strong>
                  </div>
                </div>

                <div className="obras-info-section lucro-projetado">
                  <h4>Lucro Projetado ao Finalizar</h4>
                  <div className="obras-lucro-display">
                    {formatCurrency(
                      (selectedObraForFinalization.valor_recebido || 0) + 
                      parseFloat(valorRestanteFinalizacao.replace(',', '.') || '0') - 
                      selectedObraForFinalization.gastos.reduce((acc, g) => acc + g.valor, 0)
                    )}
                  </div>
                  <p className="obras-lucro-hint">
                    Este é o lucro final considerando o valor restante informado abaixo
                  </p>
                </div>
              </div>
            )}
            
            <div className="obras-form-field">
              <Label>Valor Restante Recebido</Label>
              <Input
                type="number"
                step="0.01"
                value={valorRestanteFinalizacao}
                onChange={(e) => setValorRestanteFinalizacao(e.target.value)}
                placeholder="0,00"
                required
              />
              <span className="field-hint">Informe 0 se já recebeu todo o pagamento da obra</span>
            </div>

            <div className="obras-form-actions">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setIsFinalizacaoDialogOpen(false);
                  setValorRestanteFinalizacao('');
                }}
                className="obras-btn-cancel"
              >
                Cancelar
              </Button>
              <Button type="submit" className="obras-btn-submit obras-btn-finalize">
                <CheckCircle className="h-4 w-4" />
                Finalizar Obra
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isGastoDialogOpen} onOpenChange={(open: boolean) => {
        setIsGastoDialogOpen(open);
        if (!open) {
          setEditingGasto(null);
          setGastoFormData({ categoria: '', descricao: '', valor: '' });
        }
      }}>
        <DialogContent className="obras-dialog-content" aria-describedby="dialog-description-gasto">
          <DialogHeader>
            <DialogTitle className="obras-dialog-title">
              {editingGasto ? 'Editar Gasto' : 'Adicionar Gasto'}
            </DialogTitle>
            <DialogDescription className="obras-dialog-description" id="dialog-description-gasto">
              Preencha os dados para cadastrar ou editar um gasto de obra.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGastoSubmit} className="obras-form">
            <div className="obras-form-field">
              <label>Categoria do Gasto</label>
              <select
                value={gastoFormData.categoria}
                onChange={(e) =>
                  setGastoFormData({ ...gastoFormData, categoria: e.target.value })
                }
                required
                className="obras-select"
              >
                <option value="">Selecione uma categoria</option>
                <option value="Material">🧱 Material</option>
                <option value="Combustível">⛽ Combustível</option>
                <option value="Alimentação">🍽️ Alimentação</option>
                <option value="Funcionário">👷 Funcionário</option>
                <option value="Frete">🚚 Frete</option>
              </select>
            </div>
            <div className="obras-form-field">
              <label>Descrição</label>
              <input
                value={gastoFormData.descricao}
                onChange={(e) =>
                  setGastoFormData({ ...gastoFormData, descricao: e.target.value })
                }
                required
              />
            </div>
            <div className="obras-form-field">
              <label>Valor</label>
              <input
                type="number"
                step="0.01"
                value={gastoFormData.valor}
                onChange={(e) =>
                  setGastoFormData({ ...gastoFormData, valor: e.target.value })
                }
                required
              />
            </div>
            <button type="submit" className="obras-btn obras-btn-primary">
              {editingGasto ? 'Salvar Alterações' : 'Adicionar Gasto'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão de Obra */}
      <Dialog open={!!confirmDeleteObraId} onOpenChange={(open) => {
        if (!open) {
          setConfirmDeleteObraId(null);
          setObraToDelete(null);
        }
      }}>
        <DialogContent className="obras-dialog-content obras-dialog-delete" aria-describedby="dialog-description-delete-obra">
          <DialogHeader>
            <DialogTitle className="obras-dialog-title delete-title">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão de Obra
            </DialogTitle>
            <DialogDescription className="obras-dialog-description" id="dialog-description-delete-obra">
              Esta ação não pode ser desfeita. Todos os gastos associados a esta obra também serão removidos.
            </DialogDescription>
          </DialogHeader>
          <div className="obras-delete-content">
            {obraToDelete && (
              <div className="obras-delete-info">
                <div className="obras-info-row">
                  <span>Obra:</span>
                  <strong>{obraToDelete.nome}</strong>
                </div>
                <div className="obras-info-row">
                  <span>Orçamento:</span>
                  <strong>{formatCurrency(obraToDelete.orcamento)}</strong>
                </div>
                <div className="obras-info-row">
                  <span>Gastos:</span>
                  <strong>{obraToDelete.gastos.length} registro(s)</strong>
                </div>
              </div>
            )}
            <div className="obras-delete-warning">
              ⚠️ Tem certeza que deseja excluir esta obra permanentemente?
            </div>
            <div className="obras-form-actions">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setConfirmDeleteObraId(null);
                  setObraToDelete(null);
                }}
                className="obras-btn-cancel"
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={handleDeleteObra}
                className="obras-btn-delete"
              >
                <Trash2 className="h-4 w-4" />
                Sim, Excluir Obra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}