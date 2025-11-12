import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { usePermissao } from '../context/PermissaoContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Edit2, Trash2, FileDown, CheckCircle, Plus, Minus, Building2, FileText, User, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Propostas.css';

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
            title: 'Proposta Comercial',
            text: 'Proposta gerada pelo sistema PEPERAIO'
          });
          toast.success('PDF compartilhado com sucesso!');
        } catch (error: any) {
          // Se usuário cancelar, não mostra erro
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

interface PriceItem {
  id: string;
  descricao: string;
  qtde: string;
  valor: string;
}

interface Proposta {
  id: string;
  cliente_nome: string;
  cliente_contato: string;
  proposta_numero: string;
  numero_sequencial: number;
  numero_revisao: number;
  data_emissao: string;
  escopo_fornecimento: string;
  condicoes_pagamento: string;
  price_items: PriceItem[];
  valor_total_extenso: string;
  prazo_garantia_meses: string;
  data_base_proposta?: string;
  prazo_entrega?: string;
  finalizada: boolean;
  created_at: string;
}

// Funções auxiliares do PDF (copiadas do AutomacaoPdf)
const MARGIN_LEFT = 20;
const MARGIN_TOP = 20;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT * 2;
const FOOTER_Y = PAGE_HEIGHT - MARGIN_TOP;

const addHeader = (doc: jsPDF) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('PEPERAIO', MARGIN_LEFT, MARGIN_TOP);
  
  doc.setFont('brush script mt', 'italic');
  doc.setFontSize(12);
  doc.text('Comunicação Visual', MARGIN_LEFT, MARGIN_TOP + 7);

  const contactX = PAGE_WIDTH - MARGIN_LEFT;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  doc.text('Isaac Peperaio  Marcos Peperaio', contactX, MARGIN_TOP, { align: 'right' });
  doc.text('62 98427-4856      61 98196-6308', contactX, MARGIN_TOP + 5, { align: 'right' });

  doc.setLineWidth(2);
  doc.setDrawColor(0, 128, 0);
  doc.line(MARGIN_LEFT, MARGIN_TOP + 15, PAGE_WIDTH - MARGIN_LEFT, MARGIN_TOP + 15);
  
  doc.setDrawColor(255, 0, 0);
  doc.line(MARGIN_LEFT, MARGIN_TOP + 18, PAGE_WIDTH - MARGIN_LEFT, MARGIN_TOP + 18);
};

const addTextWithPageBreaks = (
  doc: jsPDF, 
  text: string, 
  startY: number,
  fontSize = 10,
  fontStyle = 'normal'
): number => {
  let y = startY;
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontStyle);
  
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);

  lines.forEach((line: string) => {
    if (y > FOOTER_Y - 10) {
      doc.addPage();
      addHeader(doc);
      y = MARGIN_TOP + 35;
    }
    
    const trimmedLine = line.trim();
    
    if (trimmedLine.match(/^(\d+(\.\d+)?(\s)?(\.|-))/) || trimmedLine.endsWith(':')) {
        doc.setFont('helvetica', 'bold');
    } else {
        doc.setFont('helvetica', fontStyle);
    }

    doc.text(line, MARGIN_LEFT, y);
    y += (fontSize * 0.5);
  });

  return y;
};

export default function Propostas() {
  const { canEdit, canDelete, canCreate } = usePermissao();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFinalizarDialogOpen, setIsFinalizarDialogOpen] = useState(false);
  const [editingProposta, setEditingProposta] = useState<Proposta | null>(null);
  const [nomeObra, setNomeObra] = useState('');

  useEffect(() => {
    loadPropostas();
  }, []);

  const loadPropostas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('propostas')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      toast.error('Erro ao carregar propostas!');
      console.error(error);
    } else {
      setPropostas(data || []);
    }
    setLoading(false);
  };

  const handleDeleteProposta = async (id: string) => {
    if (!canDelete) {
      toast.error('Você não tem permissão para deletar!');
      return;
    }

    const { error } = await supabase.from('propostas').delete().eq('id', id);
    if (!error) {
      setPropostas(prev => prev.filter(p => p.id !== id));
      toast.success('Proposta deletada com sucesso!');
    } else {
      toast.error('Erro ao deletar proposta!');
    }
  };

  const handleEditProposta = (proposta: Proposta) => {
    setEditingProposta({ ...proposta });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProposta || !canEdit) return;

    // Incrementar o número de revisão
    const novaRevisao = editingProposta.numero_revisao + 1;
    const anoAtual = new Date().getFullYear();
    
    // Formatar o novo número da proposta com a revisão incrementada
    const novoNumero = `${anoAtual} ${editingProposta.numero_sequencial}-R${novaRevisao.toString().padStart(2, '0')}`;

    const { error } = await supabase
      .from('propostas')
      .update({
        cliente_nome: editingProposta.cliente_nome,
        cliente_contato: editingProposta.cliente_contato,
        proposta_numero: novoNumero, // Atualiza com novo número de revisão
        numero_revisao: novaRevisao, // Incrementa a revisão
        escopo_fornecimento: editingProposta.escopo_fornecimento,
        condicoes_pagamento: editingProposta.condicoes_pagamento,
        price_items: editingProposta.price_items,
        valor_total_extenso: editingProposta.valor_total_extenso,
        prazo_garantia_meses: editingProposta.prazo_garantia_meses,
      })
      .eq('id', editingProposta.id);

    if (!error) {
      loadPropostas();
      setIsEditDialogOpen(false);
      toast.success(`Proposta atualizada! Nova revisão: R${novaRevisao.toString().padStart(2, '0')}`);
    } else {
      toast.error('Erro ao atualizar proposta!');
    }
  };

  const handleAddItem = () => {
    if (!editingProposta) return;
    
    const newItem: PriceItem = {
      id: Date.now().toString(),
      descricao: 'Novo item',
      qtde: '1',
      valor: '0.00',
    };

    setEditingProposta({
      ...editingProposta,
      price_items: [...editingProposta.price_items, newItem]
    });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!editingProposta) return;
    
    setEditingProposta({
      ...editingProposta,
      price_items: editingProposta.price_items.filter(item => item.id !== itemId)
    });
  };

  const handleItemChange = (itemId: string, field: keyof PriceItem, value: string) => {
    if (!editingProposta) return;
    
    setEditingProposta({
      ...editingProposta,
      price_items: editingProposta.price_items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    });
  };

  const calcularValorTotal = (items: PriceItem[]): number => {
    return items.reduce((acc, item) => {
      const valor = parseFloat(item.valor || '0');
      const qtde = parseInt(item.qtde || '1', 10);
      return acc + (valor * qtde);
    }, 0);
  };

  const exportarPDFProposta = async (proposta: Proposta) => {
    try {
      const totalSum = calcularValorTotal(proposta.price_items);
      const valorFormatado = totalSum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      const doc = new jsPDF('p', 'mm', 'a4');
      let yPos = 0;

      // PÁGINA 1: CAPA
      addHeader(doc);
      yPos = 70;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Proposta: ${proposta.proposta_numero} - Técnica e Comercial`, MARGIN_LEFT, yPos);
      
      yPos += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('DE: PEPERAIO COMUNICAÇÃO VISUAL', MARGIN_LEFT, yPos);
      yPos += 7;
      doc.text(`PARA: ${proposta.cliente_nome.toUpperCase()}`, MARGIN_LEFT, yPos);
      yPos += 7;
      doc.text(`Emissão: ${proposta.data_emissao}`, MARGIN_LEFT, yPos);

      yPos += 15;
      doc.setFont('helvetica', 'bold');
      const titleText = '********** PROPOSTA TÉCNICA E COMERCIAL ***********';
      const titleWidth = doc.getTextWidth(titleText);
      const pageWidth = doc.internal.pageSize.getWidth();
      const titleX = (pageWidth - titleWidth) / 2;
      doc.text(titleText, titleX, yPos);
      
      yPos += 15;
      doc.setFont('helvetica', 'normal');
      const introText = `Prezado senhor(a) ${proposta.cliente_contato}, atendendo a sua consulta, temos a satisfação de apresentar-lhe nossa Proposta Técnica / Comercial para o fornecimento de fachada em referência, os quais serão construídos de acordo com as características técnicas mencionadas na proposta técnica.\n\nEsperamos desta forma ter correspondido às suas expectativas e colocamo-nos ao seu inteiro dispor para quaisquer esclarecimentos complementares.`;
      yPos = addTextWithPageBreaks(doc, introText, yPos, 11);

      yPos += 20;
      doc.text('Atenciosamente;', MARGIN_LEFT, yPos);
      yPos += 60;
      
      const centerX = pageWidth / 2;
      doc.setFont('helvetica', 'bold');
      doc.text('Marcos Peperaio', centerX, yPos, { align: 'center' });
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text('Vendedor Técnico/Comercial', centerX, yPos, { align: 'center' });
      yPos += 5;
      doc.text('(61) 981966308', centerX, yPos, { align: 'center' });
      yPos += 5;
      doc.text('E-mail: contato@peperaiovisual.com.br', centerX, yPos, { align: 'center' });

      // PÁGINA 2: ÍNDICE
      doc.addPage();
      addHeader(doc);
      yPos = 90;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      
      const tituloConteudo = 'Conteúdo!';
      const tituloWidth = doc.getTextWidth(tituloConteudo);
      doc.text(tituloConteudo, (PAGE_WIDTH - tituloWidth) / 2, yPos);
      
      yPos += 25;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      
      const itensIndice = [
        '1 – ESCOPO DE FORNECIMENTO',
        '2 – EXCLUSÕES / LISTA DE DESVIOS',
        '3 – NOTAS TÉCNICAS',
        '4 – PREÇOS',
        '5 – CONDIÇÕES GERAIS DE VENDAS',
        '6 – TERMO DE GARANTIA DE PRODUTOS ENGENHEIRADOS'
      ];
      
      itensIndice.forEach((item) => {
        doc.text(item, MARGIN_LEFT, yPos);
        yPos += 12;
      });

      // PÁGINA 3: ESCOPO DE FORNECIMENTO
      doc.addPage();
      addHeader(doc);
      yPos = 90;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('1-ESCOPO DE FORNECIMENTO', MARGIN_LEFT, yPos);
      yPos += 10;
      
      yPos = addTextWithPageBreaks(doc, proposta.escopo_fornecimento, yPos, 11, 'normal');
      
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Valor Total do Serviço:', MARGIN_LEFT, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text(valorFormatado, MARGIN_LEFT, yPos);
      
      yPos += 10;

      yPos = addTextWithPageBreaks(doc, proposta.condicoes_pagamento, yPos, 11, 'normal');

      // PÁGINA 4: EXCLUSÕES E NOTAS TÉCNICAS
      doc.addPage();
      addHeader(doc);
      yPos = 90;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('2-EXCLUSÕES / LISTA DE DESVIOS', MARGIN_LEFT, yPos);
      yPos += 10;
      
      const conteudoItem2 = `2.1 não estão inclusos os services e materiais de instalação elétrica (externo aos paineis presentes nesta oferta), assim como a montagem e instalação dos mesmos;

2.2 nos ateremos apenas, as letras e painéis apresentados no projeto, qualquer acréscimo de iluminação, será cobrado a parte.

2.3 não estão inclusos no escopo de fornecimento quaisquer serviços que não estejam relacionados nesta proposta

2.4 não estamos ofertando luminárias, ficando a cargo do cliente as escolhas das mesmas, se assim desejar, e caso queira nos contratar para tal, os valores não estão inclusos nesta proposta.

2.5 não serão fornecidos quaisquer materiais e serviços que não estejam claramente mencionados no Item 1 desta proposta - Escopo de Fornecimento e/ou que não foram negociados entre as partes, tais como: Luminárias, forros, instalações elétricas e outros.`;
      
      yPos = addTextWithPageBreaks(doc, conteudoItem2, yPos, 10, 'normal');
      
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('3-NOTAS TÉCNICAS', MARGIN_LEFT, yPos);
      yPos += 10;
      
      const conteudoItem3 = `3.1 para elaboração da presente proposta consideramos as documentações técnicas e lista de materiais encaminhada nesta proposta

3.2 o material relacionado, possui garantia de 5 anos;

3.3 o projeto acima proposto, tem direitos autorais, sendo vedada a execução do mesmo por terceiros, sendo passível de multas previstas em lei

3.4 A garantia do serviço se dará na mesma quantidade da garantia do material.

3.5 Quaisquer divergências entre o ofertado e suas reais necessidades, poderão ser ajustadas mediante novo contrato, para tal, reservamo-nos o direito de rever os preços e prazos de entrega.`;
      
      yPos = addTextWithPageBreaks(doc, conteudoItem3, yPos, 10, 'normal');

      // PÁGINA 5: PREÇOS
      doc.addPage();
      addHeader(doc);
      yPos = 90;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('4-PREÇOS', MARGIN_LEFT, yPos);
      yPos += 15;
      
      const tableHead = [['DESCRIÇÃO', 'QTDE', 'VL. UNIT.', 'VL. TOTAL']];
      
      const tableBody = proposta.price_items.map(item => {
        const valorNum = parseFloat(item.valor || '0');
        const qtdeNum = parseInt(item.qtde || '1', 10);
        const totalItem = valorNum * qtdeNum;
        
        return [
          item.descricao,
          item.qtde,
          valorNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          totalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        ];
      });

      tableBody.push([
        { content: 'VALOR TOTAL:', styles: { fontStyle: 'bold' as const } } as any,
        '',
        '',
        { content: valorFormatado, styles: { fontStyle: 'bold' as const } } as any,
      ]);

      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: yPos,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        didDrawPage: (data) => {
          if (data.cursor) {
            yPos = data.cursor.y;
          }
        }
      });

      yPos = yPos + 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      
      // Valor total em vermelho
      doc.setTextColor(0, 0, 0);
      doc.text('Importa a presente proposta o valor final total de ', MARGIN_LEFT, yPos);
      
      const textoAntes = 'Importa a presente proposta o valor final total de ';
      const larguraTextoAntes = doc.getTextWidth(textoAntes);
      
      doc.setTextColor(255, 0, 0);
      doc.text(`${valorFormatado} (${proposta.valor_total_extenso})`, MARGIN_LEFT + larguraTextoAntes, yPos);
      
      doc.setTextColor(0, 0, 0);

      // PÁGINA 6: CONDIÇÕES GERAIS DE VENDA
      doc.addPage();
      addHeader(doc);
      yPos = 90;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('5-CONDIÇÕES GERAIS DE VENDA', MARGIN_LEFT, yPos);
      yPos += 10;
      
      const dataBase = proposta.data_base_proposta || new Date().toLocaleDateString('pt-BR');
      const prazoEntrega = proposta.prazo_entrega || '10 dias úteis';
      
      const conteudoItem5 = `5.1 DATA BASE DA PROPOSTA: ${dataBase}

5.2 CONDIÇÕES DE PAGAMENTO:
50% na entrada e o restante na entrega.
Ou dividido no cartão com os acréscimos da maquininha no ato
de contratação do serviço.

5.3 IMPOSTOS:
Empresa optante pelo simples nacional, não destaca impostos como ICMS e IPI,
com todos os impostos inclusos para faturamento como Materiais
avulsos por;
Peperaio Comunicação Visual: CNPJ 34.004.933/0001-79.
Rua 05 Qd. 61 Lt. 02 Setor Santos Dumont - Goiânia-GO.

5.4 PRAZO DE ENTREGA: ${prazoEntrega}

5.7 VALIDADE DESTA PROPOSTA: 10 dias da data de emissão.
Caso o cliente emita o "aceite" após o prazo de validade,
os preços apresentados estão sujeitos a reajuste.
CANCELAMENTO - No caso de cancelamento pelo
cliente, posterior à aprovação da proposta, a Peperaio
Comunicação Visual emitirá fatura, com vencimento a
vista, incluindo todas as despesas decorrentes,
deduzidos os valores até então recebidos do cliente.
Em qualquer hipótese de rescisão, as partes procederão a
um acerto de contas, considerando o valor dos serviços
executados e/ou comprometidos e despesas decorrentes
da rescisão para a Peperaio Comunicação Visual, contra o
valor dos pagamentos até então recebidos por esta do
cliente.

5.8 CONDIÇÕES GERAIS DE FORNECIMENTO: Fazem
parte integrante da presente proposta as "Condições
Gerais de Fornecimento de Bens e Serviços Peperaio",
que acompanham o presente.

5.9 ATRASO NO PAGAMENTO: Ocorrendo atraso no
pagamento, seja de parcela principal e/ou de reajuste, os
valores em atraso serão acrescidos de multa moratória
equivalente a 1,5% (um e meio por cento), bem como,
juros equivalentes a 2% (dois por cento) ao mês, pelo
prazo que perdurar o atraso.`;
      yPos = addTextWithPageBreaks(doc, conteudoItem5, yPos, 10, 'normal');

      // PÁGINA 7: TERMO DE GARANTIA
      doc.addPage();
      addHeader(doc);
      yPos = 90;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('6-TERMO DE GARANTIA DE PRODUTOS ENGENHEIRADOS', MARGIN_LEFT, yPos);
      yPos += 10;
      
      const prazoGarantia = proposta.prazo_garantia_meses || '60';
      
      const conteudoItem6 = `1. É condição essencial para a validade desta garantia
que a compradora examine minuciosamente o produto
adquirido imediatamente após a sua entrega, observando
atentamente as suas características e as instruções de
instalação, ajuste, operação e manutenção do mesmo.
O produto será considerado aceito e automaticamente
aprovado pela compradora, quando não ocorrer a
manifestação por escrito da compradora sobre e
problemas técnicos ou arrependimento quando cabível,
no prazo máximo de sete dias úteis após a data de
entrega.

2. O prazo total de garantia dos produtos é de ${prazoGarantia}
meses, contados da data de fornecimento da
Peperaio Comunicação Visual, comprovado através da
nota fiscal de compra do Material engenhado.

3. A garantia total acima é composta de: (a) tratando-se de
relação de consumo, os primeiros 90 (noventa) dias serão
considerados para fins de garantia a que se refere o inciso II
do art. 26 da Lei 8.078/90, e o restante do período será
considerado como garantia contratual, nos termos do art.
50 da referida Lei; e (b) nos demais casos, os primeiros 30
(trinta) dias serão considerados para fins de garantia a que
se refere o caput do artigo 445 do Código Civil Brasileiro.

4. em caso de defeito ou situações inadequadas do
produto em garantia, os serviços em garantia serão
realizados a critério da Peperaio Comunicação Visual.

5. O produto, na ocorrência de uma anomalia deverá estar
disponível para o fornecedor, pelo período necessário para
a identificação da causa da anomalia e seus devidos
reparos.

6. A Peperaio Comunicação Visual examinará o produto ou
material com defeito, e, caso comprove a existência de
defeito coberto pela garantia, reparará, modificará ou
substituirá o material defeituoso, a seu critério, sem custos
para a compradora, exceto os mencionados.

7. A responsabilidade da presente garantia se limita
exclusivamente ao reparo do produto fornecido, não se
responsabilizando a Peperaio Comunicação Visual por
danos a pessoas, a terceiros, a outros equipamentos ou
instalações, lucros cessantes ou quaisquer outros danos
emergentes ou consequentes.

8. Outras despesas como fretes, embalagens, custos de
montagem e desmontagem, parametrização, correrão por
conta exclusiva da compradora, inclusive todos as despesas
de locomoção/estadia do pessoal de assistência Técnica e
eventuais horas extras, quando for necessário e/ou
solicitado um atendimento nas instalações do usuário.

9. A presente garantia não abrange o desgaste normal dos
produtos ou materiais, nem os danos decorrentes de
operação ou instalação indevida ou negligente em
desacordo com as especificações técnicas, parametrização
incorreta, manutenção ou armazenagem inadequada,
instalações de má qualidade ou influências de natureza
química, eletroquímica, elétrica, mecânica ou atmosférica.

10. Ficam excluídas da responsabilidade por defeitos as
partes ou peças consideradas de consumo, tais como,
Luminárias, relés fototimer, protetores contra surtos, para
raios, etc.

11. A garantia extinguir-se-á, independentemente de
qualquer aviso, se a compradora sem prévia autorização
por escrito da Peperaio Comunicação Visual, fizer ou
mandar fazer por terceiros, quaisquer modificações ou
reparos no produto ou equipamento que vier a
apresentar anomalia, ou qualquer modificação a gosto
ou critério do cliente.

12. O direito à garantia ficará suspenso em caso de mora
ou inadimplemento de obrigações da compradora para
com a Peperaio Comunicação Visual, nos termos do
disposto no artigo 476 do Código Civil Brasileiro, sendo
que o lapso temporal da suspensão será considerado
garantia decorrida, caso a compradora, posteriormente,
cumpra suas obrigações para com a Peperaio Visual.

13. Quaisquer reparos, modificações, substituições
decorrentes de defeitos de fabricação não
interrompem nem prorrogam o prazo desta garantia.

14. A garantia oferecida pela Peperaio Comunicação
Visual está condicionada à observância destas
condições gerais, sendo este o único termo de garantia
visto.`;
      yPos = addTextWithPageBreaks(doc, conteudoItem6, yPos, 10, 'normal');

      // PÁGINA FINAL: ASSINATURA
      if (yPos > FOOTER_Y - 50) {
        doc.addPage();
        addHeader(doc);
        yPos = 90;
      } else {
        yPos += 15;
      }
      const finalText = 'Esperando haver atendido as suas expectativas permanecemos à sua disposição para quaisquer esclarecimentos, revisão ou alteração que se façam necessários.';
      yPos = addTextWithPageBreaks(doc, finalText, yPos, 11, 'normal');
      yPos += 15;
      doc.text('Cordialmente,', MARGIN_LEFT, yPos);
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Isaac Peperaio', MARGIN_LEFT, yPos);
      doc.setFont('helvetica', 'normal');
      const nameWidth = doc.getTextWidth('Isaac Peperaio ');
      doc.text('(61) 981966308', MARGIN_LEFT + nameWidth, yPos);
      yPos += 5;
      doc.text('Depto. Engenharia e Montagem', MARGIN_LEFT, yPos);

      // Usar função de download otimizada para mobile
      const filename = `Proposta_${proposta.proposta_numero.replace(/\s/g, '_')}.pdf`;
      await downloadPDFMobile(doc, filename);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao exportar PDF!');
    }
  };

  const handleFinalizarProposta = async () => {
    if (!canDelete) {
      toast.error('Você não tem permissão para finalizar propostas!');
      return;
    }

    if (!editingProposta || !nomeObra.trim()) {
      toast.error('Digite um nome para a obra!');
      return;
    }

    const valorTotal = calcularValorTotal(editingProposta.price_items);

    // Criar nova obra
    const { data: obraData, error: obraError } = await supabase
      .from('obras')
      .insert({
        nome: nomeObra,
        orcamento: valorTotal,
        lucro: 0,
        finalizada: false,
      })
      .select();

    if (obraError) {
      toast.error('Erro ao criar obra!');
      console.error(obraError);
      return;
    }

    // Marcar proposta como finalizada
    const { error: propostaError } = await supabase
      .from('propostas')
      .update({ finalizada: true })
      .eq('id', editingProposta.id);

    if (propostaError) {
      toast.error('Erro ao finalizar proposta!');
      console.error(propostaError);
      return;
    }

    toast.success(`Obra "${nomeObra}" criada com sucesso!`);
    setIsFinalizarDialogOpen(false);
    setNomeObra('');
    loadPropostas();
  };

  if (loading) {
    return (
      <div className="propostas-container">
        <div className="automacao-loading">
          <div className="automacao-spinner"></div>
          <p className="automacao-loading-text">Carregando propostas...</p>
        </div>
      </div>
    );
  }

  const propostasAtivas = propostas.filter(p => !p.finalizada);
  const propostasFinalizadas = propostas.filter(p => p.finalizada);

  return (
    <div className="propostas-container">
      {/* Header */}
      <div className="propostas-header">
        <div className="propostas-header-content">
          <h1>Propostas Comerciais</h1>
          <p>Gerencie todas as propostas salvas no sistema</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="propostas-summary">
        <div className="propostas-summary-card total">
          <div className="propostas-summary-header">
            <div className="propostas-summary-icon">
              <FileText size={24} />
            </div>
            <div className="propostas-summary-info">
              <h3>Total de Propostas</h3>
              <p>{propostas.length}</p>
            </div>
          </div>
        </div>

        <div className="propostas-summary-card ativas">
          <div className="propostas-summary-header">
            <div className="propostas-summary-icon">
              <FileDown size={24} />
            </div>
            <div className="propostas-summary-info">
              <h3>Propostas Ativas</h3>
              <p>{propostasAtivas.length}</p>
            </div>
          </div>
        </div>

        <div className="propostas-summary-card finalizadas">
          <div className="propostas-summary-header">
            <div className="propostas-summary-icon">
              <CheckCircle size={24} />
            </div>
            <div className="propostas-summary-info">
              <h3>Propostas Finalizadas</h3>
              <p>{propostasFinalizadas.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Propostas Grid */}
      {propostas.length === 0 ? (
        <div className="propostas-empty">
          <div className="propostas-empty-icon">
            <FileText size={40} />
          </div>
          <h3>Nenhuma proposta encontrada</h3>
          <p>As propostas salvas aparecerão aqui</p>
        </div>
      ) : (
        <div className="propostas-grid">
          {propostas.map((proposta) => (
            <div 
              key={proposta.id} 
              className={`proposta-card ${proposta.finalizada ? 'finalizada' : 'ativa'}`}
            >
              {/* Card Header */}
              <div className="proposta-card-header">
                <div className="proposta-card-title-section">
                  <h3 className="proposta-card-numero">
                    <FileText />
                    {proposta.proposta_numero}
                  </h3>
                  <h2 className="proposta-card-cliente">{proposta.cliente_nome}</h2>
                </div>
                <Badge 
                  className={`proposta-badge ${proposta.finalizada ? 'finalizada' : 'ativa'}`}
                >
                  {proposta.finalizada ? (
                    <>
                      <CheckCircle />
                      Finalizada
                    </>
                  ) : (
                    'Ativa'
                  )}
                </Badge>
              </div>

              {/* Card Info */}
              <div className="proposta-info">
                <div className="proposta-info-row">
                  <span className="proposta-info-label">
                    <User size={16} />
                    Contato
                  </span>
                  <span className="proposta-info-value">{proposta.cliente_contato}</span>
                </div>
                <div className="proposta-info-row">
                  <span className="proposta-info-label">
                    <Calendar size={16} />
                    Emissão
                  </span>
                  <span className="proposta-info-value">{proposta.data_emissao}</span>
                </div>
                <div className="proposta-info-row">
                  <span className="proposta-info-label">
                    <DollarSign size={16} />
                    Valor Total
                  </span>
                  <span className="proposta-info-value highlight">
                    {formatCurrency(calcularValorTotal(proposta.price_items))}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="proposta-card-actions">
                <button
                  onClick={() => {
                    setEditingProposta(proposta);
                    setIsEditDialogOpen(true);
                  }}
                  className="propostas-btn-icon edit"
                  title="Editar Proposta"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => exportarPDFProposta(proposta)}
                  className="propostas-btn propostas-btn-pdf"
                >
                  <FileDown size={16} />
                  Exportar PDF
                </button>
                {!proposta.finalizada && canDelete && (
                  <button
                    onClick={() => {
                      setEditingProposta(proposta);
                      setIsFinalizarDialogOpen(true);
                    }}
                    className="propostas-btn propostas-btn-finalizar"
                  >
                    <CheckCircle size={16} />
                    Finalizar
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDeleteProposta(proposta.id)}
                    className="propostas-btn-icon delete"
                    title="Excluir Proposta"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="propostas-dialog-content">
          <div className="propostas-dialog-header">
            <h2 className="propostas-dialog-title">
              <Edit2 />
              Editar Proposta
            </h2>
          </div>

          {editingProposta && (
            <>
              <div className="propostas-dialog-body">
                {/* Seção de Informações Básicas */}
                <div className="propostas-form-section">
                  <h3 className="propostas-form-section-title">
                    <User />
                    Informações do Cliente
                  </h3>
                  <div className="propostas-form-grid">
                    <div className="propostas-form-field">
                      <label>Nome do Cliente</label>
                      <Input
                        value={editingProposta.cliente_nome}
                        onChange={(e) =>
                          setEditingProposta({ ...editingProposta, cliente_nome: e.target.value })
                        }
                      />
                    </div>
                    <div className="propostas-form-field">
                      <label>Contato</label>
                      <Input
                        value={editingProposta.cliente_contato}
                        onChange={(e) =>
                          setEditingProposta({ ...editingProposta, cliente_contato: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="propostas-form-field">
                    <label>Número da Proposta</label>
                    <Input
                      value={editingProposta.proposta_numero}
                      readOnly
                      disabled
                      style={{ background: '#0f1526', cursor: 'not-allowed', opacity: 0.7 }}
                      title="Ao salvar, a revisão será incrementada automaticamente"
                    />
                    <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                      Revisão atual: R{editingProposta.numero_revisao.toString().padStart(2, '0')} →
                      Próxima revisão: R{(editingProposta.numero_revisao + 1).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>

                {/* Seção de Escopo e Pagamento */}
                <div className="propostas-form-section">
                  <h3 className="propostas-form-section-title">
                    <FileText />
                    Escopo e Condições
                  </h3>
                  <div className="propostas-form-field full">
                    <label>Escopo de Fornecimento</label>
                    <Textarea
                      value={editingProposta.escopo_fornecimento}
                      onChange={(e) =>
                        setEditingProposta({ ...editingProposta, escopo_fornecimento: e.target.value })
                      }
                      rows={6}
                    />
                  </div>

                  <div className="propostas-form-field full">
                    <label>Condições de Pagamento</label>
                    <Textarea
                      value={editingProposta.condicoes_pagamento}
                      onChange={(e) =>
                        setEditingProposta({ ...editingProposta, condicoes_pagamento: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                </div>

                {/* Seção de Itens de Preço */}
                <div className="propostas-form-section">
                  <h3 className="propostas-form-section-title">
                    <DollarSign />
                    Itens de Preço
                  </h3>
                  
                  <div className="propostas-price-items">
                    {editingProposta.price_items.map((item, index) => (
                      <div key={item.id} className="propostas-price-item">
                        <div className="propostas-price-item-header">
                          <span className="propostas-price-item-label">Item {index + 1}</span>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="propostas-price-item-remove"
                          >
                            <Trash2 size={14} />
                            Remover
                          </button>
                        </div>
                        <div className="propostas-price-item-fields">
                          <div className="propostas-form-field">
                            <label>Descrição</label>
                            <Input
                              placeholder="Descrição do item"
                              value={item.descricao}
                              onChange={(e) => handleItemChange(item.id, 'descricao', e.target.value)}
                            />
                          </div>
                          <div className="propostas-form-field">
                            <label>Qtde</label>
                            <Input
                              type="number"
                              placeholder="1"
                              value={item.qtde}
                              onChange={(e) => handleItemChange(item.id, 'qtde', e.target.value)}
                            />
                          </div>
                          <div className="propostas-form-field">
                            <label>Valor (R$)</label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={item.valor}
                              onChange={(e) => handleItemChange(item.id, 'valor', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button onClick={handleAddItem} className="propostas-btn-add-item">
                    <Plus size={18} />
                    Adicionar Novo Item
                  </button>

                  <p style={{ color: '#34d399', fontSize: '1.1rem', fontWeight: '700', marginTop: '1rem' }}>
                    Valor Total: {formatCurrency(calcularValorTotal(editingProposta.price_items))}
                  </p>
                </div>

                {/* Seção de Garantia */}
                {/* Seção de Garantia */}
                <div className="propostas-form-section">
                  <div className="propostas-form-grid">
                    <div className="propostas-form-field">
                      <label>Valor Total por Extenso</label>
                      <Input
                        value={editingProposta.valor_total_extenso}
                        onChange={(e) =>
                          setEditingProposta({ ...editingProposta, valor_total_extenso: e.target.value })
                        }
                      />
                    </div>
                    <div className="propostas-form-field">
                      <label>Prazo Garantia (meses)</label>
                      <Input
                        type="number"
                        value={editingProposta.prazo_garantia_meses}
                        onChange={(e) =>
                          setEditingProposta({ ...editingProposta, prazo_garantia_meses: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="propostas-dialog-footer">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="propostas-btn">
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} className="propostas-btn propostas-btn-primary">
                  Salvar Alterações
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Finalizar */}
      <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
        <DialogContent className="propostas-dialog-content" style={{ maxWidth: '520px' }}>
          {editingProposta && (
            <>
              <div className="propostas-dialog-header">
                <h2 className="propostas-dialog-title">
                  <CheckCircle style={{ color: '#34d399' }} />
                  Finalizar Proposta
                </h2>
              </div>

              <div className="propostas-dialog-body">
              {/* Card com informações da proposta */}
              <div className="propostas-finalizar-info">
                <div className="propostas-finalizar-badge">
                  <FileText size={14} />
                  PROPOSTA
                </div>
                <h3 style={{ color: '#e6eef8', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  {editingProposta.proposta_numero}
                </h3>
                
                <div className="propostas-finalizar-details">
                  <p><strong>Cliente:</strong> {editingProposta.cliente_nome}</p>
                  <p><strong>Contato:</strong> {editingProposta.cliente_contato}</p>
                </div>
                
                <div className="propostas-finalizar-total">
                  <span className="propostas-finalizar-total-label">Valor Total:</span>
                  <span className="propostas-finalizar-total-value">
                    {formatCurrency(calcularValorTotal(editingProposta.price_items))}
                  </span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                  Será definido como orçamento da obra
                </p>
              </div>

              {/* Input do nome da obra */}
              <div className="propostas-form-field full">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={16} />
                  Nome da Nova Obra *
                </label>
                <Input
                  id="nome-obra"
                  placeholder="Ex: Fachada ENF Clinic"
                  value={nomeObra}
                  onChange={(e) => setNomeObra(e.target.value)}
                  autoFocus
                />
                <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  Escolha um nome descritivo para esta obra
                </p>
              </div>
            </div>

            <div className="propostas-dialog-footer">
              <Button 
                type="button"
                variant="outline"
                  onClick={() => {
                    setIsFinalizarDialogOpen(false);
                    setNomeObra('');
                  }}
                  className="propostas-btn"
                >
                  Cancelar
                </Button>
                <Button 
                  type="button"
                  onClick={handleFinalizarProposta} 
                  disabled={!nomeObra.trim()}
                  className="propostas-btn propostas-btn-finalizar"
                  style={{
                    background: !nomeObra.trim() ? '#475569' : 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                    opacity: !nomeObra.trim() ? 0.5 : 1,
                    cursor: !nomeObra.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  <CheckCircle size={16} />
                  Criar Obra
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
