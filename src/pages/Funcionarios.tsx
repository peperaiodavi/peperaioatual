import React, { useEffect, useMemo, useState } from 'react';
import { usePermissao } from '../context/PermissaoContext';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { supabase } from '../utils/supabaseClient';
import { Plus, Edit2, Trash2, DollarSign, TrendingDown, Users, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { FuncionarioCard } from '../components/FuncionarioCard';
import { formatCurrency } from '../utils/formatCurrency';
import { motion, AnimatePresence } from 'framer-motion';
import './Funcionarios.css';
import '../styles/ios-premium.css';

interface Vale {
  id: string;
  valor: number;
  data: string;
}

interface SaidaDono {
  id: string;
  valor: number;
  data: string;
  observacao?: string;
}

interface Funcionario {
  id: string;
  nome: string;
  categoria: 'clt' | 'contrato' | 'dono';
  cargo: string;
  salario_mensal?: number;
  valor_diaria?: number;
  avatar_url?: string;
  vales: Vale[];
  saidas?: SaidaDono[];
  dataPagamentoCLT?: string;
}

interface FuncionarioComTotais extends Funcionario {
  totalVales: number;
  totalSaidas: number;
}

interface Diaria {
  id: string;
  id_funcionario: string;
  id_obra: string;
  data: string;
  valor: number;
  observacao?: string;
  pago: boolean;
  data_pagamento?: string;
  funcionarios: { nome: string };
  obras: { nome: string };
}

interface Obra {
  id: string;
  nome: string;
}

// Componente da Aba de Diárias
function DiariasTab({ funcionarios, canCreate, loadFuncionarios }: { 
  funcionarios: Funcionario[]; 
  canCreate: boolean;
  loadFuncionarios: () => void;
}) {
  const [diarias, setDiarias] = useState<Diaria[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    id_funcionario: '',
    id_obra: '',
    data: new Date().toISOString().split('T')[0],
    valor: '',
    observacao: ''
  });

  const loadDiarias = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('diarias')
      .select('*, funcionarios(nome), obras(nome)')
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao carregar diárias:', error);
      toast.error('Erro ao carregar diárias');
    } else {
      setDiarias(data || []);
    }
    setLoading(false);
  };

  const loadObras = async () => {
    const { data, error } = await supabase
      .from('obras')
      .select('id, nome')
      .eq('finalizada', false)
      .order('nome');

    if (error) {
      console.error('Erro ao carregar obras:', error);
    } else {
      setObras(data || []);
    }
  };

  useEffect(() => {
    loadDiarias();
    loadObras();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id_funcionario || !formData.id_obra || !formData.valor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const { error } = await supabase
      .from('diarias')
      .insert({
        id_funcionario: formData.id_funcionario,
        id_obra: formData.id_obra,
        data: formData.data,
        valor: parseFloat(formData.valor),
        observacao: formData.observacao || null,
        pago: false
      });

    if (error) {
      console.error('Erro ao registrar diária:', error);
      toast.error('Erro ao registrar diária');
    } else {
      toast.success('Diária registrada com sucesso!');
      setIsAddDialogOpen(false);
      setFormData({
        id_funcionario: '',
        id_obra: '',
        data: new Date().toISOString().split('T')[0],
        valor: '',
        observacao: ''
      });
      loadDiarias();
    }
  };

  const handleEfetuarPagamento = async (funcionarioId: string) => {
    const diariasNaoPagas = diarias.filter(d => d.id_funcionario === funcionarioId && !d.pago);
    
    if (diariasNaoPagas.length === 0) {
      toast.error('Não há diárias pendentes para este funcionário');
      return;
    }

    const totalPagar = diariasNaoPagas.reduce((sum, d) => sum + d.valor, 0);
    const funcionario = funcionarios.find(f => f.id === funcionarioId);
    
    if (!funcionario) {
      toast.error('Funcionário não encontrado');
      return;
    }

    // Confirmar pagamento
    if (!window.confirm(`Pagar ${diariasNaoPagas.length} diária(s) totalizando ${formatCurrency(totalPagar)} para ${funcionario.nome}?`)) {
      return;
    }

    try {
      // 1. Lançar no caixa
      const { error: errorCaixa } = await supabase.from('transacoes').insert({
        tipo: 'saida',
        valor: totalPagar,
        origem: `Pagamento de Diárias - ${funcionario.nome}`,
        data: new Date().toISOString().split('T')[0],
        categoria: 'Diárias',
        observacao: `${diariasNaoPagas.length} diária(s)`
      });

      if (errorCaixa) throw errorCaixa;

      // 2. Lançar como gasto em cada obra (categoria Funcionário)
      // Agrupar diárias por obra
      const diariasPorObra = diariasNaoPagas.reduce((acc, diaria) => {
        if (!acc[diaria.id_obra]) {
          acc[diaria.id_obra] = [];
        }
        acc[diaria.id_obra].push(diaria);
        return acc;
      }, {} as Record<string, Diaria[]>);

      // Registrar gasto em cada obra
      for (const [obraId, diariasDaObra] of Object.entries(diariasPorObra)) {
        const valorObra = diariasDaObra.reduce((sum, d) => sum + d.valor, 0);
        const diasTrabalhados = diariasDaObra.length;

        const { error: errorGasto } = await supabase.from('gastos_obra').insert({
          obra_id: obraId,
          categoria: 'Funcionário',
          descricao: `Diárias de ${funcionario.nome} (${diasTrabalhados} dia${diasTrabalhados > 1 ? 's' : ''})`,
          valor: valorObra,
          data: new Date().toISOString().split('T')[0]
        });

        if (errorGasto) {
          console.error('Erro ao lançar gasto na obra:', errorGasto);
          throw errorGasto;
        }
      }

      // 3. Marcar diárias como pagas
      const { error: errorUpdate } = await supabase
        .from('diarias')
        .update({ 
          pago: true,
          data_pagamento: new Date().toISOString().split('T')[0]
        })
        .in('id', diariasNaoPagas.map(d => d.id));

      if (errorUpdate) throw errorUpdate;

      toast.success(`Pagamento de ${formatCurrency(totalPagar)} efetuado com sucesso!`);
      loadDiarias();
    } catch (error) {
      console.error('Erro ao efetuar pagamento:', error);
      toast.error('Erro ao efetuar pagamento');
    }
  };

  const handleDeleteDiaria = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir esta diária?')) return;

    const { error } = await supabase
      .from('diarias')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir diária:', error);
      toast.error('Erro ao excluir diária');
    } else {
      toast.success('Diária excluída');
      loadDiarias();
    }
  };

  // Agrupar diárias por funcionário
  const diariasAgrupadas = funcionarios.filter(f => f.categoria === 'contrato').map(funcionario => {
    const diariasFuncionario = diarias.filter(d => d.id_funcionario === funcionario.id);
    const naoPagas = diariasFuncionario.filter(d => !d.pago);
    const totalPendente = naoPagas.reduce((sum, d) => sum + d.valor, 0);
    const diasPendentes = naoPagas.length;

    return {
      funcionario,
      diarias: diariasFuncionario,
      naoPagas,
      totalPendente,
      diasPendentes
    };
  });

  if (loading) {
    return <div className="diarias-loading">Carregando diárias...</div>;
  }

  return (
    <div className="diarias-container">
      {canCreate && (
        <div className="diarias-header">
          <button 
            className="funcionarios-btn funcionarios-btn-primary"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus size={18} />
            Registrar Diária
          </button>
        </div>
      )}

      <div className="diarias-list">
        {diariasAgrupadas.map(({ funcionario, diarias: diariasFuncionario, naoPagas, totalPendente, diasPendentes }) => (
          <div key={funcionario.id} className="diaria-funcionario-card">
            <div className="diaria-funcionario-header">
              <div className="diaria-funcionario-header-top">
                <div className="diaria-funcionario-info">
                  <h3>{funcionario.nome}</h3>
                  <span className="diaria-funcionario-cargo">{funcionario.cargo}</span>
                </div>
              </div>
              <div className="diaria-funcionario-header-bottom">
                <div className="diaria-funcionario-stats">
                  <div className="diaria-stat">
                    <span className="diaria-stat-label">Dias Pendentes</span>
                    <span className="diaria-stat-value">{diasPendentes}</span>
                  </div>
                  <div className="diaria-stat">
                    <span className="diaria-stat-label">Total Pendente</span>
                    <span className="diaria-stat-value total">{formatCurrency(totalPendente)}</span>
                  </div>
                </div>
                {canCreate && diasPendentes > 0 && (
                  <button
                    className="diaria-btn-pagar"
                    onClick={() => handleEfetuarPagamento(funcionario.id)}
                  >
                    <DollarSign size={20} />
                    Efetuar Pagamento
                  </button>
                )}
              </div>
            </div>

            {diariasFuncionario.length > 0 ? (
              <div className="diaria-list-items">
                {diariasFuncionario.map(diaria => (
                  <div key={diaria.id} className={`diaria-item ${diaria.pago ? 'pago' : 'pendente'}`}>
                    <div className="diaria-item-date">
                      <CalendarIcon size={16} />
                      {new Date(diaria.data).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="diaria-item-obra">
                      {diaria.obras.nome}
                    </div>
                    <div className="diaria-item-valor">
                      {formatCurrency(diaria.valor)}
                    </div>
                    <div className="diaria-item-status">
                      {diaria.pago ? (
                        <span className="badge-pago">✓ Pago</span>
                      ) : (
                        <span className="badge-pendente">⏳ Pendente</span>
                      )}
                    </div>
                    {diaria.observacao && (
                      <div className="diaria-item-obs">{diaria.observacao}</div>
                    )}
                    {canCreate && !diaria.pago && (
                      <button
                        className="diaria-item-delete"
                        onClick={() => handleDeleteDiaria(diaria.id)}
                        title="Excluir diária"
                      >
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="diaria-empty">Nenhuma diária registrada</div>
            )}
          </div>
        ))}

        {diariasAgrupadas.length === 0 && (
          <div className="diarias-empty-state">
            <CalendarIcon size={48} />
            <h3>Nenhum funcionário de diária cadastrado</h3>
            <p>Cadastre funcionários com categoria "Contrato (Diária)" para começar</p>
          </div>
        )}
      </div>

      {/* Diálogo para adicionar diária */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent aria-describedby="dialog-description-diaria" className="funcionario-dialog-content">
          <button 
            className="funcionario-dialog-close"
            onClick={() => setIsAddDialogOpen(false)}
            aria-label="Fechar"
          >
            ✕
          </button>
          <div className="funcionario-dialog-header">
            <h2 className="funcionario-dialog-title">
              <CalendarIcon className="funcionario-dialog-title-icon" />
              Registrar Diária
            </h2>
            <p className="funcionario-dialog-description" id="dialog-description-diaria">
              Registre o dia trabalhado do funcionário
            </p>
          </div>
          <div className="funcionario-dialog-body">
            <form onSubmit={handleSubmit} className="funcionario-dialog-form">
              <div className="funcionario-dialog-field">
                <Label className="funcionario-dialog-label">Funcionário</Label>
                <Select
                  value={formData.id_funcionario}
                  onValueChange={(value: string) => setFormData({ ...formData, id_funcionario: value })}
                >
                  <SelectTrigger className="funcionario-select-trigger">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent className="funcionario-select-content">
                    {funcionarios.filter(f => f.categoria === 'contrato').map(funcionario => (
                      <SelectItem key={funcionario.id} value={funcionario.id} className="funcionario-select-item">
                        {funcionario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="funcionario-dialog-field">
                <Label className="funcionario-dialog-label">Obra</Label>
                <Select
                  value={formData.id_obra}
                  onValueChange={(value: string) => setFormData({ ...formData, id_obra: value })}
                >
                  <SelectTrigger className="funcionario-select-trigger">
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent className="funcionario-select-content">
                    {obras.map(obra => (
                      <SelectItem key={obra.id} value={obra.id} className="funcionario-select-item">
                        {obra.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="funcionario-dialog-field">
                <Label className="funcionario-dialog-label">Data</Label>
                <Input
                  type="date"
                  className="funcionario-dialog-input"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                />
              </div>

              <div className="funcionario-dialog-field">
                <Label className="funcionario-dialog-label">Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="funcionario-dialog-input"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="R$ 0,00"
                  required
                />
              </div>

              <div className="funcionario-dialog-field">
                <Label className="funcionario-dialog-label">Observação</Label>
                <Input
                  className="funcionario-dialog-input"
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  placeholder="Observações (opcional)"
                />
              </div>

              <button type="submit" className="funcionario-dialog-submit">
                <CalendarIcon className="funcionario-dialog-submit-icon" />
                Registrar Diária
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Funcionarios() {
  // Estado para abas
  const [activeTab, setActiveTab] = useState<'funcionarios' | 'diarias'>('funcionarios');
  
  // Estado para o formulário de pagamento CLT
  const [cltPagamentoFormData, setCltPagamentoFormData] = useState({
    data: new Date().toISOString().split('T')[0],
  });
  // Função para registrar pagamento CLT no caixa
  const handleCltPagamentoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !openCalendarId) return; // openCalendarId agora é o ID do funcionário

    const funcionario = funcionarios.find(f => f.id === openCalendarId);
    if (!funcionario) {
      toast.error("Funcionário não encontrado.");
      return;
    }
    
    const dataISO = cltPagamentoFormData.data;
    const valor = funcionario.salario_mensal || 0;
    const origem = `Pagamento CLT - ${funcionario.nome}`;
    const categoria = 'Salário CLT'; // <-- Verifique se a categoria "Salário CLT" existe no seu Caixa!

    // 1. Registrar no caixa
    const { error: errorCaixa } = await supabase.from('transacoes').insert({
      tipo: 'saida',
      valor,
      origem,
      data: dataISO,
      categoria,
      observacao: '',
    });

    if (errorCaixa) {
      toast.error('Erro ao registrar no Caixa! Verifique se a categoria "Salário CLT" existe.');
      console.error("Erro Caixa CLT:", errorCaixa);
      return; // Não continua se o caixa falhar
    }

    // 2. Atualizar data de pagamento no funcionário
    const { error: errorFunc } = await supabase
      .from('funcionarios')
      .update({ dataPagamentoCLT: dataISO })
      .eq('id', funcionario.id);
    
    if (errorFunc) {
       toast.error('Erro ao atualizar data de pagamento do funcionário.');
       console.error("Erro Func CLT:", errorFunc);
    } else {
       toast.success('Pagamento CLT registrado com sucesso!');
    }

    loadFuncionarios(); // Recarrega os dados
    setOpenCalendarId(null); // Fecha o diálogo
    setCltPagamentoFormData({ data: new Date().toISOString().split('T')[0] }); // Reseta o form
  };
  // Estado para diálogo de diária paga
  const [isDiariaDialogOpen, setIsDiariaDialogOpen] = useState(false);
  const [diariaFormData, setDiariaFormData] = useState({
    valor: '',
    data: new Date().toISOString().split('T')[0],
  });
  const [funcionarioDiaria, setFuncionarioDiaria] = useState<Funcionario | null>(null);

  // Estado para pagamento de salário do dono
  const [isPagamentoSalarioDonoOpen, setIsPagamentoSalarioDonoOpen] = useState(false);
  const [pagamentoSalarioDonoFormData, setPagamentoSalarioDonoFormData] = useState({
    valor: '',
    data: new Date().toISOString().split('T')[0],
    observacao: '',
  });

  // Estado de permissões
  const { canEdit, canDelete, canCreate } = usePermissao();
  // Estado de funcionários
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  // Estado de diálogos
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isValeDialogOpen, setIsValeDialogOpen] = useState(false);
  const [isSaidaDialogOpen, setIsSaidaDialogOpen] = useState(false);
  // Estado de edição
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [selectedFuncionario, setSelectedFuncionario] = useState<string | null>(null);
  // Estado para confirmação de exclusão
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Estado do formulário principal
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'clt' as 'clt' | 'contrato' | 'dono',
    cargo: '',
    salario_mensal: '',
    valor_diaria: '',
    avatar_url: '',
  });
  // Estado do formulário de vale
  // (já declarado acima, não duplicar)
  // Estado do formulário de saída
  // (já declarado acima, não duplicar)
  // Estado para controlar qual card está expandido
  // (já declarado acima, não duplicar)

  // Função para registrar pagamento de salário do dono
  const handlePagamentoSalarioDono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !selectedFuncionario) return;

    const valorNumerico = parseFloat(pagamentoSalarioDonoFormData.valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error('Por favor, insira um valor válido.');
      return;
    }

    const funcionario = funcionarios.find(f => f.id === selectedFuncionario);
    if (!funcionario) {
      toast.error('Funcionário não encontrado.');
      return;
    }

    const dataISO = pagamentoSalarioDonoFormData.data;
    const observacao = pagamentoSalarioDonoFormData.observacao?.trim() || `Pagamento de salário - ${funcionario.nome}`;

    try {
      // 1. Registrar no caixa como saída
      const { error: errorCaixa } = await supabase.from('transacoes').insert({
        tipo: 'saida',
        valor: valorNumerico,
        origem: `Salário Dono - ${funcionario.nome}`,
        data: dataISO,
        categoria: 'Salário Dono',
        observacao: observacao,
      });

      if (errorCaixa) {
        toast.error('Erro ao registrar no Caixa! Verifique se a categoria "Salário Dono" existe.');
        console.error('Erro Caixa Salário Dono:', errorCaixa);
        return;
      }

      // 2. Registrar na tabela saidas_dono para histórico no card
      const payload = {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 18),
        funcionario_id: selectedFuncionario,
        valor: valorNumerico,
        data: dataISO,
        observacao: observacao,
      };

      const { error: errorSaida } = await supabase
        .from('saidas_dono')
        .insert(payload);

      if (errorSaida) {
        console.error('Erro ao registrar saída do dono:', errorSaida);
        toast.error('Erro ao registrar pagamento no histórico do funcionário.');
        return;
      }

      toast.success('Pagamento de salário registrado com sucesso!');
      loadFuncionarios();
      setIsPagamentoSalarioDonoOpen(false);
      setPagamentoSalarioDonoFormData({
        valor: '',
        data: new Date().toISOString().split('T')[0],
        observacao: '',
      });
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento.');
    }
  };

  // Função para registrar saída do dono
  // Função para registrar saída do dono
  const handleAddSaida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !selectedFuncionario) return;
    const valorNumerico = parseFloat(saidaFormData.valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error('Por favor, insira um valor numérico válido e positivo.');
      return;
    }
    // Garante que data está em formato YYYY-MM-DD
    const data = saidaFormData.data ? saidaFormData.data : new Date().toISOString().split('T')[0];
    // Observação: se vazio, envia null
    const observacao = saidaFormData.observacao?.trim() ? saidaFormData.observacao : null;
    const payload = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 18),
      funcionario_id: selectedFuncionario,
      valor: valorNumerico,
      data,
      observacao,
    };
    console.log('Payload saída:', payload);
    const { error } = await supabase
      .from('saidas_dono')
      .insert(payload);
    if (!error) {
      // 1. Lançar no caixa
      const funcionario = funcionarios.find(f => f.id === selectedFuncionario);
      const nomeFuncionario = funcionario ? funcionario.nome : 'Funcionário';
      const { error: errorCaixa } = await supabase.from('transacoes').insert({
        tipo: 'saida',
        valor: valorNumerico,
        origem: `Saída Dono - ${nomeFuncionario}`,
        data,
        categoria: 'Saídas Dono',
        observacao: observacao || '',
      });
      if (errorCaixa) {
        console.error('Erro ao lançar Saída no Caixa:', errorCaixa);
        toast.error('Erro ao registrar no Caixa! Verifique se a categoria "Saídas Dono" existe.');
        return;
      }
      // 2. Lançar na aba A Receber (tabela: recebiveis)
      // LÓGICA ATUALIZADA: Verifica se já existe um recebível para esse dono.
      const { data: recebivelExistente, error: errorBusca } = await supabase
        .from('recebiveis')
        .select('id, valor_total')
        .eq('cliente', nomeFuncionario)
        .maybeSingle();

      if (errorBusca) {
        console.error('Erro ao buscar recebível existente:', errorBusca);
        toast.error('Erro ao verificar recebível existente!');
        return;
      }

      if (recebivelExistente) {
        // JÁ EXISTE: Soma o novo valor ao valor_total existente
        const novoTotal = (recebivelExistente.valor_total || 0) + valorNumerico;
        const { error: errorUpdate } = await supabase
          .from('recebiveis')
          .update({ valor_total: novoTotal })
          .eq('id', recebivelExistente.id);
        if (errorUpdate) {
          console.error('Erro ao ATUALIZAR recebível:', errorUpdate);
          toast.error('Erro ao atualizar "A Receber"!');
        } else {
          console.log('Recebível do dono atualizado com sucesso.');
        }
      } else {
        // NÃO EXISTE: Cria um novo registro
        const { error: errorInsert } = await supabase
          .from('recebiveis')
          .insert({
            valor_total: valorNumerico,
            cliente: nomeFuncionario,
            valor_pago: 0,
            data_criacao: data,
          });
        if (errorInsert) {
          console.error('Erro ao CRIAR novo recebível:', errorInsert);
          toast.error('Erro ao lançar em "A Receber"!');
        } else {
          console.log('Novo recebível do dono criado com sucesso.');
        }
      }
      toast.success('Saída registrada com sucesso!');
      loadFuncionarios();
    } else {
      toast.error('Erro ao registrar saída!');
      console.error('Erro no Supabase ao adicionar saída:', error, payload);
    }
    setSaidaFormData({ valor: '', data: new Date().toISOString().split('T')[0], observacao: '' });
    setIsSaidaDialogOpen(false);
    setSelectedFuncionario(null);
  };
  // Função para registrar diária paga no caixa
  const handleRegistrarDiaria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !funcionarioDiaria) return;
    const valor = parseFloat(diariaFormData.valor);
    if (isNaN(valor) || valor <= 0) {
      toast.error('Por favor, insira um valor numérico válido e positivo.');
      return;
    }
    const data = diariaFormData.data;
    const origem = `Diária Paga - ${funcionarioDiaria.nome}`;
    const categoria = 'Diárias Contrato';
    const { error } = await supabase.from('transacoes').insert({
      tipo: 'saida',
      valor,
      origem,
      data,
      categoria,
      observacao: '',
    });
    if (!error) {
      toast.success('Diária registrada no caixa!');
      setIsDiariaDialogOpen(false);
      setFuncionarioDiaria(null);
      setDiariaFormData({ valor: '', data: new Date().toISOString().split('T')[0] });
    } else {
      toast.error('Erro ao registrar diária no caixa!');
    }
  };
  const [valeFormData, setValeFormData] = useState({
    valor: '',
    data: new Date().toISOString().split('T')[0],
  });
  const [saidaFormData, setSaidaFormData] = useState({
    valor: '',
    data: new Date().toISOString().split('T')[0],
    observacao: '',
  });
  // Estado para controlar qual card está expandido
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Estado para controlar qual calendário está aberto
  const [openCalendarId, setOpenCalendarId] = useState<string | null>(null);

  useEffect(() => {
    loadFuncionarios();
  }, []);

  // Carregar funcionários do Supabase
  const loadFuncionarios = async () => {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .order('nome', { ascending: true });
    if (!error && Array.isArray(data)) {
      // Busca vales e saídas de cada funcionário
      const funcionariosComExtras = await Promise.all(
        data.map(async (f: any) => {
          const { data: vales } = await supabase
            .from('vales')
            .select('*')
            .eq('funcionario_id', f.id);
          const { data: saidas } = await supabase
            .from('saidas_dono')
            .select('*')
            .eq('funcionario_id', f.id);
          return {
            ...f,
            vales: Array.isArray(vales) ? vales : [],
            saidas: Array.isArray(saidas) ? saidas : [],
          };
        })
      );
      setFuncionarios(funcionariosComExtras);
    } else {
      setFuncionarios([]);
      toast.error('Erro ao carregar funcionários do Supabase!');
    }
  };

  // CORRIGIDO: Usa Supabase para criar ou atualizar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // <--- PASSO 1: Mova para o topo

    if (!canCreate && !editingFuncionario) return;
    if (!canEdit && editingFuncionario) return;

    const dadosDoFuncionario = {
      nome: formData.nome,
      categoria: formData.categoria,
      // FIX 1: Envia 'null' se a categoria for 'dono', caso contrário, envia o valor do cargo.
      cargo: formData.categoria === 'dono' ? null : formData.cargo,
      // FIX 2: Converte para número APENAS se houver um valor. Se estiver vazio (''), envia 'null'.
      salario_mensal:
        formData.categoria === 'clt' && formData.salario_mensal
          ? Number(formData.salario_mensal)
          : null,
      // FIX 3: Mesma lógica para a diária.
      valor_diaria:
        formData.categoria === 'contrato' && formData.valor_diaria
          ? Number(formData.valor_diaria)
          : null,
      avatar_url: formData.avatar_url || null,
    };

    console.log('Dados enviados:', dadosDoFuncionario); // <--- PASSO 2: Mova o log para cá

    if (editingFuncionario) {
      // MODO DE EDIÇÃO (UPDATE)
      const { error } = await supabase
        .from('funcionarios')
        .update(dadosDoFuncionario)
        .eq('id', editingFuncionario.id);

      if (!error) {
        toast.success('Funcionário atualizado!');
        loadFuncionarios(); // Recarrega do banco
      } else {
        toast.error('Erro ao atualizar funcionário.');
        alert(JSON.stringify(error));
        debugger;
        console.error('Supabase error:', error);
      }
    } else {
      // MODO DE CRIAÇÃO (INSERT)
      const { error } = await supabase
        .from('funcionarios')
        .insert(dadosDoFuncionario);

      if (!error) {
        toast.success('Funcionário adicionado!');
        loadFuncionarios(); // Recarrega do banco
      } else {
        toast.error('Erro ao adicionar funcionário.');
        alert(JSON.stringify(error));
        debugger;
        console.error('Supabase error:', error);
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  // CORRIGIDO: Usa Supabase para deletar (E REMOVIDA A DUPLICATA)
  const handleDelete = async (funcionarioId: string) => {
    if (!canDelete) return;
    if (!window.confirm('Tem certeza que deseja apagar este funcionário?')) {
      return;
    }
    const { error } = await supabase
      .from('funcionarios')
      .delete()
      .eq('id', funcionarioId);

    if (!error) {
      toast.success('Funcionário removido!');
      loadFuncionarios(); // Recarrega do banco
    } else {
      toast.error('Erro ao remover funcionário.');
    }
  };

  // CORRIGIDO: Usa Supabase para adicionar vale
  const handleAddVale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !selectedFuncionario) return;
    const valor = parseFloat(valeFormData.valor);
    const data = valeFormData.data;
    const { error } = await supabase
      .from('vales')
      .insert({ funcionario_id: selectedFuncionario, valor, data });
    if (!error) {
      toast.success('Vale adicionado!');
      loadFuncionarios();
    } else {
      toast.error('Erro ao adicionar vale!');
    }
    setValeFormData({ valor: '', data: new Date().toISOString().split('T')[0] });
    setIsValeDialogOpen(false);
    setSelectedFuncionario(null);
  };

  // Removido: duplicidade da função handleAddSaida

  // CORRIGIDO: Deleta vale E remove do caixa
  const handleDeleteVale = async (funcionarioId: string, valeId: string) => {
    if (!canDelete) return;
    if (!window.confirm('Tem certeza que deseja excluir este vale? Esta ação irá remover o lançamento do caixa e do card do funcionário. Não pode ser desfeita.')) {
      return;
    }

    try {
      // 1. Buscar o vale para pegar os dados
      const { data: vale, error: valeError } = await supabase
        .from('vales')
        .select('*')
        .eq('id', valeId)
        .single();

      if (valeError) {
        console.error('Erro ao buscar vale:', valeError);
        toast.error('Erro ao buscar dados do vale.');
        return;
      }

      // 2. Buscar nome do funcionário
      const { data: funcionario } = await supabase
        .from('funcionarios')
        .select('nome')
        .eq('id', funcionarioId)
        .single();

      const nomeFuncionario = funcionario?.nome || 'Funcionário';

      // 3. Remover do caixa (transacoes) - buscar por data, valor e observação contendo "Vale"
      const { error: caixaError } = await supabase
        .from('transacoes')
        .delete()
        .eq('data', vale.data)
        .eq('valor', vale.valor)
        .eq('tipo', 'saida')
        .ilike('observacao', `%Vale%${nomeFuncionario}%`);

      if (caixaError) {
        console.warn('Aviso ao remover do caixa:', caixaError);
        // Continua mesmo se não encontrar no caixa
      }

      // 4. Remover o vale do card do funcionário
      const { error: deleteError } = await supabase
        .from('vales')
        .delete()
        .eq('id', valeId);

      if (deleteError) {
        console.error('Erro ao deletar vale:', deleteError);
        toast.error('Erro ao remover vale.');
        return;
      }

      toast.success('Vale removido com sucesso do card e do caixa!');
      loadFuncionarios();
    } catch (error) {
      console.error('Erro ao excluir vale:', error);
      toast.error('Erro ao remover vale.');
    }
  };

  // CORRIGIDO: Deleta saida E remove do caixa
  const handleDeleteSaida = async (_funcionarioId: string, saidaId: string) => {
    if (!canDelete) return;
    if (!window.confirm('Tem certeza que deseja excluir esta saída? Esta ação irá remover o lançamento do caixa e do card do funcionário. Não pode ser desfeita.')) {
      return;
    }

    try {
      // 1. Buscar a saída para pegar o valor e a transação associada
      const { data: saida, error: saidaError } = await supabase
        .from('saidas_dono')
        .select('*')
        .eq('id', saidaId)
        .single();

      if (saidaError) {
        console.error('Erro ao buscar saída:', saidaError);
        toast.error('Erro ao buscar dados da saída.');
        return;
      }

      // 2. Remover do caixa (transacoes) - buscar por data, valor e observação
      const observacaoSaida = saida.observacao || 'Saída de Dono';
      const { error: caixaError } = await supabase
        .from('transacoes')
        .delete()
        .eq('data', saida.data)
        .eq('valor', saida.valor)
        .eq('tipo', 'saida')
        .ilike('observacao', `%${observacaoSaida}%`);

      if (caixaError) {
        console.warn('Aviso ao remover do caixa:', caixaError);
        // Continua mesmo se não encontrar no caixa
      }

      // 3. Remover a saída do card do funcionário
      const { error: deleteError } = await supabase
        .from('saidas_dono')
        .delete()
        .eq('id', saidaId);

      if (deleteError) {
        console.error('Erro ao deletar saída:', deleteError);
        toast.error('Erro ao remover saída.');
        return;
      }

      toast.success('Saída removida com sucesso do card e do caixa!');
      loadFuncionarios();
    } catch (error) {
      console.error('Erro ao excluir saída:', error);
      toast.error('Erro ao remover saída.');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      categoria: 'clt',
      cargo: '',
      salario_mensal: '',
      valor_diaria: '',
      avatar_url: '',
    });
    setEditingFuncionario(null);
  };

  const openEditDialog = (funcionario: Funcionario) => {
    if (!canEdit) return;
    setEditingFuncionario(funcionario);
    setFormData({
      nome: funcionario.nome,
      categoria: funcionario.categoria,
      cargo: funcionario.cargo || '', // <--- CORREÇÃO
      salario_mensal: funcionario.salario_mensal?.toString() || '',
      valor_diaria: funcionario.valor_diaria?.toString() || '',
      avatar_url: funcionario.avatar_url || '',
    });
    setIsDialogOpen(true);
  };

  const totalVales = (vales: Vale[]) => vales.reduce((acc, v) => acc + v.valor, 0);
  const totalSaidas = (saidas?: SaidaDono[]) =>
    (saidas || []).reduce((acc, s) => acc + s.valor, 0);

  const getCategoriaLabel = (categoria: 'clt' | 'contrato' | 'dono') => {
    switch (categoria) {
      case 'clt':
        return 'CLT';
      case 'contrato':
        return 'Contrato';
      case 'dono':
        return 'Dono';
    }
  };

  const funcionariosDetalhados = useMemo<FuncionarioComTotais[]>(
    () =>
      funcionarios
        .map((funcionario) => ({
          ...funcionario,
          totalVales: totalVales(funcionario.vales),
          totalSaidas: totalSaidas(funcionario.saidas),
        }))
        .sort((a, b) => {
          // Donos primeiro
          if (a.categoria === 'dono' && b.categoria !== 'dono') return -1;
          if (a.categoria !== 'dono' && b.categoria === 'dono') return 1;
          // Depois por nome
          return a.nome.localeCompare(b.nome);
        }),
    [funcionarios]
  );

  return (
    <div className="funcionarios-container">
      <div className="funcionarios-header">
        <div className="funcionarios-header-content">
          <h1>
            <Users style={{ display: 'inline', marginRight: '0.5rem' }} />
            Funcionários
          </h1>
          <p>Gerencie sua equipe e pagamentos</p>
        </div>
        <div className="funcionarios-header-actions">
          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button onClick={resetForm} className="funcionarios-btn funcionarios-btn-primary">
                  <Plus size={18} />
                  Adicionar Funcionário
                </button>
              </DialogTrigger>
            <DialogContent
              aria-describedby="dialog-description-principal"
              className="funcionario-dialog-content funcionario-dialog-principal"
            >
              <div className="funcionario-dialog-header">
                <h2 className="funcionario-dialog-title">
                  <Users className="funcionario-dialog-title-icon" />
                  {editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}
                </h2>
                <p className="funcionario-dialog-description" id="dialog-description-principal">
                  Preencha os dados do funcionário para cadastro ou edição.
                </p>
              </div>
              <div className="funcionario-dialog-body">
                <form onSubmit={handleSubmit} className="funcionario-dialog-form">
                  <div className="funcionario-dialog-field">
                    <Label className="funcionario-dialog-label">Nome</Label>
                    <Input
                      className="funcionario-dialog-input"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="funcionario-dialog-field">
                    <Label className="funcionario-dialog-label">Categoria</Label>
                    <Select
                    value={formData.categoria}
                    onValueChange={(value: 'clt' | 'contrato' | 'dono') =>
                      setFormData({ ...formData, categoria: value })
                    }
                  >
                    <SelectTrigger className="funcionario-select-trigger">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent className="funcionario-select-content">
                      <SelectItem value="clt" className="funcionario-select-item">
                        CLT (Salário Mensal)
                      </SelectItem>
                      <SelectItem value="contrato" className="funcionario-select-item">
                        Contrato (Diária)
                      </SelectItem>
                      <SelectItem value="dono" className="funcionario-select-item">
                        Dono
                      </SelectItem>
                    </SelectContent>
                    </Select>
                  </div>
                  {formData.categoria !== 'dono' && (
                    <div className="funcionario-dialog-field">
                      <Label className="funcionario-dialog-label">Cargo</Label>
                      <Input
                        className="funcionario-dialog-input"
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                        required
                      />
                    </div>
                  )}
                  {formData.categoria === 'clt' && (
                    <div className="funcionario-dialog-field">
                      <Label className="funcionario-dialog-label">Salário Mensal</Label>
                      <Input
                        className="funcionario-dialog-input"
                        type="number"
                        step="0.01"
                        value={formData.salario_mensal}
                        onChange={(e) =>
                          setFormData({ ...formData, salario_mensal: e.target.value })
                        }
                        required
                      />
                    </div>
                  )}
                  {formData.categoria === 'contrato' && (
                    <div className="funcionario-dialog-field">
                      <Label className="funcionario-dialog-label">Valor da Diária</Label>
                      <Input
                        className="funcionario-dialog-input"
                        type="number"
                        step="0.01"
                        value={formData.valor_diaria}
                        onChange={(e) =>
                          setFormData({ ...formData, valor_diaria: e.target.value })
                        }
                        required
                      />
                    </div>
                  )}
                  <div className="funcionario-dialog-field">
                    <Label className="funcionario-dialog-label">URL do Avatar (opcional)</Label>
                    <Input
                      className="funcionario-dialog-input"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="funcionario-dialog-submit">
                    {editingFuncionario ? (
                      <Edit2 className="funcionario-dialog-submit-icon" />
                    ) : (
                      <Plus className="funcionario-dialog-submit-icon" />
                    )}
                    {editingFuncionario ? 'Salvar Alterações' : 'Adicionar Funcionário'}
                  </button>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Abas */}
      <div className="funcionarios-tabs">
        <button
          className={`funcionarios-tab ${activeTab === 'funcionarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('funcionarios')}
        >
          <Users size={18} />
          Funcionários
        </button>
        <button
          className={`funcionarios-tab ${activeTab === 'diarias' ? 'active' : ''}`}
          onClick={() => setActiveTab('diarias')}
        >
          <CalendarIcon size={18} />
          Diárias
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'funcionarios' && (
        <div className="funcionarios-grid-tech">
          {funcionariosDetalhados.map((funcionario, index) => {
          const isExpanded = expandedId === funcionario.id;
          return (
            <motion.div 
              key={funcionario.id} 
              className="funcionario-card-wrapper"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <FuncionarioCard
                nome={funcionario.nome}
                cargo={funcionario.cargo}
                categoria={funcionario.categoria}
                avatar_url={funcionario.avatar_url}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={() => openEditDialog(funcionario)}
                onDelete={() => setConfirmDeleteId(funcionario.id)}
                badgeLabel={getCategoriaLabel(funcionario.categoria)}
                salario={funcionario.categoria === 'clt' ? funcionario.salario_mensal : funcionario.valor_diaria}
                totalVales={funcionario.totalVales}
                totalSaidas={funcionario.totalSaidas}
                dataPagamentoCLT={funcionario.dataPagamentoCLT}
              />

              {/* Botão para expandir */}
              <motion.button
                className={`funcionario-expand-btn-tech ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedId(isExpanded ? null : funcionario.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="funcionario-expand-icon" />
                </motion.div>
              </motion.button>

              {/* Conteúdo Expandido */}
              <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  className="funcionario-expanded-tech"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  {/* Botões de Ação */}
                  {canCreate && (
                    <div className="funcionario-action-group-tech">
                      {funcionario.categoria === 'clt' && (
                        <motion.button
                          className="funcionario-primary-btn-tech pagamento"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFuncionario(funcionario.id);
                            setOpenCalendarId(funcionario.id);
                          }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <DollarSign className="funcionario-btn-icon" />
                          <span>Registrar Pagamento CLT</span>
                        </motion.button>
                      )}

                      {funcionario.categoria === 'contrato' && (
                        <motion.button
                          className="funcionario-primary-btn-tech diaria"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFuncionarioDiaria(funcionario);
                            setIsDiariaDialogOpen(true);
                          }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <DollarSign className="funcionario-btn-icon" />
                          <span>Registrar Diária Paga</span>
                        </motion.button>
                      )}

                      {funcionario.categoria === 'dono' && (
                        <>
                          <motion.button
                            className="funcionario-primary-btn-tech pagamento"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFuncionario(funcionario.id);
                              setIsPagamentoSalarioDonoOpen(true);
                            }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <DollarSign className="funcionario-btn-icon" />
                            <span>Pagar Salário</span>
                          </motion.button>
                          <motion.button
                            className="funcionario-primary-btn-tech saida"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFuncionario(funcionario.id);
                              setIsSaidaDialogOpen(true);
                            }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <TrendingDown className="funcionario-btn-icon" />
                            <span>Registrar Saída</span>
                          </motion.button>
                        </>
                      )}

                      {funcionario.categoria !== 'dono' && (
                        <motion.button
                          className="funcionario-primary-btn-tech vale"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFuncionario(funcionario.id);
                            setIsValeDialogOpen(true);
                          }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <DollarSign className="funcionario-btn-icon" />
                          <span>Adicionar Vale</span>
                        </motion.button>
                      )}
                    </div>
                  )}

                  {/* Lista de Vales */}
                  {funcionario.categoria !== 'dono' && funcionario.vales && funcionario.vales.length > 0 && (
                    <div className="funcionario-vales-section">
                      <div className="funcionario-vales-title">
                          <DollarSign className="funcionario-inline-icon" />
                        Vales Recebidos
                      </div>
                      <div className="funcionario-vales-list">
                        {funcionario.vales.map((vale) => (
                          <div key={vale.id} className="funcionario-vale-item">
                            <div>
                              <div className="funcionario-vale-date">
                                {new Date(vale.data).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="funcionario-vale-value">
                                {formatCurrency(vale.valor)}
                              </div>
                            </div>
                            {canDelete && (
                              <button
                                className="funcionario-vale-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVale(funcionario.id, vale.id);
                                }}
                                title="Excluir vale"
                              >
                                <Trash2 className="funcionario-vale-delete-icon" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="funcionario-vales-total">
                        <span className="funcionario-vales-total-label">Total em Vales:</span>
                        <span className="funcionario-vales-total-value">
                          {formatCurrency(funcionario.totalVales)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lista de Saídas do Dono */}
                  {funcionario.categoria === 'dono' && funcionario.saidas && funcionario.saidas.length > 0 && (
                    <div className="funcionario-saidas-section">
                      <div className="funcionario-saidas-title">
                          <TrendingDown className="funcionario-inline-icon" />
                        Saídas Registradas
                      </div>
                      <div className="funcionario-saidas-list">
                        {funcionario.saidas.map((saida) => (
                          <div key={saida.id} className="funcionario-saida-item">
                            <div className="funcionario-saida-info">
                              <div className="funcionario-saida-date">
                                {new Date(saida.data).toLocaleDateString('pt-BR')}
                              </div>
                              {saida.observacao && (
                                <div className="funcionario-saida-obs">{saida.observacao}</div>
                              )}
                            </div>
                            <div className="funcionario-saida-value">
                              {formatCurrency(saida.valor)}
                            </div>
                            {canDelete && (
                              <button
                                className="funcionario-saida-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSaida(funcionario.id, saida.id);
                                }}
                                title="Excluir saída"
                              >
                                <Trash2 className="funcionario-saida-delete-icon" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="funcionario-vales-total">
                        <span className="funcionario-vales-total-label">Total em Saídas:</span>
                        <span className="funcionario-vales-total-value">
                          {formatCurrency(funcionario.totalSaidas)}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        </div>
      )}

      {/* Aba de Diárias */}
      {activeTab === 'diarias' && (
        <DiariasTab 
          funcionarios={funcionarios}
          canCreate={canCreate}
          loadFuncionarios={loadFuncionarios}
        />
      )}

      {/* DIÁLOGOS */}
      {/* Diálogo para adicionar vale */}
      <Dialog open={isValeDialogOpen} onOpenChange={setIsValeDialogOpen}>
  <DialogContent aria-describedby="dialog-description-vale" className="funcionario-dialog-content funcionario-dialog-vale obras-style">
          <div className="funcionario-dialog-header">
            <h2 className="funcionario-dialog-title">
              <DollarSign className="funcionario-dialog-title-icon" />
              Adicionar Vale
            </h2>
            <p className="funcionario-dialog-description" id="dialog-description-vale">
              Informe o valor e a data do vale para adicionar ao funcionário.
            </p>
          </div>
          <div className="funcionario-dialog-body">
            <form onSubmit={handleAddVale} className="funcionario-dialog-form">
              <div className="funcionario-dialog-field">
                <label className="funcionario-dialog-label">
                  <DollarSign className="funcionario-dialog-label-icon" />
                  Valor do Vale
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={valeFormData.valor}
                  onChange={(e) => setValeFormData({ ...valeFormData, valor: e.target.value })}
                  required
                  placeholder="R$ 0,00"
                  className="funcionario-dialog-input"
                />
              </div>
              <div className="funcionario-dialog-field">
                <label className="funcionario-dialog-label">
                  <CalendarIcon className="funcionario-dialog-label-icon" />
                  Data
                </label>
                <input
                  type="date"
                  value={valeFormData.data}
                  onChange={(e) => setValeFormData({ ...valeFormData, data: e.target.value })}
                  required
                  className="funcionario-dialog-input"
                />
              </div>
              <button type="submit" className="funcionario-dialog-submit">
                <DollarSign className="funcionario-dialog-submit-icon" />
                Adicionar Vale
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para registrar diária paga */}
      <Dialog open={isDiariaDialogOpen} onOpenChange={setIsDiariaDialogOpen}>
  <DialogContent aria-describedby="dialog-description-diaria" className="funcionario-dialog-content funcionario-dialog-diaria obras-style">
          <div className="funcionario-dialog-header">
            <h2 className="funcionario-dialog-title">
              <DollarSign className="funcionario-dialog-title-icon" />
              Registrar Diária Paga
            </h2>
            <p className="funcionario-dialog-description" id="dialog-description-diaria">
              Informe o valor e a data da diária paga para registrar no caixa.
            </p>
          </div>
          <div className="funcionario-dialog-body">
            <form onSubmit={handleRegistrarDiaria} className="funcionario-dialog-form">
              <div className="funcionario-dialog-field">
                <label className="funcionario-dialog-label">
                  <DollarSign className="funcionario-dialog-label-icon" />
                  Valor da Diária
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={diariaFormData.valor}
                  onChange={(e) => setDiariaFormData({ ...diariaFormData, valor: e.target.value })}
                  required
                  placeholder="R$ 0,00"
                  className="funcionario-dialog-input"
                />
              </div>
              <div className="funcionario-dialog-field">
                <label className="funcionario-dialog-label">
                  <CalendarIcon className="funcionario-dialog-label-icon" />
                  Data
                </label>
                <input
                  type="date"
                  value={diariaFormData.data}
                  onChange={(e) => setDiariaFormData({ ...diariaFormData, data: e.target.value })}
                  required
                  className="funcionario-dialog-input"
                />
              </div>
              <button type="submit" className="funcionario-dialog-submit">
                <DollarSign className="funcionario-dialog-submit-icon" />
                Registrar Diária
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para Pagamento CLT */}
      <Dialog open={!!openCalendarId} onOpenChange={(open) => {
        if (!open) {
          setOpenCalendarId(null);
          setCltPagamentoFormData({ data: new Date().toISOString().split('T')[0] });
        }
      }}>
  <DialogContent aria-describedby="dialog-description-clt" className="funcionario-dialog-content funcionario-dialog-clt obras-style">
          <div className="funcionario-dialog-header">
            <h2 className="funcionario-dialog-title">
              <DollarSign className="funcionario-dialog-title-icon" />
              Registrar Pagamento CLT
            </h2>
            <p className="funcionario-dialog-description" id="dialog-description-clt">
              Selecione a data do pagamento para registrar no caixa.
            </p>
          </div>
          <div className="funcionario-dialog-body">
            <form onSubmit={handleCltPagamentoSubmit} className="funcionario-dialog-form">
              <div className="funcionario-dialog-field">
                <label className="funcionario-dialog-label">
                  <CalendarIcon className="funcionario-dialog-label-icon" />
                  Data do Pagamento
                </label>
                <input
                  type="date"
                  value={cltPagamentoFormData.data}
                  onChange={(e) => setCltPagamentoFormData({ ...cltPagamentoFormData, data: e.target.value })}
                  required
                  className="funcionario-dialog-input"
                />
              </div>
              <button type="submit" className="funcionario-dialog-submit">
                <DollarSign className="funcionario-dialog-submit-icon" />
                Registrar Pagamento
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Pagamento de Salário do Dono */}
      <Dialog open={isPagamentoSalarioDonoOpen} onOpenChange={setIsPagamentoSalarioDonoOpen}>
        <DialogContent aria-describedby="dialog-description-pagamento-dono" className="funcionario-dialog-content funcionario-dialog-pagamento obras-style">
          <div className="funcionario-dialog-header">
            <h2 className="funcionario-dialog-title">
              <DollarSign className="funcionario-dialog-title-icon" />
              Pagar Salário do Dono
            </h2>
            <p className="funcionario-dialog-description" id="dialog-description-pagamento-dono">
              Registre o pagamento de salário. O valor será lançado no caixa como saída e ficará registrado no card do funcionário.
            </p>
          </div>
          <div className="funcionario-dialog-body">
            <form onSubmit={handlePagamentoSalarioDono} className="funcionario-dialog-form">
              <div className="funcionario-dialog-field">
                <label className="funcionario-dialog-label">
                  <DollarSign className="funcionario-dialog-label-icon" />
                  Valor do Salário
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pagamentoSalarioDonoFormData.valor}
                  onChange={(e) => setPagamentoSalarioDonoFormData({ ...pagamentoSalarioDonoFormData, valor: e.target.value })}
                  required
                  placeholder="R$ 0,00"
                  className="funcionario-dialog-input"
                />
              </div>
              <div className="funcionario-dialog-field">
                <label className="funcionario-dialog-label">
                  <CalendarIcon className="funcionario-dialog-label-icon" />
                  Data do Pagamento
                </label>
                <input
                  type="date"
                  value={pagamentoSalarioDonoFormData.data}
                  onChange={(e) => setPagamentoSalarioDonoFormData({ ...pagamentoSalarioDonoFormData, data: e.target.value })}
                  required
                  className="funcionario-dialog-input"
                />
              </div>
              <div className="funcionario-dialog-field">
                <label className="funcionario-dialog-label">
                  Observação (opcional)
                </label>
                <textarea
                  value={pagamentoSalarioDonoFormData.observacao}
                  onChange={(e) => setPagamentoSalarioDonoFormData({ ...pagamentoSalarioDonoFormData, observacao: e.target.value })}
                  placeholder="Adicione uma observação"
                  className="funcionario-dialog-input funcionario-dialog-textarea"
                />
              </div>
              <button type="submit" className="funcionario-dialog-submit">
                <DollarSign className="funcionario-dialog-submit-icon" />
                Registrar Pagamento
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Saída do Dono */}
      <Dialog open={isSaidaDialogOpen} onOpenChange={setIsSaidaDialogOpen}>
  <DialogContent aria-describedby="dialog-description-saida" className="funcionario-dialog-content funcionario-dialog-saida obras-style">
          <div className="funcionario-dialog-header">
            <h2 className="funcionario-dialog-title">
              <TrendingDown className="funcionario-dialog-title-icon" />
              Registrar Saída
            </h2>
            <p className="funcionario-dialog-description" id="dialog-description-saida">
              Informe o valor, data e observação da saída do dono.
            </p>
          </div>
          <div className="funcionario-dialog-body">
            <form onSubmit={handleAddSaida} className="funcionario-dialog-form">
              <div className="funcionario-dialog-field">
                <label className="funcionario-dialog-label">
                  <DollarSign className="funcionario-dialog-label-icon" />
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={saidaFormData.valor}
                  onChange={(e) => setSaidaFormData({ ...saidaFormData, valor: e.target.value })}
                  required
                  placeholder="R$ 0,00"
                  className="funcionario-dialog-input"
                />
              </div>
              <div className="funcionario-dialog-field">
                <label className="funcionario-dialog-label">
                  <CalendarIcon className="funcionario-dialog-label-icon" />
                  Data
                </label>
                <input
                  type="date"
                  value={saidaFormData.data}
                  onChange={(e) => setSaidaFormData({ ...saidaFormData, data: e.target.value })}
                  required
                  className="funcionario-dialog-input"
                />
              </div>
              <div className="funcionario-dialog-field">
                <label className="funcionario-dialog-label">
                  Observação (opcional)
                </label>
                <textarea
                  value={saidaFormData.observacao}
                  onChange={(e) => setSaidaFormData({ ...saidaFormData, observacao: e.target.value })}
                  placeholder="Descrição da saída"
                  className="funcionario-dialog-input funcionario-dialog-textarea"
                />
              </div>
              <button type="submit" className="funcionario-dialog-submit">
                <TrendingDown className="funcionario-dialog-submit-icon" />
                Registrar Saída
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para deletar funcionário */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
  <DialogContent aria-describedby="dialog-description-delete" className="funcionario-dialog-content funcionario-dialog-delete obras-style">
          <div className="funcionario-dialog-header">
            <h2 className="funcionario-dialog-title">
              <Trash2 className="funcionario-dialog-title-icon" />
              Confirmar Exclusão
            </h2>
            <p className="funcionario-dialog-description" id="dialog-description-delete">
              Tem certeza que deseja apagar este funcionário? Essa ação não pode ser desfeita.
            </p>
          </div>
          <div className="funcionario-dialog-body">
            <div className="funcionario-dialog-footer">
              <button className="funcionario-dialog-cancel" onClick={() => setConfirmDeleteId(null)}>
                Cancelar
              </button>
              <button className="funcionario-dialog-delete-btn" onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>
                Apagar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}