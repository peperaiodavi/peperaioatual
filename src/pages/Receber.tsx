import { useState, useEffect } from 'react';
import { usePermissao } from '../context/PermissaoContext';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, DollarSign, Trash2, TrendingUp, CheckCircle, Clock, Building2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { supabase } from '../utils/supabaseClient';
import './Receber.css';

interface Pagamento {
  id: string;
  valor: number;
  data: string;
}

interface Recebivel {
  id: string;
  cliente: string;
  valor_total: number;
  valor_pago: number;
  pagamentos?: Pagamento[];
  data_criacao: string;
}

interface ObraReceber {
  id: string;
  nome: string;
  orcamento: number;
  finalizada: boolean;
  gastos_obra: Array<{ valor: number }>;
}

export default function Receber() {
  // Busca recebiveis do Supabase
  async function fetchRecebiveis() {
    const { data, error } = await supabase
      .from('recebiveis')
      .select('id, cliente, valor_total, valor_pago, data_criacao');
    if (error) {
      toast.error('Erro ao buscar recebíveis');
      setRecebiveis([]);
      return;
    }
    // Buscar pagamentos relacionados
    const { data: pagamentos, error: errorPag } = await supabase
      .from('pagamentos_recebivel')
      .select('id, recebivel_id, valor, data');
    if (errorPag) {
      toast.error('Erro ao buscar pagamentos');
    }
    const recebiveisCorrigidos = (data || []).map((r: any) => ({
      ...r,
      valor_total: typeof r.valor_total === 'number' ? r.valor_total : Number(r.valor_total) || 0,
      valor_pago: typeof r.valor_pago === 'number' ? r.valor_pago : Number(r.valor_pago) || 0,
      pagamentos: (pagamentos || []).filter((p: any) => p.recebivel_id === r.id),
    }));
    setRecebiveis(recebiveisCorrigidos);
  }

  // Busca obras não finalizadas
  async function fetchObrasReceber() {
    const { data, error } = await supabase
      .from('obras')
      .select('id, nome, orcamento, finalizada, gastos_obra(valor)')
      .eq('finalizada', false);
    
    if (error) {
      toast.error('Erro ao buscar obras pendentes');
      setObrasReceber([]);
      return;
    }
    setObrasReceber(data || []);
  }

  const { canCreate, canDelete } = usePermissao();
  const [recebiveis, setRecebiveis] = useState<Recebivel[]>([]);
  const [obrasReceber, setObrasReceber] = useState<ObraReceber[]>([]);
  const [isRecebivelDialogOpen, setIsRecebivelDialogOpen] = useState(false);
  const [isPagamentoDialogOpen, setIsPagamentoDialogOpen] = useState(false);
  const [selectedRecebivel, setSelectedRecebivel] = useState<string | null>(null);
  const [recebivelFormData, setRecebivelFormData] = useState({
    cliente: '',
    valor_total: '',
  });
  const [pagamentoValue, setPagamentoValue] = useState('');

  useEffect(() => {
    fetchRecebiveis();
    fetchObrasReceber();
  }, []);


  const saveRecebiveis = (data: Recebivel[]) => {
  setRecebiveis(data);
  };

  const handleRecebivelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    const recebivel: Omit<Recebivel, 'id'> = {
      cliente: recebivelFormData.cliente,
      valor_total: parseFloat(recebivelFormData.valor_total),
      valor_pago: 0,
      data_criacao: new Date().toISOString().split('T')[0],
    };
    const { data, error } = await supabase
      .from('recebiveis')
      .insert([recebivel])
      .select();
    if (error) {
      toast.error('Erro ao adicionar recebível');
      return;
    }
    await fetchRecebiveis();
    toast.success('Conta a receber adicionada com sucesso!');
    setRecebivelFormData({ cliente: '', valor_total: '' });
    setIsRecebivelDialogOpen(false);
  };

  const handlePagamentoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !selectedRecebivel) return;
    const valor = parseFloat(pagamentoValue);
    const recebivel = recebiveis.find((r) => r.id === selectedRecebivel);
    if (!recebivel) return;
    const valorRestante = (recebivel.valor_total || 0) - (recebivel.valor_pago || 0);
    if (valor > valorRestante) {
      toast.error('Valor excede o montante restante!');
      return;
    }
    // Adiciona pagamento na tabela pagamentos_recebivel
    const pagamento = {
      recebivel_id: selectedRecebivel,
      valor,
      data: new Date().toISOString().split('T')[0],
    };
    const { error: errorPag } = await supabase
      .from('pagamentos_recebivel')
      .insert([pagamento]);
    if (errorPag) {
      toast.error('Erro ao registrar pagamento');
      return;
    }
    // Atualiza valor_pago no recebivel
    const { error: errorRec } = await supabase
      .from('recebiveis')
      .update({ valor_pago: (recebivel.valor_pago || 0) + valor })
      .eq('id', selectedRecebivel);
    if (errorRec) {
      toast.error('Erro ao atualizar recebível');
      return;
    }
    // Adiciona entrada no caixa
  await supabase.from('transacoes').insert({
      tipo: 'entrada',
      valor,
      origem: `Recebimento - ${recebivel.cliente}`,
      data: new Date().toISOString().split('T')[0],
      observacao: 'Pagamento parcial de cliente',
    });
    await fetchRecebiveis();
    toast.success('Pagamento registrado com sucesso!');
    setPagamentoValue('');
    setIsPagamentoDialogOpen(false);
    setSelectedRecebivel(null);
  };

  const handleDeletePagamento = async (recebivelId: string, pagamentoId: string) => {
    if (!canDelete) return;
    const recebivel = recebiveis.find((r) => r.id === recebivelId);
    if (!recebivel) return;
    const pagamento = recebivel.pagamentos?.find((p) => p.id === pagamentoId);
    if (!pagamento) return;
    // Remove pagamento da tabela pagamentos_recebivel
    const { error: errorDel } = await supabase
      .from('pagamentos_recebivel')
      .delete()
      .eq('id', pagamentoId);
    if (errorDel) {
      toast.error('Erro ao remover pagamento');
      return;
    }
    // Remove transação de entrada do caixa associada ao pagamento
    await supabase
      .from('transacoes')
      .delete()
      .eq('origem', `Recebimento - ${recebivel.cliente}`)
      .eq('valor', pagamento.valor)
      .eq('data', pagamento.data);
    // Atualiza valor_pago no recebivel
    const { error: errorRec } = await supabase
      .from('recebiveis')
      .update({ valor_pago: (recebivel.valor_pago || 0) - pagamento.valor })
      .eq('id', recebivelId);
    if (errorRec) {
      toast.error('Erro ao atualizar recebível');
      return;
    }
    await fetchRecebiveis();
    toast.success('Pagamento removido com sucesso!');
  };

  const recebiveisAtivos = recebiveis.filter((r) => r.valor_pago < r.valor_total);
  const recebiveisQuitados = recebiveis.filter((r) => (r.valor_pago || 0) >= (r.valor_total || 0));

  // Estatísticas
  const totalAReceber = recebiveis.reduce((acc, r) => acc + (r.valor_total || 0), 0);
  const totalRecebido = recebiveis.reduce((acc, r) => acc + (r.valor_pago || 0), 0);
  const totalPendente = totalAReceber - totalRecebido;
  
  // Calcula total de obras pendentes (orçamento - gastos)
  const totalObrasReceber = obrasReceber.reduce((acc, obra) => {
    const totalGastos = (obra.gastos_obra || []).reduce((sum, g) => sum + (g.valor || 0), 0);
    const valorRestante = obra.orcamento - totalGastos;
    return acc + valorRestante;
  }, 0);

  const renderRecebivelCard = (recebivel: Recebivel, index: number) => {
  const valorRestante = (recebivel.valor_total || 0) - (recebivel.valor_pago || 0);
  const percentualPago = ((recebivel.valor_pago || 0) / (recebivel.valor_total || 1)) * 100;
  const isQuitado = (recebivel.valor_pago || 0) >= (recebivel.valor_total || 0);

    return (
      <div key={recebivel.id} className={`recebivel-card ${isQuitado ? 'quitado' : 'ativo'}`}>
        <div className="recebivel-card-header">
          <h3 className="recebivel-card-title">{recebivel.cliente}</h3>
          {canDelete && (
            <button
              className="recebivel-btn-delete"
              onClick={() => handleDeleteRecebivel(recebivel.id)}
              title="Apagar recebível"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className="recebivel-info">
          <div className="recebivel-info-row">
            <span className="recebivel-info-label">Valor Total</span>
            <span className="recebivel-info-value total">{formatCurrency(recebivel.valor_total)}</span>
          </div>
          <div className="recebivel-info-row">
            <span className="recebivel-info-label">Valor Pago</span>
            <span className="recebivel-info-value pago">{formatCurrency(recebivel.valor_pago)}</span>
          </div>
          {!isQuitado && (
            <div className="recebivel-info-row">
              <span className="recebivel-info-label">Restante</span>
              <span className="recebivel-info-value restante">{formatCurrency(valorRestante)}</span>
            </div>
          )}
        </div>

        <div className="recebivel-progress-section">
          <div className="recebivel-progress-header">
            <span className="recebivel-progress-label">Progresso</span>
            <span className="recebivel-progress-percentage">{percentualPago.toFixed(1)}%</span>
          </div>
          <div className="recebivel-progress-bar">
            <div 
              className="recebivel-progress-fill" 
              style={{ width: `${Math.min(percentualPago, 100)}%` }}
            />
          </div>
        </div>

        <div className="recebivel-pagamentos-section">
          <div className="recebivel-pagamentos-header">
            <span className="recebivel-pagamentos-title">
              Pagamentos ({Array.isArray(recebivel.pagamentos) ? recebivel.pagamentos.length : 0})
            </span>
            {canCreate && !isQuitado && (
              <button
                className="recebivel-btn-add-pagamento"
                onClick={() => {
                  setSelectedRecebivel(recebivel.id);
                  setIsPagamentoDialogOpen(true);
                }}
              >
                <Plus size={14} />
                Adicionar
              </button>
            )}
          </div>

          {Array.isArray(recebivel.pagamentos) && recebivel.pagamentos.length > 0 && (
            <div className="recebivel-pagamentos-list">
              {recebivel.pagamentos.map((pagamento) => (
                <div key={pagamento.id} className="recebivel-pagamento-item">
                  <div className="recebivel-pagamento-info">
                    <div className="recebivel-pagamento-valor">{formatCurrency(pagamento.valor)}</div>
                    <div className="recebivel-pagamento-data">
                      {new Date(pagamento.data.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  {canDelete && !isQuitado && (
                    <button
                      className="recebivel-btn-delete-pagamento"
                      onClick={() => handleDeletePagamento(recebivel.id, pagamento.id)}
                      title="Remover pagamento"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  // Função para apagar recebível
  async function handleDeleteRecebivel(recebivelId: string) {
    if (!canDelete) return;
    // Apaga todos os pagamentos_recebivel associados
    await supabase.from('pagamentos_recebivel').delete().eq('recebivel_id', recebivelId);
    // Apaga todas as transações de caixa associadas
  await supabase.from('transacoes').delete().eq('origem', `Recebimento - ${recebiveis.find(r => r.id === recebivelId)?.cliente || ''}`);
    // Apaga o recebível
    const { error } = await supabase.from('recebiveis').delete().eq('id', recebivelId);
    if (error) {
      toast.error('Erro ao apagar recebível');
      return;
    }
    await fetchRecebiveis();
    toast.success('Recebível apagado com sucesso!');
  }
  };

  return (
    <div className="receber-container">
      <div className="receber-header">
        <div className="receber-header-content">
          <h1>A Receber</h1>
          <p>Gerencie contas de clientes e pagamentos</p>
        </div>
        {canCreate && (
          <Dialog open={isRecebivelDialogOpen} onOpenChange={setIsRecebivelDialogOpen}>
            <DialogTrigger asChild>
              <button className="receber-btn receber-btn-primary">
                <Plus size={20} />
                Nova Conta
              </button>
            </DialogTrigger>
            <DialogContent className="receber-dialog-content">
              <DialogHeader>
                <DialogTitle className="receber-dialog-title">Nova Conta a Receber</DialogTitle>
                <DialogDescription className="receber-dialog-description">
                  Preencha os dados para adicionar uma nova conta a receber de cliente.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRecebivelSubmit}>
                <div className="receber-form-field">
                  <Label>Cliente</Label>
                  <Input
                    value={recebivelFormData.cliente}
                    onChange={(e) =>
                      setRecebivelFormData({
                        ...recebivelFormData,
                        cliente: e.target.value,
                      })
                    }
                    required
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="receber-form-field">
                  <Label>Valor Total</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={recebivelFormData.valor_total}
                    onChange={(e) =>
                      setRecebivelFormData({
                        ...recebivelFormData,
                        valor_total: e.target.value,
                      })
                    }
                    required
                    placeholder="0,00"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Adicionar Conta
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="receber-summary">
        <div className="receber-summary-card total">
          <div className="receber-summary-header">
            <div className="receber-summary-icon">
              <TrendingUp size={24} />
            </div>
            <div className="receber-summary-info">
              <h3>Total a Receber</h3>
              <p>{formatCurrency(totalAReceber)}</p>
            </div>
          </div>
        </div>
        
        <div className="receber-summary-card recebido">
          <div className="receber-summary-header">
            <div className="receber-summary-icon">
              <CheckCircle size={24} />
            </div>
            <div className="receber-summary-info">
              <h3>Total Recebido</h3>
              <p>{formatCurrency(totalRecebido)}</p>
            </div>
          </div>
        </div>
        
        <div className="receber-summary-card pendente">
          <div className="receber-summary-header">
            <div className="receber-summary-icon">
              <Clock size={24} />
            </div>
            <div className="receber-summary-info">
              <h3>Total Pendente</h3>
              <p>{formatCurrency(totalPendente)}</p>
            </div>
          </div>
        </div>

        <div className="receber-summary-card obras-pendentes">
          <div className="receber-summary-header">
            <div className="receber-summary-icon">
              <Building2 size={24} />
            </div>
            <div className="receber-summary-info">
              <h3>Obras Pendentes</h3>
              <p>{formatCurrency(totalObrasReceber)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* OBRAS PENDENTES */}
      {obrasReceber.length > 0 && (
        <div className="receber-obras-section">
          <div className="receber-obras-header">
            <h2>Obras em Andamento</h2>
            <p>Valores de obras não finalizadas</p>
          </div>
          <div className="receber-obras-grid">
            {obrasReceber.map((obra) => {
              const totalGastos = (obra.gastos_obra || []).reduce((sum, g) => sum + (g.valor || 0), 0);
              const valorRestante = obra.orcamento - totalGastos;
              const percentualGasto = obra.orcamento > 0 ? (totalGastos / obra.orcamento) * 100 : 0;
              
              return (
                <div key={obra.id} className="receber-obra-card">
                  <div className="receber-obra-icon">
                    <Building2 size={20} />
                  </div>
                  <div className="receber-obra-info">
                    <h3>{obra.nome}</h3>
                    <div className="receber-obra-valores">
                      <div className="receber-obra-valor-principal">
                        <span className="receber-obra-label">A Receber:</span>
                        <p className="receber-obra-valor">{formatCurrency(valorRestante)}</p>
                      </div>
                      <div className="receber-obra-detalhes">
                        <div className="receber-obra-detalhe">
                          <span>Orçamento:</span>
                          <span>{formatCurrency(obra.orcamento)}</span>
                        </div>
                        <div className="receber-obra-detalhe">
                          <span>Gastos:</span>
                          <span className="gastos-valor">-{formatCurrency(totalGastos)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="receber-obra-progress">
                      <div className="receber-obra-progress-bar">
                        <div 
                          className="receber-obra-progress-fill" 
                          style={{ width: `${percentualGasto}%` }}
                        />
                      </div>
                      <span className="receber-obra-progress-text">{percentualGasto.toFixed(1)}% gasto</span>
                    </div>
                    <span className="receber-obra-badge">Em Andamento</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Tabs defaultValue="ativos" className="receber-tabs">
        <TabsList>
          <TabsTrigger value="ativos">
            Ativos ({recebiveisAtivos.length})
          </TabsTrigger>
          <TabsTrigger value="quitados">
            Quitados ({recebiveisQuitados.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ativos">
          {recebiveisAtivos.length > 0 ? (
            <div className="receber-grid">
              {recebiveisAtivos.map((recebivel, index) => renderRecebivelCard(recebivel, index))}
            </div>
          ) : (
            <div className="receber-empty">
              <div className="receber-empty-icon">
                <DollarSign size={40} />
              </div>
              <h3>Nenhuma conta ativa</h3>
              <p>Adicione uma nova conta a receber para começar</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="quitados">
          {recebiveisQuitados.length > 0 ? (
            <div className="receber-grid">
              {recebiveisQuitados.map((recebivel, index) => renderRecebivelCard(recebivel, index))}
            </div>
          ) : (
            <div className="receber-empty">
              <div className="receber-empty-icon">
                <CheckCircle size={40} />
              </div>
              <h3>Nenhuma conta quitada</h3>
              <p>Contas quitadas aparecerão aqui</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isPagamentoDialogOpen} onOpenChange={setIsPagamentoDialogOpen}>
        <DialogContent className="receber-dialog-content">
          <DialogHeader>
            <DialogTitle className="receber-dialog-title">Registrar Pagamento</DialogTitle>
            <DialogDescription className="receber-dialog-description">
              Informe o valor do pagamento para registrar na conta selecionada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePagamentoSubmit}>
            <div className="receber-form-field">
              <Label>Valor do Pagamento</Label>
              <Input
                type="number"
                step="0.01"
                value={pagamentoValue}
                onChange={(e) => setPagamentoValue(e.target.value)}
                required
                placeholder="0,00"
              />
              {selectedRecebivel && (
                <p className="receber-form-hint">
                  Restante:{' '}
                  {formatCurrency(
                    (recebiveis.find((r) => r.id === selectedRecebivel)?.valor_total || 0) -
                      (recebiveis.find((r) => r.id === selectedRecebivel)?.valor_pago || 0)
                  )}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full">
              <DollarSign size={18} style={{ marginRight: '0.5rem' }} />
              Registrar Pagamento
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
