import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Archive, Folder, FolderOpen, Download, AlertTriangle, TrendingUp, TrendingDown, Wallet, ChevronLeft, RotateCcw, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

interface Transacao {
  id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  origem: string;
  data: string;
  observacao: string;
  categoria: string;
}

interface ArquivoMes {
  mes: string;
  ano: string;
  total_entradas: number;
  total_saidas: number;
  quantidade: number;
}

interface CaixaArquivosProps {
  arquivos: ArquivoMes[];
  onReload: () => void;
}

// Função para detectar dispositivo móvel
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

// Função auxiliar para download de PDF
const downloadPDFMobile = async (doc: jsPDF, filename: string) => {
  console.log('downloadPDFMobile iniciado (Arquivos)', { isMobile: isMobileDevice() });
  
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
            title: 'Extrato Arquivado',
            text: 'Extrato financeiro gerado pelo sistema PEPERAIO'
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
      // Desktop: download direto
      doc.save(filename);
      toast.success('PDF exportado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    toast.error('Erro ao exportar PDF. Tente novamente.');
  }
};

export default function CaixaArquivos({ arquivos, onReload }: CaixaArquivosProps) {
  const [isArquivarDialogOpen, setIsArquivarDialogOpen] = useState(false);
  const [mesParaArquivar, setMesParaArquivar] = useState('');
  const [pastaAberta, setPastaAberta] = useState<string | null>(null);
  const [transacoesArquivadas, setTransacoesArquivadas] = useState<Transacao[]>([]);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState('');
  const [arquivoParaDeletar, setArquivoParaDeletar] = useState<{mes: string; ano: string} | null>(null);

  const processarArquivamento = async (mesArquivar: string) => {
    const [ano, mes] = mesArquivar.split('-');
    const mesReferencia = `${ano}-${mes}`;
    
    // Calcular início e fim do mês corretamente
    const dataInicio = `${ano}-${mes}-01`;
    const anoNum = parseInt(ano);
    const mesNum = parseInt(mes) - 1;
    const proximoMesDate = new Date(anoNum, mesNum + 1, 1);
    const dataFim = proximoMesDate.toISOString().split('T')[0];
    
    console.log('📅 Arquivando mês:', mesArquivar);
    console.log('📅 Referência salva:', mesReferencia);
    console.log('📅 Período de busca:', dataInicio, 'até (não inclui)', dataFim);
    
    // Verificar se já existe arquivo (para ajustar mensagem)
    const { data: arquivoExistente } = await supabase
      .from('transacoes_arquivadas')
      .select('id')
      .eq('mes_referencia', mesReferencia)
      .limit(1);
    
    const ehAdicao = arquivoExistente && arquivoExistente.length > 0;
    
    const { data: transacoesDoMes, error: errorBusca } = await supabase
      .from('transacoes')
      .select('*')
      .gte('data', dataInicio)
      .lt('data', dataFim)
      .eq('arquivado', false);

    if (errorBusca || !transacoesDoMes || transacoesDoMes.length === 0) {
      console.log('❌ Nenhuma transação encontrada para arquivar');
      toast.error('Nenhuma transação não-arquivada encontrada neste mês');
      return;
    }
    
    console.log('📦 Encontradas', transacoesDoMes.length, 'transações para arquivar');
    console.log('🔍 Exemplo de data original:', transacoesDoMes[0]?.data);

    const totalEntradas = transacoesDoMes.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor, 0);
    const totalSaidas = transacoesDoMes.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + t.valor, 0);
    
    console.log('💰 Total Entradas:', totalEntradas, 'Total Saídas:', totalSaidas);

    // Normalizar datas para evitar problema de timezone
    const transacoesParaArquivar = transacoesDoMes.map(t => {
      // Se a data vier como '2024-11-15', garantir que permaneça assim
      const dataNormalizada = t.data.includes('T') ? t.data.split('T')[0] : t.data;
      
      console.log('📅 Data original:', t.data, '→ Normalizada:', dataNormalizada);
      
      return {
        id_original: t.id,
        tipo: t.tipo,
        valor: t.valor,
        origem: t.origem,
        data: dataNormalizada,
        observacao: t.observacao,
        categoria: t.categoria,
        mes_referencia: mesReferencia
      };
    });

    const { error: updateError } = await supabase
      .from('transacoes')
      .update({ arquivado: true })
      .in('id', transacoesDoMes.map(t => t.id));

    if (updateError) {
      console.error('❌ Erro ao marcar como arquivado:', updateError);
      toast.error(`Erro ao arquivar: ${updateError.message}`);
      return;
    }

    console.log('✅ Transações marcadas como arquivadas');

    const { error: errorInsert } = await supabase
      .from('transacoes_arquivadas')
      .insert(transacoesParaArquivar);
      
    if (errorInsert) {
      console.error('Erro ao copiar para arquivo:', errorInsert);
      toast.error('Erro ao criar cópia no arquivo: ' + errorInsert.message);
      await supabase.from('transacoes').update({ arquivado: false }).in('id', transacoesDoMes.map(t => t.id));
      return;
    }
    
    console.log('✅ Transações marcadas como arquivadas e ocultas do caixa');
    console.log('📦 Total arquivado:', transacoesDoMes.length, 'transações');
    
    if (ehAdicao) {
      toast.success(`✅ ${transacoesDoMes.length} nova(s) transação(ões) adicionada(s) ao arquivo!`);
    } else {
      toast.success(`✅ ${transacoesDoMes.length} transação(ões) arquivada(s)!`);
    }
    
    setIsArquivarDialogOpen(false);
    setMesParaArquivar('');
    
    await onReload();
    window.dispatchEvent(new Event('transacao-atualizada'));
  };

  const handleArquivarMes = async () => {
    if (!mesParaArquivar) {
      toast.error('Selecione um mês para arquivar');
      return;
    }

    const [ano, mes] = mesParaArquivar.split('-');
    const mesReferencia = `${ano}-${mes}`;
    
    // Calcular período do mês
    const dataInicio = `${ano}-${mes}-01`;
    const anoNum = parseInt(ano);
    const mesNum = parseInt(mes) - 1;
    const proximoMesDate = new Date(anoNum, mesNum + 1, 1);
    const dataFim = proximoMesDate.toISOString().split('T')[0];
    
    // Verificar se há transações NÃO arquivadas neste mês
    const { data: transacoesNaoArquivadas, error: errorCheck } = await supabase
      .from('transacoes')
      .select('id')
      .gte('data', dataInicio)
      .lt('data', dataFim)
      .eq('arquivado', false);

    if (errorCheck) {
      toast.error('Erro ao verificar transações');
      return;
    }

    if (!transacoesNaoArquivadas || transacoesNaoArquivadas.length === 0) {
      toast.info('Todas as transações deste mês já foram arquivadas!');
      return;
    }

    console.log(`📦 Encontradas ${transacoesNaoArquivadas.length} transações não arquivadas para adicionar`);
    
    // Verificar se já existe arquivo
    const { data: arquivoExistente } = await supabase
      .from('transacoes_arquivadas')
      .select('id')
      .eq('mes_referencia', mesReferencia)
      .limit(1);

    if (arquivoExistente && arquivoExistente.length > 0) {
      // Arquivo existe, mas há novas transações para adicionar
      toast.info(`Adicionando ${transacoesNaoArquivadas.length} nova(s) transação(ões) ao arquivo existente...`);
    }
    
    await processarArquivamento(mesParaArquivar);
  };

  const handleAbrirPasta = async (mes: string, ano: string) => {
    const mesReferencia = `${ano}-${mes.padStart(2, '0')}`;
    setPastaAberta(mesReferencia);

    const { data, error } = await supabase
      .from('transacoes_arquivadas')
      .select('*')
      .eq('mes_referencia', mesReferencia)
      .order('data', { ascending: false });

    if (!error && data) {
      setTransacoesArquivadas(data);
    } else {
      toast.error('Erro ao carregar arquivo');
    }
  };

  const handleFecharPasta = () => {
    setPastaAberta(null);
    setTransacoesArquivadas([]);
  };

  const handleRestaurarArquivo = async (mesReferencia: string) => {
    try {
      console.log('🔄 Iniciando restauração do arquivo:', mesReferencia);
      
      // Buscar transações do arquivo
      const { data: transacoesArquivadas, error: selectError } = await supabase
        .from('transacoes_arquivadas')
        .select('*')
        .eq('mes_referencia', mesReferencia);

      console.log('📦 Resposta do banco:', { transacoesArquivadas, selectError });

      if (selectError) {
        console.error('❌ Erro ao buscar:', selectError);
        toast.error('Erro ao buscar transações arquivadas: ' + selectError.message);
        return;
      }

      if (!transacoesArquivadas || transacoesArquivadas.length === 0) {
        console.log('⚠️ Nenhuma transação encontrada no arquivo');
        toast.error('Nenhuma transação encontrada neste arquivo!');
        return;
      }

      console.log('📦 Transações encontradas:', transacoesArquivadas.length);
      console.log('🔍 Primeira transação:', transacoesArquivadas[0]);

      // Desmarcar como arquivado nas transações originais
      const ids = transacoesArquivadas.map(t => t.id_original).filter(Boolean);
      
      console.log('🔑 IDs originais extraídos:', ids);
      console.log('📊 Total de IDs válidos:', ids.length, 'de', transacoesArquivadas.length);
      
      if (ids.length === 0) {
        console.error('⚠️ Transações antigas sem id_original. Tentando corrigir...');
        
        // Tentar buscar as transações correspondentes e atualizar o arquivo
        const [ano, mes] = mesReferencia.split('-');
        const dataInicio = `${ano}-${mes}-01`;
        const anoNum = parseInt(ano);
        const mesNum = parseInt(mes) - 1;
        const proximoMesDate = new Date(anoNum, mesNum + 1, 1);
        const dataFim = proximoMesDate.toISOString().split('T')[0];

        const { data: transacoesOriginais } = await supabase
          .from('transacoes')
          .select('*')
          .gte('data', dataInicio)
          .lt('data', dataFim)
          .eq('arquivado', true);

        if (!transacoesOriginais || transacoesOriginais.length === 0) {
          toast.error('Não foi possível encontrar as transações originais. Delete este arquivo e arquive novamente!');
          return;
        }

        console.log('✅ Encontradas', transacoesOriginais.length, 'transações originais arquivadas');

        // Deletar arquivo antigo
        await supabase
          .from('transacoes_arquivadas')
          .delete()
          .eq('mes_referencia', mesReferencia);

        // Recriar com id_original
        const novasTransacoesArquivadas = transacoesOriginais.map(t => ({
          id_original: t.id,
          tipo: t.tipo,
          valor: t.valor,
          origem: t.origem,
          data: t.data,
          observacao: t.observacao,
          categoria: t.categoria,
          mes_referencia: mesReferencia
        }));

        const { error: insertError } = await supabase
          .from('transacoes_arquivadas')
          .insert(novasTransacoesArquivadas);

        if (insertError) {
          console.error('❌ Erro ao recriar arquivo:', insertError);
          toast.error('Erro ao corrigir arquivo: ' + insertError.message);
          return;
        }

        console.log('✅ Arquivo corrigido! Agora restaurando...');
        
        // Usar os IDs originais
        const idsOriginais = transacoesOriginais.map(t => t.id);
        
        const { error: updateError } = await supabase
          .from('transacoes')
          .update({ arquivado: false })
          .in('id', idsOriginais);

        if (updateError) {
          console.error('❌ Erro ao restaurar:', updateError);
          toast.error('Erro ao restaurar: ' + updateError.message);
          return;
        }

        // Deletar do arquivo
        await supabase
          .from('transacoes_arquivadas')
          .delete()
          .eq('mes_referencia', mesReferencia);

        console.log('✅ Restauração completa após correção!');
        toast.success(`${transacoesOriginais.length} transações restauradas!`);
        handleFecharPasta();
        await onReload();
        
        // Forçar atualização do saldo na interface
        window.dispatchEvent(new Event('transacao-atualizada'));
        return;
      }

      console.log('🔄 Atualizando transações para arquivado=false...');
      
      const { error: updateError, count } = await supabase
        .from('transacoes')
        .update({ arquivado: false })
        .in('id', ids)
        .select();

      console.log('📝 Resultado do update:', { error: updateError, count });

      if (updateError) {
        console.error('❌ Erro ao restaurar:', updateError);
        toast.error('Erro ao restaurar transações: ' + updateError.message);
        return;
      }

      console.log('✅ Transações desmarcadas como arquivadas');

      // Deletar do arquivo
      const { error: deleteError } = await supabase
        .from('transacoes_arquivadas')
        .delete()
        .eq('mes_referencia', mesReferencia);

      if (deleteError) {
        console.error('❌ Erro ao deletar do arquivo:', deleteError);
        toast.error('Erro ao remover do arquivo!');
        return;
      }

      console.log('✅ Restauração completa!');
      toast.success(`${transacoesArquivadas.length} transações restauradas!`);
      handleFecharPasta();
      await onReload();
      
      // Forçar atualização do saldo na interface
      window.dispatchEvent(new Event('transacao-atualizada'));
    } catch (error) {
      console.error('💥 Erro inesperado ao restaurar:', error);
      toast.error('Erro ao restaurar transações!');
    }
  };

  const handleAbrirConfirmacaoDeletar = (mes: string, ano: string) => {
    setArquivoParaDeletar({ mes, ano });
    setConfirmacaoExclusao('');
  };

  const handleDeletarArquivo = async () => {
    if (!arquivoParaDeletar) return;

    if (confirmacaoExclusao !== 'DELETAR PERMANENTEMENTE') {
      toast.error('Digite "DELETAR PERMANENTEMENTE" para confirmar!');
      return;
    }

    const mesReferencia = `${arquivoParaDeletar.ano}-${arquivoParaDeletar.mes.padStart(2, '0')}`;
    
    const { error } = await supabase
      .from('transacoes_arquivadas')
      .delete()
      .eq('mes_referencia', mesReferencia);

    if (error) {
      toast.error('Erro ao deletar arquivo');
      console.error(error);
      return;
    }

    toast.success('Arquivo deletado permanentemente');
    setArquivoParaDeletar(null);
    setConfirmacaoExclusao('');
    handleFecharPasta();
    onReload();
  };

  const handleExportarPDF = async (mes: string, ano: string) => {
    console.log('📄 Iniciando exportação de PDF:', { mes, ano });
    
    const mesReferencia = `${ano}-${mes.padStart(2, '0')}`;
    console.log('📄 Referência do arquivo:', mesReferencia);
    
    const { data: transacoes, error } = await supabase
      .from('transacoes_arquivadas')
      .select('*')
      .eq('mes_referencia', mesReferencia)
      .order('data', { ascending: true });

    console.log('📄 Transações encontradas:', transacoes?.length, 'Erro:', error);

    if (error || !transacoes) {
      toast.error('Erro ao buscar transações');
      console.error('Erro detalhado:', error);
      return;
    }

    if (transacoes.length === 0) {
      toast.error('Nenhuma transação encontrada para este mês');
      return;
    }

    console.log('📄 Gerando PDF...');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let y = 20;

    // Calcular nome do mês para usar no PDF e no arquivo
    const dataRef = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    const nomeMes = dataRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // CABEÇALHO
    doc.setFillColor(79, 70, 229); // Indigo
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('EXTRATO ARQUIVADO', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(nomeMes.toUpperCase(), pageWidth / 2, 25, { align: 'center' });

    y = 45;

    // CARDS DE RESUMO
    const entradas = transacoes.filter(t => t.tipo === 'entrada');
    const saidas = transacoes.filter(t => t.tipo === 'saida');
    const totalEntradas = entradas.reduce((sum, t) => sum + t.valor, 0);
    const totalSaidas = saidas.reduce((sum, t) => sum + t.valor, 0);
    const saldo = totalEntradas - totalSaidas;

    const cardWidth = 60;
    const cardHeight = 25;
    const spacing = 5;
    const startX = (pageWidth - (cardWidth * 3 + spacing * 2)) / 2;

    // Card Entradas
    doc.setFillColor(220, 252, 231); // Verde claro
    doc.roundedRect(startX, y, cardWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.5);
    doc.roundedRect(startX, y, cardWidth, cardHeight, 3, 3, 'S');
    
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ENTRADAS', startX + cardWidth/2, y + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.text(formatCurrency(totalEntradas), startX + cardWidth/2, y + 18, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${entradas.length} transacoes`, startX + cardWidth/2, y + 23, { align: 'center' });

    // Card Saidas
    doc.setFillColor(254, 226, 226); // Vermelho claro
    doc.roundedRect(startX + cardWidth + spacing, y, cardWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(startX + cardWidth + spacing, y, cardWidth, cardHeight, 3, 3, 'S');
    
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SAIDAS', startX + cardWidth + spacing + cardWidth/2, y + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.text(formatCurrency(totalSaidas), startX + cardWidth + spacing + cardWidth/2, y + 18, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${saidas.length} transacoes`, startX + cardWidth + spacing + cardWidth/2, y + 23, { align: 'center' });

    // Card Saldo
    const saldoColor = saldo >= 0 ? [34, 197, 94] : [239, 68, 68];
    const saldoBg = saldo >= 0 ? [220, 252, 231] : [254, 226, 226];
    
    doc.setFillColor(...saldoBg);
    doc.roundedRect(startX + (cardWidth + spacing) * 2, y, cardWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(...saldoColor);
    doc.roundedRect(startX + (cardWidth + spacing) * 2, y, cardWidth, cardHeight, 3, 3, 'S');
    
    doc.setTextColor(...saldoColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SALDO', startX + (cardWidth + spacing) * 2 + cardWidth/2, y + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.text(formatCurrency(saldo), startX + (cardWidth + spacing) * 2 + cardWidth/2, y + 18, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${transacoes.length} total`, startX + (cardWidth + spacing) * 2 + cardWidth/2, y + 23, { align: 'center' });

    y += cardHeight + 15;

    // LINHA SEPARADORA
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, y, pageWidth - 15, y);
    y += 10;

    // TITULO DA LISTAGEM
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALHAMENTO DAS TRANSACOES', 15, y);
    y += 8;

    // TABELA DE TRANSACOES
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    transacoes.forEach((t, index) => {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 20;
        
        // Repetir cabecalho simplificado
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('EXTRATO ARQUIVADO - ' + nomeMes.toUpperCase(), pageWidth / 2, 10, { align: 'center' });
        y = 25;
      }

      // Fundo alternado para melhor leitura
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(15, y - 4, pageWidth - 30, 15, 'F');
      }

      // Normalizar data para evitar problema de timezone
      const dataPartes = t.data.split('T')[0].split('-');
      const dataObj = new Date(
        parseInt(dataPartes[0]), 
        parseInt(dataPartes[1]) - 1, 
        parseInt(dataPartes[2])
      );
      const dataTransacao = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const isEntrada = t.tipo === 'entrada';
      
      // Badge do tipo
      doc.setFillColor(isEntrada ? 220 : 254, isEntrada ? 252 : 226, isEntrada ? 231 : 226);
      doc.roundedRect(17, y - 3, 18, 6, 2, 2, 'F');
      doc.setTextColor(isEntrada ? 22 : 220, isEntrada ? 163 : 38, isEntrada ? 74 : 38);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(isEntrada ? 'ENTRADA' : 'SAIDA', 26, y + 1, { align: 'center' });

      // Data
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(dataTransacao, 38, y + 1);

      // Origem/Descricao
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const origemTexto = t.origem.length > 40 ? t.origem.substring(0, 37) + '...' : t.origem;
      doc.text(origemTexto, 70, y + 1);

      // Valor
      doc.setTextColor(isEntrada ? 22 : 220, isEntrada ? 163 : 38, isEntrada ? 74 : 38);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(t.valor), pageWidth - 17, y + 1, { align: 'right' });

      // Categoria e Observacao (linha inferior)
      y += 7;
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      
      let infoTexto = '';
      if (t.categoria) infoTexto += `Categoria: ${t.categoria}`;
      if (t.observacao) {
        if (infoTexto) infoTexto += '  |  ';
        const obsTexto = t.observacao.length > 50 ? t.observacao.substring(0, 47) + '...' : t.observacao;
        infoTexto += `Obs: ${obsTexto}`;
      }
      if (infoTexto) doc.text(infoTexto, 17, y);

      y += 8;
    });

    // GRAFICO DE GASTOS POR CATEGORIA
    // Adicionar nova pagina se necessario
    if (y > pageHeight - 120) {
      doc.addPage();
      y = 20;
    } else {
      y += 15;
    }

    // Calcular gastos por categoria (apenas saidas)
    const gastosPorCategoria = new Map<string, number>();
    transacoes.forEach(t => {
      if (t.tipo === 'saida' && t.categoria) {
        const valorAtual = gastosPorCategoria.get(t.categoria) || 0;
        gastosPorCategoria.set(t.categoria, valorAtual + t.valor);
      }
    });

    // Converter para array e ordenar
    const categoriasArray = Array.from(gastosPorCategoria.entries())
      .sort((a, b) => b[1] - a[1]); // Ordenar do maior para o menor

    if (categoriasArray.length > 0) {
      // Titulo do grafico
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, y, pageWidth - 15, y);
      y += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('GASTOS POR CATEGORIA', pageWidth / 2, y, { align: 'center' });
      y += 15;

      const totalGastos = categoriasArray.reduce((sum, [_, valor]) => sum + valor, 0);

      // Cores para o grafico
      const cores = [
        [239, 68, 68],    // Vermelho
        [249, 115, 22],   // Laranja
        [234, 179, 8],    // Amarelo
        [34, 197, 94],    // Verde
        [59, 130, 246],   // Azul
        [168, 85, 247],   // Roxo
        [236, 72, 153],   // Rosa
        [20, 184, 166],   // Teal
        [156, 163, 175],  // Cinza
        [124, 58, 237],   // Violeta
      ];

      // Desenhar grafico de pizza
      const centerX = pageWidth / 2;
      const centerY = y + 50;
      const radius = 40;
      let startAngle = 0;

      categoriasArray.forEach(([categoria, valor], index) => {
        const percentage = (valor / totalGastos) * 100;
        const sliceAngle = (percentage / 100) * 360;
        const endAngle = startAngle + sliceAngle;

        const cor = cores[index % cores.length];
        doc.setFillColor(cor[0], cor[1], cor[2]);

        // Desenhar fatia
        doc.circle(centerX, centerY, radius, 'F');
        
        // Calcular pontos para a fatia
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        
        // Desenhar fatia usando path
        const x1 = centerX + radius * Math.cos(startRad);
        const y1 = centerY + radius * Math.sin(startRad);
        const x2 = centerX + radius * Math.cos(endRad);
        const y2 = centerY + radius * Math.sin(endRad);

        doc.setFillColor(cor[0], cor[1], cor[2]);
        doc.triangle(centerX, centerY, x1, y1, x2, y2, 'F');

        startAngle = endAngle;
      });

      // Redesenhar o circulo completo com as cores certas
      startAngle = 0;
      categoriasArray.forEach(([categoria, valor], index) => {
        const percentage = (valor / totalGastos) * 100;
        const sliceAngle = (percentage / 100) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        const cor = cores[index % cores.length];
        doc.setFillColor(cor[0], cor[1], cor[2]);

        // Desenhar arco preenchido
        const points = [];
        points.push([centerX, centerY]);
        
        for (let angle = startAngle; angle <= endAngle; angle += 0.1) {
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          points.push([x, y]);
        }
        
        // Fechar o caminho
        points.push([centerX, centerY]);

        // Desenhar poligono preenchido
        if (points.length > 2) {
          doc.setFillColor(cor[0], cor[1], cor[2]);
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(1);
          
          // Usar lines para desenhar o segmento
          for (let i = 1; i < points.length - 1; i++) {
            doc.triangle(
              points[0][0], points[0][1],
              points[i][0], points[i][1],
              points[i + 1][0], points[i + 1][1],
              'FD'
            );
          }
        }

        startAngle = endAngle;
      });

      // Legenda em formato de tabela
      y = centerY + radius + 20;
      const tableX = 15;
      const tableWidth = pageWidth - 30;
      const rowHeight = 8;
      const colWidths = [10, tableWidth - 80, 70]; // Cor, Categoria, Valor

      // Cabecalho da tabela
      doc.setFillColor(249, 250, 251);
      doc.rect(tableX, y, tableWidth, rowHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(tableX, y, tableWidth, rowHeight, 'S');

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Categoria', tableX + colWidths[0] + 3, y + 5);
      doc.text('Valor', tableX + colWidths[0] + colWidths[1] + 5, y + 5);
      doc.text('%', tableX + tableWidth - 5, y + 5, { align: 'right' });

      y += rowHeight;

      // Linhas da tabela
      doc.setFont('helvetica', 'normal');
      categoriasArray.forEach(([categoria, valor], index) => {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = 20;
          
          // Repetir cabecalho
          doc.setFillColor(249, 250, 251);
          doc.rect(tableX, y, tableWidth, rowHeight, 'F');
          doc.setDrawColor(200, 200, 200);
          doc.rect(tableX, y, tableWidth, rowHeight, 'S');
          
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('Categoria', tableX + colWidths[0] + 3, y + 5);
          doc.text('Valor', tableX + colWidths[0] + colWidths[1] + 5, y + 5);
          doc.text('%', tableX + tableWidth - 5, y + 5, { align: 'right' });
          
          y += rowHeight;
          doc.setFont('helvetica', 'normal');
        }

        const cor = cores[index % cores.length];
        const percentage = (valor / totalGastos) * 100;

        // Fundo alternado
        if (index % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(tableX, y, tableWidth, rowHeight, 'F');
        }

        // Bordas da linha
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.rect(tableX, y, tableWidth, rowHeight, 'S');

        // Quadrado colorido (menor e centralizado)
        const colorBoxSize = 5;
        const colorBoxY = y + (rowHeight - colorBoxSize) / 2;
        doc.setFillColor(cor[0], cor[1], cor[2]);
        doc.roundedRect(tableX + 2.5, colorBoxY, colorBoxSize, colorBoxSize, 1, 1, 'F');

        // Nome da categoria
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(8);
        const catTexto = categoria.length > 30 ? categoria.substring(0, 27) + '...' : categoria;
        doc.text(catTexto, tableX + colWidths[0] + 3, y + 5.5);

        // Valor
        doc.setTextColor(75, 85, 99);
        doc.text(formatCurrency(valor), tableX + colWidths[0] + colWidths[1] + 5, y + 5.5);

        // Percentual
        doc.setTextColor(107, 114, 128);
        doc.setFont('helvetica', 'bold');
        doc.text(`${percentage.toFixed(1)}%`, tableX + tableWidth - 5, y + 5.5, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        y += rowHeight;
      });

      // Linha de total
      doc.setFillColor(243, 244, 246);
      doc.rect(tableX, y, tableWidth, rowHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(tableX, y, tableWidth, rowHeight, 'S');

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL', tableX + colWidths[0] + 3, y + 5.5);
      doc.text(formatCurrency(totalGastos), tableX + colWidths[0] + colWidths[1] + 5, y + 5.5);
      doc.text('100.0%', tableX + tableWidth - 5, y + 5.5, { align: 'right' });

      y += rowHeight + 10;
    }

    // SECAO DE GASTOS POR OBRA
    // Buscar transacoes de obras do mes
    const [anoMes, mesMes] = mesReferencia.split('-');
    const dataInicioObras = `${anoMes}-${mesMes}-01`;
    const anoNumObras = parseInt(anoMes);
    const mesNumObras = parseInt(mesMes) - 1;
    const proximoMesObras = new Date(anoNumObras, mesNumObras + 1, 1);
    const dataFimObras = proximoMesObras.toISOString().split('T')[0];

    console.log('🏗️ Buscando gastos de obras:', { dataInicioObras, dataFimObras, mesReferencia });

    const { data: transacoesObras, error: errorObras } = await supabase
      .from('transacoes_obras')
      .select(`
        id,
        tipo,
        valor,
        descricao,
        data,
        categoria_gasto,
        obra_id,
        obras (
          nome,
          endereco
        )
      `)
      .gte('data', dataInicioObras)
      .lt('data', dataFimObras)
      .order('obra_id', { ascending: true })
      .order('data', { ascending: true });

    console.log('🏗️ Transações de obras encontradas:', transacoesObras?.length, 'Erro:', errorObras);
    if (transacoesObras && transacoesObras.length > 0) {
      console.log('🏗️ Primeira transação de obra:', transacoesObras[0]);
    }

    if (transacoesObras && transacoesObras.length > 0) {
      // Verificar se precisa de nova pagina
      if (y > pageHeight - 80) {
        doc.addPage();
        y = 20;
      }

      // Titulo da secao
      doc.setFillColor(99, 102, 241); // Indigo
      doc.roundedRect(15, y, pageWidth - 30, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('GASTOS POR OBRA', pageWidth / 2, y + 7, { align: 'center' });
      y += 15;

      // Agrupar por obra
      const obrasPorId = transacoesObras.reduce((acc: any, t: any) => {
        const obraId = t.obra_id || 'sem-obra';
        if (!acc[obraId]) {
          acc[obraId] = {
            nome: t.obras?.nome || 'Obra sem nome',
            endereco: t.obras?.endereco || '',
            transacoes: []
          };
        }
        acc[obraId].transacoes.push(t);
        return acc;
      }, {});

      // Renderizar cada obra
      Object.entries(obrasPorId).forEach(([obraId, obraData]: [string, any], obraIndex) => {
        const totalObra = obraData.transacoes.reduce((sum: number, t: any) => 
          sum + (t.tipo === 'saida' ? t.valor : -t.valor), 0
        );

        // Verificar espaco para obra
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 20;
        }

        // Card da obra
        doc.setFillColor(248, 250, 252); // Cinza muito claro
        doc.roundedRect(15, y, pageWidth - 30, 12, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.roundedRect(15, y, pageWidth - 30, 12, 2, 2, 'S');

        // Nome da obra
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const nomeObra = obraData.nome.length > 45 ? obraData.nome.substring(0, 42) + '...' : obraData.nome;
        doc.text(nomeObra, 18, y + 5);

        // Endereco
        if (obraData.endereco) {
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          const enderecoTexto = obraData.endereco.length > 50 ? obraData.endereco.substring(0, 47) + '...' : obraData.endereco;
          doc.text(enderecoTexto, 18, y + 9);
        }

        // Total da obra
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(totalObra), pageWidth - 18, y + 7, { align: 'right' });

        y += 15;

        // Tabela de transacoes da obra
        const tableX = 20;
        const tableWidth = pageWidth - 40;
        const rowHeight = 7;

        // Cabecalho
        doc.setFillColor(241, 245, 249);
        doc.rect(tableX, y, tableWidth, rowHeight, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.2);
        doc.rect(tableX, y, tableWidth, rowHeight, 'S');

        doc.setTextColor(51, 65, 85);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('Data', tableX + 2, y + 4.5);
        doc.text('Descricao', tableX + 20, y + 4.5);
        doc.text('Categoria', tableX + 90, y + 4.5);
        doc.text('Valor', tableWidth + tableX - 2, y + 4.5, { align: 'right' });

        y += rowHeight;

        // Linhas de transacoes
        doc.setFont('helvetica', 'normal');
        obraData.transacoes.forEach((t: any, tIndex: number) => {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
            
            // Repetir cabecalho
            doc.setFillColor(241, 245, 249);
            doc.rect(tableX, y, tableWidth, rowHeight, 'F');
            doc.setDrawColor(203, 213, 225);
            doc.rect(tableX, y, tableWidth, rowHeight, 'S');
            
            doc.setTextColor(51, 65, 85);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text('Data', tableX + 2, y + 4.5);
            doc.text('Descricao', tableX + 20, y + 4.5);
            doc.text('Categoria', tableX + 90, y + 4.5);
            doc.text('Valor', tableWidth + tableX - 2, y + 4.5, { align: 'right' });
            
            y += rowHeight;
            doc.setFont('helvetica', 'normal');
          }

          // Fundo alternado
          if (tIndex % 2 === 0) {
            doc.setFillColor(249, 250, 251);
            doc.rect(tableX, y, tableWidth, rowHeight, 'F');
          }

          // Borda
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.15);
          doc.rect(tableX, y, tableWidth, rowHeight, 'S');

          // Data
          const dataPartes = t.data.split('T')[0].split('-');
          const dataObj = new Date(
            parseInt(dataPartes[0]), 
            parseInt(dataPartes[1]) - 1, 
            parseInt(dataPartes[2])
          );
          const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(7);
          doc.text(dataFormatada, tableX + 2, y + 4.5);

          // Descricao
          doc.setTextColor(51, 65, 85);
          const descTexto = (t.descricao || 'Sem descricao').length > 35 ? 
            (t.descricao || 'Sem descricao').substring(0, 32) + '...' : 
            (t.descricao || 'Sem descricao');
          doc.text(descTexto, tableX + 20, y + 4.5);

          // Categoria
          doc.setTextColor(100, 116, 139);
          const catTexto = (t.categoria_gasto || '-').length > 20 ? 
            (t.categoria_gasto || '-').substring(0, 17) + '...' : 
            (t.categoria_gasto || '-');
          doc.text(catTexto, tableX + 90, y + 4.5);

          // Valor
          doc.setTextColor(220, 38, 38);
          doc.setFont('helvetica', 'bold');
          doc.text(formatCurrency(t.valor), tableWidth + tableX - 2, y + 4.5, { align: 'right' });
          doc.setFont('helvetica', 'normal');

          y += rowHeight;
        });

        y += 5; // Espaco entre obras
      });

      // Total geral de obras
      const totalGeralObras = Object.values(obrasPorId).reduce((sum: number, obra: any) => 
        sum + obra.transacoes.reduce((s: number, t: any) => s + (t.tipo === 'saida' ? t.valor : -t.valor), 0), 
        0
      );

      if (y > pageHeight - 25) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(254, 226, 226);
      doc.roundedRect(15, y, pageWidth - 30, 9, 2, 2, 'F');
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.5);
      doc.roundedRect(15, y, pageWidth - 30, 9, 2, 2, 'S');

      doc.setTextColor(153, 27, 27);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL GASTO EM OBRAS', 18, y + 6);
      doc.setFontSize(11);
      doc.text(formatCurrency(totalGeralObras), pageWidth - 18, y + 6, { align: 'right' });

      y += 15;
    } else {
      console.log('🏗️ Nenhuma transação de obra encontrada para o período');
      
      // Mostrar mensagem no PDF
      if (y > pageHeight - 50) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(99, 102, 241);
      doc.roundedRect(15, y, pageWidth - 30, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('GASTOS POR OBRA', pageWidth / 2, y + 7, { align: 'center' });
      y += 15;

      doc.setFillColor(243, 244, 246);
      doc.roundedRect(15, y, pageWidth - 30, 12, 2, 2, 'F');
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Nenhum gasto de obra registrado neste mes', pageWidth / 2, y + 7.5, { align: 'center' });
      
      y += 20;
    }

    // RODAPE
    const rodapeY = pageHeight - 15;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, rodapeY - 5, pageWidth - 15, rodapeY - 5);
    
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('PEPERAIO - Sistema de Gestao Financeira', 15, rodapeY);
    
    const dataGeracao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(`Gerado em ${dataGeracao}`, pageWidth - 15, rodapeY, { align: 'right' });

    console.log('📄 PDF gerado com sucesso. Iniciando download/compartilhamento...');
    const nomeArquivo = `Extrato_${nomeMes.replace(/\s/g, '_')}.pdf`;
    console.log('📄 Nome do arquivo:', nomeArquivo);
    
    await downloadPDFMobile(doc, nomeArquivo);
    console.log('📄 Processo concluído!');
  };

  return (
    <div className="caixa-arquivos-container">
      <div className="caixa-arquivos-header">
        <h3 className="caixa-arquivos-title">
          <Archive size={24} />
          Arquivos de Transações
        </h3>
        <Dialog open={isArquivarDialogOpen} onOpenChange={setIsArquivarDialogOpen}>
          <DialogTrigger asChild>
            <button className="caixa-btn caixa-btn-primary">
              <Archive className="h-4 w-4" />
              Arquivar Mês
            </button>
          </DialogTrigger>
          <DialogContent className="caixa-dialog-content">
            <DialogHeader>
              <DialogTitle className="caixa-dialog-title">Arquivar Transações</DialogTitle>
            </DialogHeader>
            <div className="caixa-form-container">
              <p className="caixa-arquivar-aviso">
                <AlertTriangle size={20} />
                Oculta as transações do mês selecionado do caixa principal. O saldo permanece o mesmo. Você pode restaurá-las a qualquer momento.
              </p>
              <div className="caixa-form-field">
                <label>Selecione o Mês</label>
                <input
                  type="month"
                  value={mesParaArquivar}
                  onChange={(e) => setMesParaArquivar(e.target.value)}
                  className="caixa-form-input"
                />
              </div>
              <div className="caixa-dialog-actions">
                <button 
                  className="caixa-btn caixa-btn-outline" 
                  onClick={() => setIsArquivarDialogOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="caixa-btn caixa-btn-primary" 
                  onClick={handleArquivarMes}
                >
                  <Archive className="h-4 w-4" />
                  Arquivar
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pastaAberta ? (
        <div className="caixa-pasta-aberta">
          <div className="caixa-pasta-header">
            <button className="caixa-btn-voltar" onClick={handleFecharPasta}>
              <ChevronLeft size={20} />
              Voltar
            </button>
            <h4 className="caixa-pasta-titulo">
              <FolderOpen size={24} />
              {(() => {
                const [ano, mes] = pastaAberta.split('-');
                const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
                return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
              })()}
            </h4>
            <div className="caixa-pasta-header-actions">
              <button 
                className="caixa-btn-pasta caixa-btn-restaurar"
                onClick={() => handleRestaurarArquivo(pastaAberta)}
                title="Restaurar para o Caixa"
              >
                <RotateCcw size={18} />
                Restaurar
              </button>
              <button 
                className="caixa-btn-pasta caixa-btn-deletar"
                onClick={() => {
                  const [ano, mes] = pastaAberta.split('-');
                  handleAbrirConfirmacaoDeletar(mes, ano);
                }}
                title="Deletar Permanentemente"
              >
                <Trash2 size={18} />
                Deletar
              </button>
            </div>
          </div>
          
          <div className="caixa-pasta-resumo">
            <div className="caixa-pasta-stat positivo">
              <TrendingUp size={20} />
              <span>Entradas</span>
              <strong>{formatCurrency(transacoesArquivadas.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor, 0))}</strong>
            </div>
            <div className="caixa-pasta-stat negativo">
              <TrendingDown size={20} />
              <span>Saídas</span>
              <strong>{formatCurrency(transacoesArquivadas.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + t.valor, 0))}</strong>
            </div>
            <div className="caixa-pasta-stat neutro">
              <Wallet size={20} />
              <span>Saldo</span>
              <strong>
                {formatCurrency(
                  transacoesArquivadas.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor, 0) -
                  transacoesArquivadas.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + t.valor, 0)
                )}
              </strong>
            </div>
          </div>

          <div className="caixa-transacoes-list">
            {transacoesArquivadas.map((transacao) => {
              // Normalizar data para evitar problema de timezone
              const dataPartes = transacao.data.split('T')[0].split('-');
              const dataCorreta = new Date(
                parseInt(dataPartes[0]), 
                parseInt(dataPartes[1]) - 1, 
                parseInt(dataPartes[2])
              );
              
              return (
                <div key={transacao.id} className={`caixa-transacao-card ${transacao.tipo}`}>
                  <div className="caixa-transacao-info">
                    <span className="caixa-transacao-tipo-badge">{transacao.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA'}</span>
                    <strong>{transacao.origem}</strong>
                    {transacao.categoria && <span className="caixa-tag">{transacao.categoria}</span>}
                    <small>{dataCorreta.toLocaleDateString('pt-BR')}</small>
                    {transacao.observacao && <p className="caixa-observacao">{transacao.observacao}</p>}
                  </div>
                  <div className="caixa-transacao-valor">{formatCurrency(transacao.valor)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="caixa-pastas-grid">
          {arquivos.length === 0 ? (
            <div className="caixa-empty-state">
              <Folder size={48} />
              <p>Nenhum arquivo ainda</p>
              <small>Arquive transações por mês para organizá-las</small>
            </div>
          ) : (
            arquivos.map((arquivo) => (
              <div 
                key={`${arquivo.ano}-${arquivo.mes}`} 
                className="caixa-pasta-card"
              >
                <div className="caixa-pasta-icon">
                  <Folder size={48} />
                </div>
                <div className="caixa-pasta-info">
                  <h4 className="caixa-pasta-nome">
                    {(() => {
                      // Usar Date com componentes separados para evitar problemas de timezone
                      const anoNum = parseInt(arquivo.ano);
                      const mesNum = parseInt(arquivo.mes) - 1; // JavaScript usa 0-11
                      const data = new Date(anoNum, mesNum, 1);
                      console.log('📅 Formatando nome do arquivo:', { ano: arquivo.ano, mes: arquivo.mes, anoNum, mesNum, data, resultado: data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) });
                      return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    })()}
                  </h4>
                  <p className="caixa-pasta-detalhes">
                    {arquivo.quantidade} transações
                  </p>
                  <div className="caixa-pasta-valores">
                    <span className="positivo">↑ {formatCurrency(arquivo.total_entradas)}</span>
                    <span className="negativo">↓ {formatCurrency(arquivo.total_saidas)}</span>
                  </div>
                </div>
                <div className="caixa-pasta-acoes">
                  <button
                    className="caixa-btn-pasta caixa-btn-abrir"
                    onClick={() => handleAbrirPasta(arquivo.mes, arquivo.ano)}
                    title="Abrir pasta"
                  >
                    <FolderOpen size={18} />
                    Abrir
                  </button>
                  <button
                    className="caixa-btn-pasta caixa-btn-exportar"
                    onClick={() => handleExportarPDF(arquivo.mes, arquivo.ano)}
                    title="Exportar PDF"
                  >
                    <Download size={18} />
                    PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão Rigorosa */}
      {arquivoParaDeletar && (
        <Dialog open={true} onOpenChange={() => {
          setArquivoParaDeletar(null);
          setConfirmacaoExclusao('');
        }}>
          <DialogContent className="caixa-dialog-content">
            <DialogHeader>
              <DialogTitle className="caixa-dialog-title" style={{ color: '#ef4444' }}>
                ⚠️ Exclusão Permanente
              </DialogTitle>
            </DialogHeader>
            <div className="caixa-form-container">
              <p style={{ marginBottom: '1rem', color: '#666', lineHeight: 1.6 }}>
                Você está prestes a <strong style={{ color: '#ef4444' }}>DELETAR PERMANENTEMENTE</strong> o arquivo de{' '}
                <strong>
                  {(() => {
                    const data = new Date(parseInt(arquivoParaDeletar.ano), parseInt(arquivoParaDeletar.mes) - 1, 1);
                    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                  })()}
                </strong>.
              </p>
              <p style={{ marginBottom: '1.5rem', color: '#991b1b', fontWeight: 'bold' }}>
                Esta ação não pode ser desfeita!
              </p>
              <div className="caixa-form-field">
                <label style={{ fontWeight: 'bold', color: '#000' }}>
                  Para confirmar, digite exatamente:
                </label>
                <div style={{ 
                  backgroundColor: '#fee2e2', 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  marginBottom: '0.75rem',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#991b1b'
                }}>
                  DELETAR PERMANENTEMENTE
                </div>
                <input
                  type="text"
                  value={confirmacaoExclusao}
                  onChange={(e) => setConfirmacaoExclusao(e.target.value)}
                  className="caixa-form-input"
                  placeholder="Digite aqui..."
                  autoFocus
                  style={{
                    borderColor: confirmacaoExclusao === 'DELETAR PERMANENTEMENTE' ? '#22c55e' : '#ef4444'
                  }}
                />
              </div>
              <div className="caixa-dialog-actions">
                <button 
                  className="caixa-btn caixa-btn-outline" 
                  onClick={() => {
                    setArquivoParaDeletar(null);
                    setConfirmacaoExclusao('');
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="caixa-btn caixa-btn-primary" 
                  onClick={handleDeletarArquivo}
                  disabled={confirmacaoExclusao !== 'DELETAR PERMANENTEMENTE'}
                  style={{
                    backgroundColor: confirmacaoExclusao === 'DELETAR PERMANENTEMENTE' ? '#ef4444' : '#ccc',
                    cursor: confirmacaoExclusao === 'DELETAR PERMANENTEMENTE' ? 'pointer' : 'not-allowed',
                    opacity: confirmacaoExclusao === 'DELETAR PERMANENTEMENTE' ? 1 : 0.5
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar Permanentemente
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
