import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { FileDown, FileText, DollarSign, Calendar, User, Trash2, Plus } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // ⚠️ GARANTA QUE ISSO ESTÁ INSTALADO (npm install jspdf-autotable)
import { supabase } from '../utils/supabaseClient';
import './AutomacaoPdf.css';

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

// --- TEXTOS ESTÁTICOS DA PROPOSTA ---
// (textPage2, textPage4, textPage6, textPage7_9 ... permanecem iguais)
const textPage2 = `
1-ESCOPO DE FORNECIMENTO
2-EXCLUSÕES / LISTA DE DESVIOS
3-NOTAS TÉCNICAS
4-PREÇOS
5-CONDIÇÕES GERAIS DE VENDAS
6-TERMO DE GARANTIA DE PRODUTOS ENGENHEIRADOS
`;

const textPage4 = `
2-EXCLUSÕES / LISTA DE DESVIOS
2.1 não estão inclusos os services e materiais de instalação elétrica (externo aos paineis presentes nesta oferta), assim como a montagem e instalação dos mesmos;
2.2 nos ateremos apenas, as letras e painéis apresentados no projeto, qualquer acréscimo de iluminação, será cobrado a parte.
2.3 não estão inclusos no escopo de fornecimento quaisquer serviços que não estejam relacionados nesta proposta
2.4 não estamos ofertando luminárias, ficando a cargo do cliente as escolhas das mesmas, se assim desejar, e caso queira nos contratar para tal, os valores não estão inclusos nesta proposta.
2.5 não serão fornecidos quaisquer materiais e serviços que não estejam claramente mencionados no Item 1 desta proposta - Escopo de Fornecimento e/ou que não foram negociados entre as partes, tais como: Luminárias, forros, instalações elétricas e outros.

3-NOTAS TÉCNICAS
3.1 para elaboração da presente proposta consideramos as documentações técnicas e lista de materiais encaminhada nesta proposta
3.2 o material relacionado, possui garantia de 5 anos;
3.3 o projeto acima proposto, tem direitos autorais, sendo vedada a execução do mesmo por terceiros, sendo passível de multas previstas em lei
3.4 A garantia do serviço se dará na mesma quantidade da garantia do material.
3.5 Quaisquer divergências entre o ofertado e suas reais necessidades, poderão ser ajustadas mediante novo contrato, para tal, reservamo-nos o direito de rever os preços e prazos de entrega.
`;

const textPage6 = `
5-CONDIÇÕES GERAIS DE VENDA

5.1
DATA BASE DA PROPOSTA: 21/10/0000

5.2
CONDIÇÕES DE PAGAMENTO:
50% na entrada e o restante na entrega.
Ou dividido no cartão com os acréscimos da maquininha no ato
de contratação do serviço.

5.3
IMPOSTOS:
Empresa optante pelo simples nacional, não destaca impostos como ICMS e IPI,
com todos os impostos inclusos para faturamento como Materiais
avulsos por;
Peperaio Comunicação Visual: CNPJ 34.004.933/0001-79.
Rua 05 Qd. 61 Lt. 02 Setor Santos Dumont - Goiânia-GO.

5.4
PRAZO DE ENTREGA: 10 dias úteis após a contratação.

5.7
VALIDADE DESTA PROPOSTA: 10 dias da data de emissão.
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

5.8
CONDIÇÕES GERAIS DE FORNECIMENTO: Fazem
parte integrante da presente proposta as "Condições
Gerais de Fornecimento de Bens e Serviços Peperaio",
que acompanham o presente.

5.9
ATRASO NO PAGAMENTO: Ocorrendo atraso no
pagamento, seja de parcela principal e/ou de reajuste, os
valores em atraso serão acrescidos de multa moratória
equivalente a 1,5% (um e meio por cento), bem como,
juros equivalentes a 2% (dois por cento) ao mês, pelo
prazo que perdurar o atraso.
`;

const textPage7_9 = `
6-TERMO DE GARANTIA DE PRODUTOS ENGENHEIRADOS

1.
É condição essencial para a validade desta garantia
que a compradora examine minuciosamente o produto
adquirido imediatamente após a sua entrega, observando
atentamente as suas características e as instruções de
instalação, ajuste, operação e manutenção do mesmo.
O
produto será considerado aceito e automaticamente
aprovado pela compradora, quando não ocorrer a
manifestação por escrito da compradora sobre e
problemas técnicos ou arrependimento quando cabível,
no prazo máximo de sete dias úteis após a data de
entrega.

2.
O prazo total de garantia dos produtos é de sessenta
(60) meses, contados da data de fornecimento da
Peperaio Comunicação Visual, comprovado através da
nota fiscal de compra do Material engenhado.

3.
A garantia total acima é composta de: (a) tratando-se de
relação de consumo, os primeiros 90 (noventa) dias serão
considerados para fins de garantia a que se refere o inciso II
do art.
26 da Lei $8.078/90,$ e o restante do período será
considerado como garantia contratual, nos termos do art.
50 da referida Lei; e (b) nos demais casos, os primeiros 30
(trinta) dias serão considerados para fins de garantia a que
se refere o caput do artigo 445 do Código Civil Brasileiro.

4.
em caso de defeito ou situações inadequadas do
produto em garantia, os serviços em garantia serão
realizados a critério da Peperaio Comunicação Visual.

5.
O produto, na ocorrência de uma anomalia deverá estar
disponível para o fornecedor, pelo período necessário para
a identificação da causa da anomalia e seus devidos
reparos.

6.
A Peperaio Comunicação Visual examinará o produto ou
material com defeito, e, caso comprove a existência de
defeito coberto pela garantia, reparará, modificará ou
substituirá o material defeituoso, a seu critério, sem custos
para a compradora, exceto os mencionados.

7.
A responsabilidade da presente garantia se limita
exclusivamente ao reparo do produto fornecido, não se
responsabilizando a Peperaio Comunicação Visual por
danos a pessoas, a terceiros, a outros equipamentos ou
instalações, lucros cessantes ou quaisquer outros danos
emergentes ou consequentes.

8.
Outras despesas como fretes, embalagens, custos de
montagem e desmontagem, parametrização, correrão por
conta exclusiva da compradora, inclusive todos as despesas
de locomoção/estadia do pessoal de assistência Técnica e
eventuais horas extras, quando for necessário e/ou
solicitado um atendimento nas instalações do usuário.

9.
A presente garantia não abrange o desgaste normal dos
produtos ou materiais, nem os danos decorrentes de
operação ou instalação indevida ou negligente em
desacordo com as especificações técnicas, parametrização
incorreta, manutenção ou armazenagem inadequada,
instalações de má qualidade ou influências de natureza
química, eletroquímica, elétrica, mecânica ou atmosférica.

10.
Ficam excluídas da responsabilidade por defeitos as
partes ou peças consideradas de consumo, tais como,
Luminárias, relés fototimer, protetores contra surtos, para
raios, etc.

11.
A garantia extinguir-se-á, independentemente de
qualquer aviso, se a compradora sem prévia autorização
por escrito da Peperaio Comunicação Visual, fizer ou
mandar fazer por terceiros, quaisquer modificações ou
reparos no produto ou equipamento que vier a
apresentar anomalia, ou qualquer modificação a gosto
ou critério do cliente.

12.
O direito à garantia ficará suspenso em caso de mora
ou inadimplemento de obrigações da compradora para
com a Peperaio Comunicação Visual, nos termos do
disposto no artigo 476 do Código Civil Brasileiro, sendo
que o lapso temporal da suspensão será considerado
garantia decorrida, caso a compradora, posteriormente,
cumpra suas obrigações para com a Peperaio Visual.

13.
Quaisquer reparos, modificações, substituições
decorrentes de defeitos de fabricação não
interrompem nem prorrogam o prazo desta garantia.

14.
A garantia oferecida pela Peperaio Comunicação
Visual está condicionada à observância destas
condições gerais, sendo este o único termo de garantia
visto.
`;
// --- FIM DOS TEXTOS ESTÁTICOS ---


// Configurações de Posição
const MARGIN_LEFT = 20;
const MARGIN_TOP = 20;
const PAGE_WIDTH = 210; // A4
const PAGE_HEIGHT = 297; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT * 2;
const FOOTER_Y = PAGE_HEIGHT - MARGIN_TOP;

// --- FUNÇÕES AUXILIARES DO PDF ---

const addHeader = (doc: jsPDF) => {
  // Logo PEPERAIO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('PEPERAIO', MARGIN_LEFT, MARGIN_TOP);
  
  doc.setFont('brush script mt', 'italic');
  doc.setFontSize(12);
  doc.text('Comunicação Visual', MARGIN_LEFT, MARGIN_TOP + 7);

  // Informações de Contato (Isaac e Marcos) - agora na mesma linha
  const contactX = PAGE_WIDTH - MARGIN_LEFT;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Isaac Peperaio e telefone
  doc.text('Isaac Peperaio  Marcos Peperaio', contactX, MARGIN_TOP, { align: 'right' });
  doc.text('62 98427-4856      61 98196-6308', contactX, MARGIN_TOP + 5, { align: 'right' });

  // Linhas coloridas (verde e vermelho)
  doc.setLineWidth(2);
  doc.setDrawColor(0, 128, 0); // Verde
  doc.line(MARGIN_LEFT, MARGIN_TOP + 15, PAGE_WIDTH - MARGIN_LEFT, MARGIN_TOP + 15);
  
  doc.setDrawColor(255, 0, 0); // Vermelho
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
  const lineHeight = fontSize * 0.7; // Espaçamento mais seguro
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);

  lines.forEach((line: string) => {
    if (y > FOOTER_Y - 10) { // Checa se precisa de nova página
      doc.addPage();
      addHeader(doc);
      y = MARGIN_TOP + 35; // Posição Y inicial após o cabeçalho
    }

    // Identifica títulos
    const trimmedLine = line.trim();
    // Bolds lines starting with numbers (e.g., "2.1") OR lines ending with a colon (e.g., "Cores definidas:")
    if (trimmedLine.match(/^(\d+(\.\d+)?(\s)?(\.|-))/) || trimmedLine.endsWith(':')) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', fontStyle);
    }

    doc.text(line, MARGIN_LEFT, y);
    y += lineHeight; // Espaçamento entre linhas
  });

  return y; // Retorna a nova posição Y
};

/**
 * Esta função é chamada UMA VEZ quando o componente carrega.
 */
const getInitialState = () => {
  // Retorna o objeto de estado completo
  return {
    clienteNome: 'ENF CLINIC',
    clienteContato: 'Elizeu',
    clienteCnpj: '', // Novo campo
    clienteEndereco: '', // Novo campo
    
    // --- Campo manual para número da proposta ---
    propostaNumero: '2025 570-R04', // <- Coloque um valor padrão
    
    dataEmissao: new Date().toLocaleDateString('pt-BR'),
    escopoFornecimento: `Descrição do Serviço:
Estruturação completa de uma marquise com as seguintes dimensões:
Largura: 8,06 metros
Altura: 1,50 metro
Comprimento (avanço): 1,10 metro

Composição e Materiais:
Cobertura em telhas galvalume 25 mm, garantindo alta durabilidade e resistência.
Revestimento em ACM 3 mm, com garantia de 5 anos.
Letras caixa em PVC expandido 20 mm, iluminadas com LED, conforme o projeto fornecido pelo cliente.
Revestimento das colunas frontais da loja em ACM, acompanhando o mesmo padrão estético da marquise.

Cores definidas:
Fachada: ACM na cor bege fosco;
Testeira superior da fachada: ACM na cor chocolate.

Prazo de Execução:
10 (dez) dias úteis após a formalização do contrato e pagamento da entrada.
`,
    condicoesPagamento: `Condições de Pagamento:
50% de entrada no ato da contratação;
50% restante ao término da obra, podendo ser dividido conforme condições previamente acordadas entre as partes.
`,
    
    // --- MUDANÇA: Array de itens de preço ---
    priceItems: [
      { 
        id: '1', // Um ID para o React
        descricao: 'Material e mão de Obra.', 
        qtde: '1', 
        valor: '15300.00' 
      }
    ],
    // Mantenha o valor por extenso (agora será usado para o total)
    valorTotalExtenso: 'Quinze mil e trezentos reais',
    
    // Prazo de garantia em meses
    prazoGarantiaMeses: '60',
    
    // Campos 5.1 e 5.4
    dataBaseProposta: new Date().toLocaleDateString('pt-BR'), // 5.1
    prazoEntrega: '10 dias úteis', // 5.4
  };
};


// --- COMPONENTE REACT ---

export default function AutomacaoPdf() {
  const [pdfData, setPdfData] = useState(getInitialState);
  const [proximoNumeroPreview, setProximoNumeroPreview] = useState<number | null>(null);
  const [carregandoNumero, setCarregandoNumero] = useState(true);

  // Carregar APENAS PARA VISUALIZAÇÃO (não incrementa o contador)
  useEffect(() => {
    const carregarPreviewNumero = async () => {
      try {
        // Busca apenas para preview, não incrementa
        const { data, error } = await supabase
          .from('propostas_sequencia')
          .select('ultimo_numero')
          .eq('id', 1)
          .single();

        if (error || !data) {
          console.error('Erro ao buscar preview do número:', error);
          setProximoNumeroPreview(570);
        } else {
          // Mostra o próximo número (último + 1) mas não incrementa ainda
          setProximoNumeroPreview(data.ultimo_numero + 1);
        }
      } catch (error) {
        console.error('Erro ao carregar preview do número:', error);
        setProximoNumeroPreview(570);
      } finally {
        setCarregandoNumero(false);
      }
    };

    carregarPreviewNumero();
  }, []);

  // Atualizar o número da proposta quando proximoNumeroPreview mudar
  useEffect(() => {
    if (proximoNumeroPreview !== null) {
      const anoAtual = new Date().getFullYear();
      const numeroCompleto = `${anoAtual} ${proximoNumeroPreview}-R01`;
      setPdfData(prev => ({
        ...prev,
        propostaNumero: numeroCompleto
      }));
    }
  }, [proximoNumeroPreview]);

  // --- FUNÇÕES DE GERENCIAMENTO DE ITENS ---

  // Função para ADICIONAR um novo item em branco
  const handleAddItem = () => {
    const newItem = {
      id: Date.now().toString(), // ID único
      descricao: 'Novo item',
      qtde: '1',
      valor: '0.00',
    };
    setPdfData(prev => ({
      ...prev,
      priceItems: [...prev.priceItems, newItem]
    }));
  };

  // Função para REMOVER um item pelo ID
  const handleRemoveItem = (id: string) => {
    setPdfData(prev => ({
      ...prev,
      priceItems: prev.priceItems.filter(item => item.id !== id)
    }));
  };

  // Função para ATUALIZAR um campo de um item específico
  const handleItemChange = (id: string, field: 'descricao' | 'qtde' | 'valor', value: string) => {
    setPdfData(prev => ({
      ...prev,
      priceItems: prev.priceItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // --- FIM DAS FUNÇÕES DE GERENCIAMENTO ---

  // Função para converter número em extenso (simplificada para meses)
  const converterNumeroParaExtenso = (numero: string): string => {
    const num = parseInt(numero);
    const extenso: { [key: number]: string } = {
      1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco',
      6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez',
      11: 'onze', 12: 'doze', 13: 'treze', 14: 'quatorze', 15: 'quinze',
      16: 'dezesseis', 17: 'dezessete', 18: 'dezoito', 19: 'dezenove', 20: 'vinte',
      24: 'vinte e quatro', 30: 'trinta', 36: 'trinta e seis',
      48: 'quarenta e oito', 60: 'sessenta', 72: 'setenta e dois',
      84: 'oitenta e quatro', 96: 'noventa e seis', 120: 'cento e vinte'
    };
    return extenso[num] || numero;
  };

  const handleExportPDF = async () => {
    // --- CÁLCULO DO VALOR TOTAL ---
    // Calcule o total BEM NO INÍCIO da função
    const totalSum = pdfData.priceItems.reduce((acc, item) => {
      // Garante que o valor é um número, mesmo se estiver vazio
      const valorItem = parseFloat(item.valor || '0');
      const qtdeItem = parseInt(item.qtde || '1', 10);
      return acc + (valorItem * qtdeItem);
    }, 0);
    
    // Formata para R$
    const valorFormatado = totalSum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // 1. Validação dos campos
    if (!pdfData.clienteNome || !pdfData.clienteContato || !pdfData.propostaNumero || !pdfData.escopoFornecimento || pdfData.priceItems.length === 0 || !pdfData.valorTotalExtenso || !pdfData.dataBaseProposta || !pdfData.prazoEntrega) {
      toast.error('Erro: Preencha todos os campos obrigatórios (*)');
      return; // Para a execução aqui
    }

    // 2. OBTER O PRÓXIMO NÚMERO SEQUENCIAL (só agora, ao exportar)
    let numeroSequencialFinal: number;
    let numeroPropostaFinal: string;
    
    try {
      const { data: numeroData, error: numeroError } = await supabase
        .rpc('get_next_numero_sequencial');

      if (numeroError) {
        console.error('Erro ao obter número sequencial:', numeroError);
        toast.error('Erro ao gerar número da proposta!');
        return;
      }

      numeroSequencialFinal = numeroData;
      const anoAtual = new Date().getFullYear();
      numeroPropostaFinal = `${anoAtual} ${numeroSequencialFinal}-R01`;
      
      // Atualiza o estado para refletir o número real usado
      setPdfData(prev => ({ ...prev, propostaNumero: numeroPropostaFinal }));
      setProximoNumeroPreview(numeroSequencialFinal + 1); // Atualiza o preview para o próximo
      
    } catch (error) {
      console.error('Erro ao obter número sequencial:', error);
      toast.error('Erro ao gerar número da proposta!');
      return;
    }

    // 3. SALVAR A PROPOSTA NO BANCO DE DADOS ANTES DE GERAR O PDF
    try {
      const { data: propostaData, error: propostaError } = await supabase
        .from('propostas')
        .insert({
          cliente_nome: pdfData.clienteNome,
          cliente_contato: pdfData.clienteContato,
          cliente_cnpj: pdfData.clienteCnpj || null,
          cliente_endereco: pdfData.clienteEndereco || null,
          proposta_numero: numeroPropostaFinal, // Usa o número recém-gerado
          numero_sequencial: numeroSequencialFinal, // Salva o número sequencial
          numero_revisao: 1, // Primeira versão sempre é R01
          data_emissao: pdfData.dataEmissao,
          escopo_fornecimento: pdfData.escopoFornecimento,
          condicoes_pagamento: pdfData.condicoesPagamento,
          price_items: pdfData.priceItems,
          valor_total_extenso: pdfData.valorTotalExtenso,
          prazo_garantia_meses: pdfData.prazoGarantiaMeses,
          data_base_proposta: pdfData.dataBaseProposta,
          prazo_entrega: pdfData.prazoEntrega,
          finalizada: false,
        })
        .select();

      if (propostaError) {
        console.error('Erro ao salvar proposta:', propostaError);
        toast.error('Erro ao salvar proposta no banco de dados!');
        return;
      }

      toast.success('Proposta salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar proposta:', error);
      toast.error('Erro ao salvar proposta!');
      return;
    }

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      let yPos = 0; 

      // --- PÁGINA 1: CAPA ---
      addHeader(doc);
      yPos = 70; 
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      // Usa o número da proposta recém-gerado
      doc.text(`Proposta: ${numeroPropostaFinal} - Técnica e Comercial`, MARGIN_LEFT, yPos);
      
      yPos += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('DE: PEPERAIO COMUNICAÇÃO VISUAL', MARGIN_LEFT, yPos);
      yPos += 7;
      doc.text(`PARA: ${pdfData.clienteNome.toUpperCase()}`, MARGIN_LEFT, yPos);
      yPos += 7;
      
      // Adicionar CNPJ se preenchido
      if (pdfData.clienteCnpj && pdfData.clienteCnpj.trim() !== '') {
        doc.text(`CNPJ: ${pdfData.clienteCnpj}`, MARGIN_LEFT, yPos);
        yPos += 7;
      }
      
      // Adicionar Endereço se preenchido
      if (pdfData.clienteEndereco && pdfData.clienteEndereco.trim() !== '') {
        doc.text(`Endereço: ${pdfData.clienteEndereco}`, MARGIN_LEFT, yPos);
        yPos += 7;
      }
      
      doc.text(`Emissão: ${pdfData.dataEmissao}`, MARGIN_LEFT, yPos);

      yPos += 15;
      doc.setFont('helvetica', 'bold');
      // Centraliza o título
      const titleText = '********** PROPOSTA TÉCNICA E COMERCIAL ***********';
      const titleWidth = doc.getTextWidth(titleText);
      const pageWidth = doc.internal.pageSize.getWidth();
      const titleX = (pageWidth - titleWidth) / 2;
      doc.text(titleText, titleX, yPos);
      
      yPos += 15;
      doc.setFont('helvetica', 'normal');
      const introText = `Prezado senhor(a) ${pdfData.clienteContato}, atendendo a sua consulta, temos a satisfação de apresentar-lhe nossa Proposta Técnica / Comercial para o fornecimento de fachada em referência, os quais serão construídos de acordo com as características técnicas mencionadas na proposta técnica.\n\nEsperamos desta forma ter correspondido às suas expectativas e colocamo-nos ao seu inteiro dispor para quaisquer esclarecimentos complementares.`;
      yPos = addTextWithPageBreaks(doc, introText, yPos, 11);

      yPos += 20;
      doc.text('Atenciosamente;', MARGIN_LEFT, yPos);
      yPos += 60; // Aumentado ainda mais para descer
      
      // Informações do Marcos Peperaio centralizadas
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

      // --- PÁGINA 2: ÍNDICE ---
      doc.addPage();
      addHeader(doc);
      yPos = 90;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      
      // Centraliza o título "Conteúdo!"
      const tituloConteudo = 'Conteúdo!';
      const tituloWidth = doc.getTextWidth(tituloConteudo);
      doc.text(tituloConteudo, (PAGE_WIDTH - tituloWidth) / 2, yPos);
      
      yPos += 25; // Espaçamento após o título
      
      // Renderiza cada item do índice com espaçamento
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
        yPos += 12; // Espaçamento entre itens
      });

      // --- PÁGINA 3: ESCOPO DE FORNECIMENTO (DINÂMICO) ---
      doc.addPage();
      addHeader(doc);
      yPos = 90;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('1-ESCOPO DE FORNECIMENTO', MARGIN_LEFT, yPos);
      yPos += 10;
      
  // 1. Renderiza o Escopo (agora sem as condições)
  yPos = addTextWithPageBreaks(doc, pdfData.escopoFornecimento || '---', yPos, 11, 'normal');
  yPos += 10; 
  // 2. Renderiza o Valor Total (usando o total calculado)
  doc.setFont('helvetica', 'bold');
  doc.text('Valor Total do Serviço:', MARGIN_LEFT, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(valorFormatado, MARGIN_LEFT, yPos); // <-- USA A SOMA CALCULADA
  yPos += 10; // Espaçamento
  // 3. Renderiza as Condições de Pagamento
  yPos = addTextWithPageBreaks(doc, pdfData.condicoesPagamento || '---', yPos, 11, 'normal');

      // --- PÁGINA 4: EXCLUSÕES E NOTAS TÉCNICAS (ESTÁTICO) ---
      doc.addPage();
      addHeader(doc);
      yPos = 90;
      
      // Renderiza título do item 2 com a mesma formatação do item 1
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('2-EXCLUSÕES / LISTA DE DESVIOS', MARGIN_LEFT, yPos);
      yPos += 10;
      
  // Conteúdo do item 2
  const conteudoItem2 = `2.1 não estão inclusos os services e materiais de instalação elétrica (externo aos paineis presentes nesta oferta), assim como a montagem e instalação dos mesmos;

2.2 nos ateremos apenas, as letras e painéis apresentados no projeto, qualquer acréscimo de iluminação, será cobrado a parte.

2.3 não estão inclusos no escopo de fornecimento quaisquer serviços que não estejam relacionados nesta proposta

2.4 não estamos ofertando luminárias, ficando a cargo do cliente as escolhas das mesmas, se assim desejar, e caso queira nos contratar para tal, os valores não estão inclusos nesta proposta.

2.5 não serão fornecidos quaisquer materiais e serviços que não estejam claramente mencionados no Item 1 desta proposta - Escopo de Fornecimento e/ou que não foram negociados entre as partes, tais como: Luminárias, forros, instalações elétricas e outros.`;
  yPos = addTextWithPageBreaks(doc, conteudoItem2, yPos, 10, 'normal');
  yPos += 10;
  // Renderiza título do item 3 com a mesma formatação do item 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('3-NOTAS TÉCNICAS', MARGIN_LEFT, yPos);
  yPos += 10;
  // Conteúdo do item 3
  const conteudoItem3 = `3.1 para elaboração da presente proposta consideramos as documentações técnicas e lista de materiais encaminhada nesta proposta

3.2 o material relacionado, possui garantia de 5 anos;

3.3 o projeto acima proposto, tem direitos autorais, sendo vedada a execução do mesmo por terceiros, sendo passível de multas previstas em lei

3.4 A garantia do serviço se dará na mesma quantidade da garantia do material.

3.5 Quaisquer divergências entre o ofertado e suas reais necessidades, poderão ser ajustadas mediante novo contrato, para tal, reservamo-nos o direito de rever os preços e prazos de entrega.`;
  yPos = addTextWithPageBreaks(doc, conteudoItem3, yPos, 10, 'normal');
  yPos += 10;

      // --- PÁGINA 5: PREÇOS (DINÂMICO) ---
      doc.addPage();
      addHeader(doc);
      yPos = 90;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('4-PREÇOS', MARGIN_LEFT, yPos);
      yPos += 15;
      
      const tableHead = [['DESCRIÇÃO', 'QTDE', 'VL. UNIT.', 'VL. TOTAL']];
      
      // CONSTRUÇÃO DINÂMICA DO CORPO DA TABELA
      const tableBody = pdfData.priceItems.map(item => {
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

      // Adiciona a linha de TOTAL GERAL
      tableBody.push([
        { content: 'VALOR TOTAL:', styles: { fontStyle: 'bold' as const } } as any,
        '', // Coluna Qtde vazia
        '', // Coluna Vl. Unit. vazia
        { content: valorFormatado, styles: { fontStyle: 'bold' as const } } as any, // Usa a soma total
      ]);

      // ***** LINHA CORRIGIDA AQUI *****
      autoTable(doc, {
        head: tableHead,
        body: tableBody, // <-- USA O CORPO DINÂMICO
        startY: yPos,
        theme: 'grid',
        headStyles: {
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 100 }, 
          1: { cellWidth: 20, halign: 'center' }, 
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
        },
        didDrawPage: (data) => {
          if (data.cursor) {
            yPos = data.cursor.y;
          }
        }
      });
      
      yPos = yPos + 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      
      // --- LINHA MODIFICADA: VALOR EM VERMELHO ---
      // Texto antes do valor
      doc.setTextColor(0, 0, 0); // Preto
      doc.text('Importa a presente proposta o valor final total de ', MARGIN_LEFT, yPos);
      
      // Calcula posição do valor
      const textoAntes = 'Importa a presente proposta o valor final total de ';
      const larguraTextoAntes = doc.getTextWidth(textoAntes);
      
      // Valor numérico e por extenso em VERMELHO
      doc.setTextColor(255, 0, 0); // Vermelho
      doc.text(`${valorFormatado} (${pdfData.valorTotalExtenso})`, MARGIN_LEFT + larguraTextoAntes, yPos);
      
      // Volta para cor preta
      doc.setTextColor(0, 0, 0);

      // --- PÁGINA 6: CONDIÇÕES GERAIS (ESTÁTICO) ---

  // --- PÁGINA 5: CONDIÇÕES GERAIS DE VENDA (sempre exporta) ---
  doc.addPage();
  addHeader(doc);
  yPos = 90;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('5-CONDIÇÕES GERAIS DE VENDA', MARGIN_LEFT, yPos);
  yPos += 10;
  const conteudoItem5 = `5.1 DATA BASE DA PROPOSTA: ${pdfData.dataBaseProposta}

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

5.4 PRAZO DE ENTREGA: ${pdfData.prazoEntrega}

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

  // --- PÁGINA 6: TERMO DE GARANTIA DE PRODUTOS ENGENHEIRADOS (sempre exporta) ---
  doc.addPage();
  addHeader(doc);
  yPos = 90;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('6-TERMO DE GARANTIA DE PRODUTOS ENGENHEIRADOS', MARGIN_LEFT, yPos);
  yPos += 10;
  const conteudoItem6 = `1. É condição essencial para a validade desta garantia
que a compradora examine minuciosamente o produto
adquirido imediatamente após a sua entrega, observando
atentamente as suas características e as instruções de
instalação, ajuste, operação e manutenção do mesmo.
O
produto será considerado aceito e automaticamente
aprovado pela compradora, quando não ocorrer a
manifestação por escrito da compradora sobre e
problemas técnicos ou arrependimento quando cabível,
no prazo máximo de sete dias úteis após a data de
entrega.

2. O prazo total de garantia dos produtos é de ${pdfData.prazoGarantiaMeses}
(${converterNumeroParaExtenso(pdfData.prazoGarantiaMeses)}) meses, contados da data de fornecimento da
Peperaio Comunicação Visual, comprovado através da
nota fiscal de compra do Material engenhado.

3. A garantia total acima é composta de: (a) tratando-se de
relação de consumo, os primeiros 90 (noventa) dias serão
considerados para fins de garantia a que se refere o inciso II
do art.
26 da Lei $8.078/90,$ e o restante do período será
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

  // --- PÁGINA FINAL: ASSINATURA ---
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

  // --- SALVAR O PDF ---
  const filename = `Proposta_${numeroPropostaFinal}_${pdfData.clienteNome}.pdf`;
  downloadPDFMobile(doc, filename);

    } catch (error) {
      console.error("Erro ao gerar o PDF:", error);
      toast.error("Ocorreu um erro ao gerar o PDF. Verifique o console.");
    }
  };

  return (
    <div className="automacao-container">
      <div className="automacao-header">
        <h1>
          <FileText style={{ display: 'inline', marginRight: '0.5rem' }} />
          Automação de Proposta Comercial
        </h1>
        <p>Preencha os campos abaixo para gerar a proposta técnica e comercial da PEPERAIO</p>
      </div>

      <Card className="automacao-card">
        <CardContent style={{ padding: 0 }}>
          
          {/* SEÇÃO 1: Informações Básicas */}
          <div className="automacao-section">
            <h3 className="automacao-section-title">
              <User />
              Informações do Cliente
            </h3>
            
            <div className="automacao-form-field">
              <label>Número da Proposta (Gerado Automaticamente)</label>
              {carregandoNumero ? (
                <Input
                  value="Carregando próximo número..."
                  disabled
                  style={{ background: '#0f1526', cursor: 'wait' }}
                />
              ) : (
                <Input
                  value={pdfData.propostaNumero}
                  readOnly
                  disabled
                  style={{ background: '#0f1526', cursor: 'not-allowed', opacity: 0.7 }}
                  title="Este número é gerado automaticamente"
                />
              )}
            </div>
            
            <div className="automacao-grid-2">
              <div className="automacao-form-field">
                <label>Nome do Cliente (Empresa) *</label>
                <Input
                  value={pdfData.clienteNome}
                  onChange={(e) => setPdfData({ ...pdfData, clienteNome: e.target.value })}
                  placeholder="Nome da Empresa Cliente"
                />
              </div>
              <div className="automacao-form-field">
                <label>Nome do Contato (Prezado Sr/Sra) *</label>
                <Input
                  value={pdfData.clienteContato}
                  onChange={(e) => setPdfData({ ...pdfData, clienteContato: e.target.value })}
                  placeholder="Nome do Contato"
                />
              </div>
            </div>
            
            <div className="automacao-grid-2">
              <div className="automacao-form-field">
                <label>CNPJ do Cliente</label>
                <Input
                  value={pdfData.clienteCnpj}
                  onChange={(e) => setPdfData({ ...pdfData, clienteCnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="automacao-form-field">
                <label>Endereço do Cliente</label>
                <Input
                  value={pdfData.clienteEndereco}
                  onChange={(e) => setPdfData({ ...pdfData, clienteEndereco: e.target.value })}
                  placeholder="Rua, Nº, Bairro, Cidade - UF"
                />
              </div>
            </div>
            
            <div className="automacao-form-field">
              <label>Data de Emissão</label>
              <Input
                value={pdfData.dataEmissao}
                onChange={(e) => setPdfData({ ...pdfData, dataEmissao: e.target.value })}
                placeholder="DD/MM/AAAA"
              />
            </div>
          </div>

          {/* SEÇÃO 2: Escopo de Fornecimento */}
          <div className="automacao-section">
            <h3 className="automacao-section-title">
              <FileText />
              1. Escopo de Fornecimento
            </h3>
            <p className="automacao-section-description">
              Digite ou cole o escopo completo aqui. Apenas quebras de linha serão mantidas (sem negrito ou cores).
            </p>
            <div className="automacao-form-field">
              <Textarea
                value={pdfData.escopoFornecimento}
                onChange={(e) => setPdfData({ ...pdfData, escopoFornecimento: e.target.value })}
                placeholder="Descreva o serviço..."
                rows={20}
                style={{ minHeight: '200px' }}
              />
            </div>
          </div>

          {/* SEÇÃO 3: Condições de Pagamento */}
          <div className="automacao-section">
            <h3 className="automacao-section-title">
              <DollarSign />
              Condições de Pagamento
            </h3>
            <div className="automacao-form-field">
              <Textarea
                value={pdfData.condicoesPagamento}
                onChange={(e) => setPdfData({ ...pdfData, condicoesPagamento: e.target.value })}
                placeholder="Descreva as condições de pagamento..."
                rows={5}
              />
            </div>
          </div>

          {/* SEÇÃO 4: Preços */}
          <div className="automacao-section">
            <h3 className="automacao-section-title">
              <DollarSign />
              4. Preços e Itens
            </h3>
            
            <div className="automacao-price-items">
              {pdfData.priceItems.map((item, index) => (
                <div key={item.id} className="automacao-price-item">
                  <div className="automacao-price-item-header">
                    <span className="automacao-price-item-label">Item {index + 1}</span>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="automacao-price-item-remove"
                    >
                      <Trash2 size={14} />
                      Remover
                    </button>
                  </div>
                  
                  <div className="automacao-price-item-fields">
                    <div className="automacao-form-field">
                      <label>Descrição do Item *</label>
                      <Input
                        value={item.descricao}
                        onChange={(e) => handleItemChange(item.id, 'descricao', e.target.value)}
                        placeholder="Material e mão de obra"
                      />
                    </div>
                    
                    <div className="automacao-form-field">
                      <label>Qtde *</label>
                      <Input
                        type="number"
                        value={item.qtde}
                        onChange={(e) => handleItemChange(item.id, 'qtde', e.target.value)}
                        placeholder="1"
                      />
                    </div>
                    
                    <div className="automacao-form-field">
                      <label>Valor (R$) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.valor}
                        onChange={(e) => handleItemChange(item.id, 'valor', e.target.value)}
                        placeholder="15300.00"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={handleAddItem} className="automacao-btn automacao-btn-add">
              <Plus size={18} />
              Adicionar Novo Item
            </button>

            <div className="automacao-divider"></div>

            <div className="automacao-grid-2">
              <div className="automacao-form-field">
                <label>Valor Total por Extenso *</label>
                <Input
                  value={pdfData.valorTotalExtenso}
                  onChange={(e) => setPdfData({ ...pdfData, valorTotalExtenso: e.target.value })}
                  placeholder="Quinze mil e trezentos reais"
                />
              </div>

              <div className="automacao-form-field">
                <label>Prazo de Garantia (meses) *</label>
                <Input
                  type="number"
                  value={pdfData.prazoGarantiaMeses}
                  onChange={(e) => setPdfData({ ...pdfData, prazoGarantiaMeses: e.target.value })}
                  placeholder="60"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 5: Condições Gerais de Venda (5.1 e 5.4) */}
          <div className="automacao-section">
            <h3 className="automacao-section-title">
              <Calendar />
              5. Condições Gerais de Venda
            </h3>
            
            <div className="automacao-grid-2">
              <div className="automacao-form-field">
                <label>5.1 Data Base da Proposta *</label>
                <Input
                  value={pdfData.dataBaseProposta}
                  onChange={(e) => setPdfData({ ...pdfData, dataBaseProposta: e.target.value })}
                  placeholder="DD/MM/AAAA"
                />
              </div>

              <div className="automacao-form-field">
                <label>5.4 Prazo de Entrega *</label>
                <Input
                  value={pdfData.prazoEntrega}
                  onChange={(e) => setPdfData({ ...pdfData, prazoEntrega: e.target.value })}
                  placeholder="10 dias úteis"
                />
              </div>
            </div>
          </div>

          {/* BOTÃO DE EXPORTAR */}
          <button onClick={handleExportPDF} className="automacao-btn automacao-btn-export">
            <FileDown size={22} />
            Exportar Proposta Comercial
          </button>

        </CardContent>
      </Card>
    </div>
  );
}