import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Archive, Folder, FolderOpen, Download, AlertTriangle, TrendingUp, TrendingDown, Wallet, ChevronLeft } from 'lucide-react';
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

// Função auxiliar para download de PDF
const downloadPDFMobile = async (doc: jsPDF, filename: string) => {
  const isMobileDevice = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  try {
    if (isMobileDevice()) {
      const blob = doc.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.share) {
        try {
          await navigator.share({ files: [file], title: 'Extrato Arquivado', text: 'Extrato financeiro gerado pelo sistema PEPERAIO' });
          toast.success('PDF compartilhado com sucesso!');
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            toast.info('PDF aberto em nova aba');
            setTimeout(() => URL.revokeObjectURL(url), 60000);
          }
        }
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.info('PDF aberto em nova aba');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } else {
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

  const handleArquivarMes = async () => {
    if (!mesParaArquivar) {
      toast.error('Selecione um mês para arquivar');
      return;
    }

    const [ano, mes] = mesParaArquivar.split('-');
    const mesReferencia = `${ano}-${mes}`;
    
    const { data: transacoesDoMes, error: errorBusca } = await supabase
      .from('transacoes')
      .select('*')
      .gte('data', `${ano}-${mes}-01`)
      .lt('data', `${ano}-${String(Number(mes) + 1).padStart(2, '0')}-01`);

    if (errorBusca || !transacoesDoMes || transacoesDoMes.length === 0) {
      toast.error('Nenhuma transação encontrada neste mês');
      return;
    }

    const totalEntradas = transacoesDoMes.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor, 0);
    const totalSaidas = transacoesDoMes.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + t.valor, 0);

    const transacoesParaArquivar = transacoesDoMes.map(t => ({
      ...t,
      mes_referencia: mesReferencia,
      total_entradas: totalEntradas,
      total_saidas: totalSaidas,
      data_arquivamento: new Date().toISOString()
    }));

    const { error: errorInsert } = await supabase.from('transacoes_arquivadas').insert(transacoesParaArquivar);
    if (errorInsert) {
      toast.error('Erro ao arquivar transações');
      console.error(errorInsert);
      return;
    }

    const idsParaRemover = transacoesDoMes.map(t => t.id);
    const { error: errorDelete } = await supabase.from('transacoes').delete().in('id', idsParaRemover);
    if (errorDelete) {
      toast.error('Erro ao limpar transações do caixa');
      console.error(errorDelete);
      return;
    }

    toast.success(`${transacoesDoMes.length} transações arquivadas com sucesso!`);
    setIsArquivarDialogOpen(false);
    setMesParaArquivar('');
    onReload();
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

  const handleExportarPDF = async (mes: string, ano: string) => {
    const mesReferencia = `${ano}-${mes.padStart(2, '0')}`;
    
    const { data: transacoes, error } = await supabase
      .from('transacoes_arquivadas')
      .select('*')
      .eq('mes_referencia', mesReferencia)
      .order('data', { ascending: true });

    if (error || !transacoes) {
      toast.error('Erro ao buscar transações');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let y = 20;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('EXTRATO ARQUIVADO', pageWidth / 2, y, { align: 'center' });
    
    y += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    const nomeMes = new Date(`${ano}-${mes}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    doc.text(nomeMes.toUpperCase(), pageWidth / 2, y, { align: 'center' });

    y += 15;
    const entradas = transacoes.filter(t => t.tipo === 'entrada');
    const saidas = transacoes.filter(t => t.tipo === 'saida');
    const totalEntradas = entradas.reduce((sum, t) => sum + t.valor, 0);
    const totalSaidas = saidas.reduce((sum, t) => sum + t.valor, 0);
    const saldo = totalEntradas - totalSaidas;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO DO MÊS', 15, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(34, 197, 94);
    doc.text(`Entradas: ${formatCurrency(totalEntradas)}`, 15, y);
    y += 6;
    doc.setTextColor(239, 68, 68);
    doc.text(`Saídas: ${formatCurrency(totalSaidas)}`, 15, y);
    y += 6;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Saldo: ${formatCurrency(saldo)}`, 15, y);

    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSAÇÕES', 15, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    transacoes.forEach((t) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const data = new Date(t.data).toLocaleDateString('pt-BR');
      const tipo = t.tipo === 'entrada' ? 'ENT' : 'SAI';
      const valor = formatCurrency(t.valor);

      if (t.tipo === 'entrada') {
        doc.setTextColor(34, 197, 94);
      } else {
        doc.setTextColor(239, 68, 68);
      }
      doc.text(`[${tipo}] ${data}`, 15, y);
      doc.text(valor, pageWidth - 15, y, { align: 'right' });
      y += 5;
      doc.setTextColor(100, 100, 100);
      doc.text(t.origem, 15, y);
      if (t.categoria) {
        doc.text(`[${t.categoria}]`, pageWidth - 15, y, { align: 'right' });
      }
      y += 7;
      doc.setTextColor(0, 0, 0);
    });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('PEPERAIO - Sistema de Gestão', pageWidth / 2, 290, { align: 'center' });

    await downloadPDFMobile(doc, `Extrato_${nomeMes.replace(' ', '_')}.pdf`);
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
                Arquivar move as transações do mês selecionado para um arquivo separado, limpando o caixa principal.
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
              {new Date(pastaAberta + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h4>
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
            {transacoesArquivadas.map((transacao) => (
              <div key={transacao.id} className={`caixa-transacao-card ${transacao.tipo}`}>
                <div className="caixa-transacao-info">
                  <span className="caixa-transacao-tipo-badge">{transacao.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA'}</span>
                  <strong>{transacao.origem}</strong>
                  {transacao.categoria && <span className="caixa-tag">{transacao.categoria}</span>}
                  <small>{new Date(transacao.data).toLocaleDateString('pt-BR')}</small>
                  {transacao.observacao && <p className="caixa-observacao">{transacao.observacao}</p>}
                </div>
                <div className="caixa-transacao-valor">{formatCurrency(transacao.valor)}</div>
              </div>
            ))}
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
                    {new Date(`${arquivo.ano}-${arquivo.mes}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
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
    </div>
  );
}
