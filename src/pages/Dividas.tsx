import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { usePermissao } from '../context/PermissaoContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, DollarSign, AlertCircle, CheckCircle, TrendingDown, Building2, CreditCard, Banknote } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import './Dividas.css';

interface Divida {
  id: string;
  nome: string;
  valor: number;
  categoria?: string;
  instituicao?: string; // Nova propriedade para instituição financeira
  tipo?: 'normal' | 'parcelada';
  valorParcela?: number;
  numParcelas?: number;
  datasParcelas?: string[];
  parcelasPagas?: boolean[];
  valorRestante?: number;
  vencimento: string;
  status: 'em_dia' | 'atrasado' | 'quitado';
}

// Mapa de instituições financeiras com cores e ícones
const INSTITUICOES_FINANCEIRAS: Record<string, { nome: string; cor: string; logo: string }> = {
  bradesco: {
    nome: 'Bradesco',
    cor: '#CC092F',
    logo: '🏦'
  },
  'banco-do-brasil': {
    nome: 'Banco do Brasil',
    cor: '#FFF100',
    logo: '🏦'
  },
  itau: {
    nome: 'Itaú',
    cor: '#EC7000',
    logo: '🏦'
  },
  caixa: {
    nome: 'Caixa Econômica',
    cor: '#0066B3',
    logo: '🏦'
  },
  santander: {
    nome: 'Santander',
    cor: '#EC0000',
    logo: '🏦'
  },
  nubank: {
    nome: 'Nubank',
    cor: '#820AD1',
    logo: '💳'
  },
  'mercado-pago': {
    nome: 'Mercado Pago',
    cor: '#00B1EA',
    logo: '💰'
  },
  picpay: {
    nome: 'PicPay',
    cor: '#21C25E',
    logo: '💳'
  },
  'inter': {
    nome: 'Banco Inter',
    cor: '#FF7A00',
    logo: '🏦'
  },
  'c6-bank': {
    nome: 'C6 Bank',
    cor: '#000000',
    logo: '🏦'
  },
  'cartao-credito': {
    nome: 'Cartão de Crédito',
    cor: '#8b5cf6',
    logo: '💳'
  },
  outro: {
    nome: 'Outra Instituição',
    cor: '#64748b',
    logo: '🏢'
  }
}

export default function Dividas() {
  const { canEdit, canDelete, canCreate } = usePermissao();
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDivida, setEditingDivida] = useState<Divida | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    categoria: '',
    instituicao: '', // Nova propriedade
    tipo: 'normal', // 'normal' ou 'parcelada'
    valorParcela: '',
    numParcelas: '',
    datasParcelas: [] as string[],
    vencimento: '',
    dataBaseParcelas: '', // NOVO: data base para gerar parcelas
    status: 'em_dia' as Divida['status'],
  });

  // Função para formatar valor monetário brasileiro
  const formatarValorMonetario = (valor: string): string => {
    // Remove tudo exceto números
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Converte para número e divide por 100 para ter centavos
    const numero = Number(apenasNumeros) / 100;
    
    // Formata com vírgula e ponto
    return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Função para converter valor formatado para número
  const converterParaNumero = (valorFormatado: string): number => {
    // Remove pontos de milhar e substitui vírgula por ponto
    return parseFloat(valorFormatado.replace(/\./g, '').replace(',', '.')) || 0;
  };

  useEffect(() => {
    loadDividas();
  }, []);

  const loadDividas = async () => {
    const { data, error } = await supabase.from('dividas').select('*');
    if (error) {
      toast.error('Erro ao buscar dívidas!');
      return;
    }
    // Inicializa campos extras para dívidas parceladas
    setDividas((data || []).map((d: any) => {
      if (d.tipo === 'parcelada') {
        return {
          ...d,
          parcelasPagas: d.parcelasPagas || Array(Number(d.numParcelas) || 0).fill(false),
          valorRestante: d.valorRestante ?? d.valor,
        };
      }
      return d;
    }));
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      valor: '',
      categoria: '',
      instituicao: '',
      tipo: 'normal',
      valorParcela: '',
      numParcelas: '',
      datasParcelas: [],
      vencimento: '',
      dataBaseParcelas: '',
      status: 'em_dia',
    });
    setEditingDivida(null);
  };

  const openEditDialog = (divida: Divida) => {
    setEditingDivida(divida);
    setFormData({
      nome: divida.nome,
      valor: divida.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      categoria: divida.categoria || '',
      instituicao: divida.instituicao || '',
      tipo: divida.tipo || 'normal',
      valorParcela: divida.valorParcela ? divida.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
      numParcelas: divida.numParcelas?.toString() || '',
      datasParcelas: divida.datasParcelas || [],
      vencimento: divida.vencimento,
      dataBaseParcelas: divida.datasParcelas?.[0] || '',
      status: divida.status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate && !editingDivida) return;
    if (!canEdit && editingDivida) return;

    // --- Validação ---
    const valorNumerico = converterParaNumero(formData.valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error('O Valor Total deve ser um número positivo.');
      return;
    }
    if (formData.tipo === 'normal' && !formData.vencimento) {
      toast.error('A Data de Vencimento é obrigatória.');
      return;
    }
    if (formData.tipo === 'parcelada' && (!formData.numParcelas || !formData.dataBaseParcelas)) {
      toast.error('Nº de Parcelas e Data Base são obrigatórios.');
      return;
    }
    // --- Fim Validação ---

    if (editingDivida) {
      // --- MODO UPDATE (EDITAR) ---
      // Na edição, SÓ atualizamos os campos do formulário.
      // Não mexemos em parcelasPagas ou valorRestante aqui.
      const dadosUpdate = {
        nome: formData.nome,
        categoria: formData.categoria,
        instituicao: formData.instituicao,
        tipo: formData.tipo,
        valor: valorNumerico,
        status: formData.status,
        
        vencimento: formData.tipo === 'normal' ? formData.vencimento : null,
        
        valorParcela: formData.tipo === 'parcelada' ? converterParaNumero(formData.valorParcela) : null,
        numParcelas: formData.tipo === 'parcelada' ? parseInt(formData.numParcelas) : null,
        datasParcelas: formData.tipo === 'parcelada' ? formData.datasParcelas : null,
      };

      const { error } = await supabase
        .from('dividas')
        .update(dadosUpdate)
        .eq('id', editingDivida.id);
      if (!error) {
        toast.success('Dívida atualizada com sucesso!');
        loadDividas();
      } else {
        toast.error('Erro ao atualizar dívida!');
        console.error("Erro Update Dívida:", error, dadosUpdate);
      }
    } else {
      // --- MODO INSERT (CRIAR) ---
      const dadosInsert = {
        nome: formData.nome,
        categoria: formData.categoria,
        instituicao: formData.instituicao,
        tipo: formData.tipo,
        valor: valorNumerico,
        status: formData.status,
        
        vencimento: formData.tipo === 'normal' ? formData.vencimento : null,
        
        valorParcela: formData.tipo === 'parcelada' ? converterParaNumero(formData.valorParcela) : null,
        numParcelas: formData.tipo === 'parcelada' ? parseInt(formData.numParcelas) : null,
        datasParcelas: formData.tipo === 'parcelada' ? formData.datasParcelas : null,
        
        // Campos de controle inicial
        parcelasPagas: formData.tipo === 'parcelada' 
          ? Array(parseInt(formData.numParcelas)).fill(false) 
          : null, // <-- CORRIGIDO: Envia 'null' se for 'normal'
          
        valorRestante: valorNumerico, // <-- CORRIGIDO: Valor restante é sempre o total no início
      };

      const { error } = await supabase
        .from('dividas')
        .insert(dadosInsert); // Envia o objeto de insert
      if (!error) {
        toast.success('Dívida adicionada com sucesso!');
        loadDividas();
      } else {
        toast.error('Erro ao adicionar dívida!');
        // Adicionei o log do objeto para facilitar a depuração
        console.error("Erro Insert Dívida:", error, dadosInsert); 
      }
    }
    resetForm();
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    const { error } = await supabase.from('dividas').delete().eq('id', id);
    if (!error) {
      toast.success('Dívida removida com sucesso!');
      loadDividas();
    } else {
      toast.error('Erro ao remover dívida!');
    }
  };

  const handlePagar = async (divida: Divida) => {
    if (!canEdit) return;
    if (divida.tipo === 'parcelada') {
      // Pagar próxima parcela não paga
      const idx = (divida.parcelasPagas || []).findIndex(p => !p);
      if (idx === -1) return;
      const novasParcelasPagas = [...(divida.parcelasPagas || [])];
      novasParcelasPagas[idx] = true;
      const novoValorRestante = (divida.valorRestante || divida.valor) - (divida.valorParcela || 0);
      // Atualiza no banco
      const { error } = await supabase
        .from('dividas')
        .update({
          parcelasPagas: novasParcelasPagas,
          valorRestante: novoValorRestante,
          status: novoValorRestante <= 0 ? 'quitado' : divida.status,
        })
        .eq('id', divida.id);
      if (!error) {
        // Lança no caixa
        const data = divida.datasParcelas?.[idx] || new Date().toISOString().split('T')[0];
        const origem = `Parcela ${idx + 1} - ${divida.nome}`;
        const categoria = divida.categoria || 'Parcelas';
        await supabase.from('transacoes').insert({
          tipo: 'saida',
          valor: divida.valorParcela,
          origem,
          data,
          categoria,
          observacao: '',
        });
        toast.success('Parcela paga e registrada no caixa!');
        loadDividas();
      } else {
        toast.error('Erro ao pagar parcela!');
      }
    } else {
      // Dívida normal
      const { error } = await supabase
        .from('dividas')
        .update({ status: 'quitado' })
        .eq('id', divida.id);
      if (!error) {
        // Lança no caixa
        await supabase.from('transacoes').insert({
          tipo: 'saida',
          valor: divida.valor,
          origem: divida.nome,
          data: divida.vencimento,
          categoria: divida.categoria || 'Dívidas',
          observacao: '',
        });
        toast.success('Dívida marcada como quitada e registrada no caixa!');
        loadDividas();
      } else {
        toast.error('Erro ao marcar como quitada!');
      }
    }
  };

  const getStatusConfig = (status: Divida['status']): {
    label: string;
    variant: 'default' | 'destructive' | 'secondary' | 'outline' | null | undefined;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
  } => {
    switch (status) {
      case 'em_dia':
        return {
          label: 'Em Dia',
          variant: 'default',
          icon: AlertCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'atrasado':
        return {
          label: 'Atrasado',
          variant: 'destructive',
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      case 'quitado':
        return {
          label: 'Quitado',
          variant: 'secondary' as const,
          icon: CheckCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  // Estatísticas
  const totalDividas = dividas.reduce((acc, d) => acc + (d.valorRestante || d.valor), 0);
  const dividasEmDia = dividas.filter(d => d.status === 'em_dia');
  const dividasAtrasadas = dividas.filter(d => d.status === 'atrasado');
  const dividasQuitadas = dividas.filter(d => d.status === 'quitado');

  return (
    <div className="dividas-container">
      <div className="dividas-header">
        <div className="dividas-header-content">
          <h1>Dívidas</h1>
          <p>Gerencie e controle suas contas a pagar</p>
        </div>
        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="dividas-btn dividas-btn-primary" onClick={resetForm}>
                <Plus className="h-4 w-4" />
                Adicionar Dívida
              </button>
            </DialogTrigger>
            <DialogContent className="dividas-dialog-content">
              <DialogHeader>
                <DialogTitle className="dividas-dialog-title">
                  {editingDivida ? 'Editar Dívida' : 'Nova Dívida'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="dividas-form">
                <div className="dividas-form-field">
                  <label>Nome</label>
                  <input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="dividas-form-field">
                  <label>Categoria</label>
                  <input
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: Aluguel, Fornecedor, Serviços"
                  />
                </div>
                <div className="dividas-form-field">
                  <label>Instituição Financeira</label>
                  <select
                    value={formData.instituicao}
                    onChange={(e) => setFormData({ ...formData, instituicao: e.target.value })}
                    className="dividas-select-instituicao"
                  >
                    <option value="">Selecione (opcional)</option>
                    {Object.entries(INSTITUICOES_FINANCEIRAS).map(([key, inst]) => (
                      <option key={key} value={key}>
                        {inst.logo} {inst.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="dividas-form-field">
                  <label>Tipo</label>
                  <div className="dividas-tipo-options">
                    <button
                      type="button"
                      className={formData.tipo === 'normal' ? 'active' : ''}
                      onClick={() => setFormData({ ...formData, tipo: 'normal' })}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      className={formData.tipo === 'parcelada' ? 'active' : ''}
                      onClick={() => setFormData({ ...formData, tipo: 'parcelada' })}
                    >
                      Parcelada
                    </button>
                  </div>
                </div>
                <div className="dividas-form-field">
                  <label>Valor Total</label>
                  <input
                    type="text"
                    value={formData.valor}
                    onChange={(e) => {
                      const valorFormatado = formatarValorMonetario(e.target.value);
                      let novoValorParcela = formData.valorParcela;
                      if (formData.tipo === 'parcelada' && formData.numParcelas) {
                        const valorTotal = converterParaNumero(valorFormatado);
                        const num = parseInt(formData.numParcelas);
                        if (num > 0) {
                          const valorParcelaNum = valorTotal / num;
                          novoValorParcela = valorParcelaNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                      }
                      setFormData({ ...formData, valor: valorFormatado, valorParcela: novoValorParcela });
                    }}
                    placeholder="0,00"
                    required
                  />
                </div>
                {formData.tipo === 'parcelada' && (
                  <>
                    <div className="dividas-form-field">
                      <label>Número de Parcelas</label>
                      <input
                        type="number"
                        value={formData.numParcelas}
                        onChange={(e) => {
                          const num = Number(e.target.value);
                          const valorTotal = converterParaNumero(formData.valor);
                          const valorParcelaNum = num > 0 ? (valorTotal / num) : 0;
                          const valorParcela = valorParcelaNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          let datasParcelas: string[] = [];
                          if (formData.dataBaseParcelas && num > 0) {
                            const baseDate = new Date(formData.dataBaseParcelas);
                            for (let i = 0; i < num; i++) {
                              const d = new Date(baseDate);
                              d.setMonth(baseDate.getMonth() + i);
                              datasParcelas.push(d.toISOString().split('T')[0]);
                            }
                          }
                          setFormData({
                            ...formData,
                            numParcelas: e.target.value,
                            valorParcela: valorParcela,
                            datasParcelas,
                          });
                        }}
                        required
                      />
                    </div>
                    <div className="dividas-form-field">
                      <label>Valor da Parcela</label>
                      <input
                        type="text"
                        value={formData.valorParcela}
                        readOnly
                        placeholder="0,00"
                        className="readonly"
                      />
                    </div>
                    <div className="dividas-form-field">
                      <label>Data base de vencimento</label>
                      <input
                        type="date"
                        value={formData.dataBaseParcelas}
                        onChange={e => {
                          const base = e.target.value;
                          const num = Number(formData.numParcelas) || 0;
                          let datasParcelas: string[] = [];
                          if (base && num > 0) {
                            const baseDate = new Date(base);
                            for (let i = 0; i < num; i++) {
                              const d = new Date(baseDate);
                              d.setMonth(baseDate.getMonth() + i);
                              datasParcelas.push(d.toISOString().split('T')[0]);
                            }
                          }
                          setFormData({ ...formData, dataBaseParcelas: base, datasParcelas });
                        }}
                        required
                      />
                    </div>
                  </>
                )}
                {formData.tipo === 'normal' && (
                  <div className="dividas-form-field">
                    <label>Vencimento</label>
                    <input
                      type="date"
                      value={formData.vencimento}
                      onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div className="dividas-form-field">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Divida['status'] })}
                  >
                    <option value="em_dia">Em Dia</option>
                    <option value="atrasado">Atrasado</option>
                    <option value="quitado">Quitado</option>
                  </select>
                </div>
                <button type="submit" className="dividas-btn dividas-btn-primary w-full">
                  {editingDivida ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Cards de Resumo */}
      <div className="dividas-summary">
        <div className="dividas-summary-card total">
          <div className="dividas-summary-icon">
            <DollarSign />
          </div>
          <div className="dividas-summary-content">
            <span className="dividas-summary-label">Total em Dívidas</span>
            <span className="dividas-summary-value">{formatCurrency(totalDividas)}</span>
            <span className="dividas-summary-count">{dividas.length} dívida(s)</span>
          </div>
        </div>

        <div className="dividas-summary-card emdia">
          <div className="dividas-summary-icon">
            <CheckCircle />
          </div>
          <div className="dividas-summary-content">
            <span className="dividas-summary-label">Em Dia</span>
            <span className="dividas-summary-value">{dividasEmDia.length}</span>
            <span className="dividas-summary-count">
              {formatCurrency(dividasEmDia.reduce((acc, d) => acc + (d.valorRestante || d.valor), 0))}
            </span>
          </div>
        </div>

        <div className="dividas-summary-card atrasadas">
          <div className="dividas-summary-icon">
            <AlertCircle />
          </div>
          <div className="dividas-summary-content">
            <span className="dividas-summary-label">Atrasadas</span>
            <span className="dividas-summary-value">{dividasAtrasadas.length}</span>
            <span className="dividas-summary-count">
              {formatCurrency(dividasAtrasadas.reduce((acc, d) => acc + (d.valorRestante || d.valor), 0))}
            </span>
          </div>
        </div>

        <div className="dividas-summary-card quitadas">
          <div className="dividas-summary-icon">
            <TrendingDown />
          </div>
          <div className="dividas-summary-content">
            <span className="dividas-summary-label">Quitadas</span>
            <span className="dividas-summary-value">{dividasQuitadas.length}</span>
            <span className="dividas-summary-count">
              {formatCurrency(dividasQuitadas.reduce((acc, d) => acc + d.valor, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Dívidas */}
      <div className="dividas-grid">
        {dividas.map((divida) => {
          const statusConfig = getStatusConfig(divida.status);
          const StatusIcon = statusConfig.icon;
          const instituicaoInfo = divida.instituicao ? INSTITUICOES_FINANCEIRAS[divida.instituicao] : null;
          return (
            <div key={divida.id} className={`divida-card ${divida.status}`}>
              {instituicaoInfo && (
                <div className="divida-instituicao-badge" style={{ background: instituicaoInfo.cor + '15', borderColor: instituicaoInfo.cor + '40' }}>
                  <span className="divida-instituicao-logo">{instituicaoInfo.logo}</span>
                  <span className="divida-instituicao-nome" style={{ color: instituicaoInfo.cor }}>{instituicaoInfo.nome}</span>
                </div>
              )}
              <div className="divida-card-header">
                <div className="divida-card-title">
                  <StatusIcon className="h-5 w-5" />
                  <h3>{divida.nome}</h3>
                </div>
                <div className="divida-card-actions">
                  {canEdit && (
                    <button
                      className="dividas-btn-icon"
                      onClick={() => openEditDialog(divida)}
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className="dividas-btn-icon delete"
                      onClick={() => handleDelete(divida.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="divida-info">
                {divida.categoria && (
                  <div className="divida-categoria">{divida.categoria}</div>
                )}
                <div className="divida-info-row">
                  <span className="divida-info-label">Valor Inicial:</span>
                  <span className="divida-info-value">{formatCurrency(divida.valor)}</span>
                </div>
                
                {divida.tipo === 'parcelada' ? (
                  <>
                    <div className="divida-info-row">
                      <span className="divida-info-label">Valor Restante:</span>
                      <span className="divida-info-value highlight">{formatCurrency(divida.valorRestante ?? divida.valor)}</span>
                    </div>
                    
                    {/* Parcela do Mês em Destaque */}
                    {(() => {
                      const hoje = new Date();
                      hoje.setHours(0, 0, 0, 0);
                      const parcelaMes = (divida.datasParcelas || []).findIndex((data, idx) => {
                        const dataParcela = new Date(data);
                        dataParcela.setHours(0, 0, 0, 0);
                        const isPaga = divida.parcelasPagas && divida.parcelasPagas[idx];
                        const isMesAtual = dataParcela.getMonth() === hoje.getMonth() && 
                                           dataParcela.getFullYear() === hoje.getFullYear();
                        return isMesAtual && !isPaga;
                      });

                      if (parcelaMes !== -1) {
                        const data = divida.datasParcelas![parcelaMes];
                        const dataParcela = new Date(data);
                        dataParcela.setHours(0, 0, 0, 0);
                        const isVencida = dataParcela < hoje;

                        return (
                          <div className={`divida-parcela-destaque ${isVencida ? 'vencida' : ''}`}>
                            <div className="divida-parcela-destaque-header">
                              <span className="divida-parcela-destaque-label">Parcela do Mês</span>
                              <span className="divida-parcela-destaque-numero">#{parcelaMes + 1}</span>
                            </div>
                            <div className="divida-parcela-destaque-info">
                              <div className="divida-parcela-destaque-valor">
                                {formatCurrency(divida.valorParcela || 0)}
                              </div>
                              <div className="divida-parcela-destaque-data">
                                Vencimento: {dataParcela.toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                            {canEdit && divida.status !== 'quitado' && (
                              <button
                                className={`dividas-btn-pagar ${isVencida ? 'urgent' : ''}`}
                                onClick={() => handlePagar(divida)}
                              >
                                <DollarSign className="h-3 w-3" />
                                Pagar Agora
                              </button>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* Seção de Parcelas */}
                    <div className="divida-parcelas-section">
                      <div className="divida-parcelas-header">
                        <h4>Parcelas</h4>
                        <span className="divida-parcelas-progress">
                          {(divida.parcelasPagas || []).filter(p => p).length} / {divida.numParcelas || 0} pagas
                        </span>
                      </div>
                      <div className="divida-parcelas-list">
                        {(divida.datasParcelas || []).map((data, idx) => {
                          const hoje = new Date();
                          hoje.setHours(0, 0, 0, 0);
                          const dataParcela = new Date(data);
                          dataParcela.setHours(0, 0, 0, 0);
                          const isPaga = divida.parcelasPagas && divida.parcelasPagas[idx];
                          const isVencida = dataParcela < hoje && !isPaga;
                          const isMesAtual = dataParcela.getMonth() === hoje.getMonth() && 
                                             dataParcela.getFullYear() === hoje.getFullYear();

                          let statusClass = 'pendente';
                          let statusLabel = 'Pendente';
                          
                          if (isPaga) {
                            statusClass = 'paga';
                            statusLabel = 'Paga';
                          } else if (isVencida) {
                            statusClass = 'atrasada';
                            statusLabel = 'Atrasada';
                          } else if (isMesAtual) {
                            statusClass = 'mesatual';
                            statusLabel = 'Mês Atual';
                          }

                          // Mostrar apenas parcelas pendentes, atrasadas ou do mês atual
                          if (!isPaga || isMesAtual || isVencida) {
                            return (
                              <div key={idx} className={`divida-parcela-item ${statusClass}`}>
                                <div className="divida-parcela-info">
                                  <span className="divida-parcela-numero">Parcela {idx + 1}</span>
                                  <span className="divida-parcela-data">
                                    {new Date(data).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <div className="divida-parcela-valor">
                                  {formatCurrency(divida.valorParcela || 0)}
                                </div>
                                <div className="divida-parcela-status">{statusLabel}</div>
                                {canEdit && !isPaga && divida.status !== 'quitado' && (
                                  <button
                                    className={`dividas-btn-pagar ${isVencida ? 'urgent' : ''}`}
                                    onClick={() => handlePagar(divida)}
                                  >
                                    <DollarSign className="h-3 w-3" />
                                    Pagar
                                  </button>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="divida-info-row">
                      <span className="divida-info-label">Vencimento:</span>
                      <span className="divida-info-value">
                        {new Date(divida.vencimento).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="divida-card-footer">
                      <div className={`divida-status-badge ${divida.status}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </div>
                      {canEdit && divida.status !== 'quitado' && (
                        <button
                          className="dividas-btn-pagar"
                          onClick={() => handlePagar(divida)}
                        >
                          <DollarSign className="h-3 w-3" />
                          Pagar
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}