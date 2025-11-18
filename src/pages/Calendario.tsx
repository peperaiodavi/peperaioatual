import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Edit2, Trash2, CheckCircle, MapPin, User, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { usePermissao } from '../context/PermissaoContext';
import './Calendario.css';

interface Compromisso {
  id: string;
  titulo: string;
  descricao: string | null;
  data_compromisso: string;
  cliente: string | null;
  local: string | null;
  notificado: boolean;
  concluido: boolean;
  created_at: string;
}

export default function Calendario() {
  const { canEdit, canDelete, canCreateCompromisso } = usePermissao();
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompromisso, setEditingCompromisso] = useState<Compromisso | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'proximos' | 'concluidos'>('todos');
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [showDayDialog, setShowDayDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_compromisso: '',
    cliente: '',
    local: ''
  });

  useEffect(() => {
    loadCompromissos();
  }, []);

  const loadCompromissos = async () => {
    setLoading(true);
    // Busca todos os compromissos (compartilhados entre todos os usuários)
    const { data, error } = await supabase
      .from('compromissos')
      .select('*')
      .order('data_compromisso', { ascending: true });

    if (error) {
      console.error('Erro ao carregar compromissos:', error);
      toast.error('Erro ao carregar compromissos!');
    } else {
      setCompromissos(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.titulo || !formData.data_compromisso) {
      toast.error('Preencha título e data!');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado!');
      return;
    }

    // Converte a data do input datetime-local para timestamp ISO
    // O input retorna "YYYY-MM-DDTHH:mm" (sem timezone, assume local)
    // Precisamos converter para ISO mantendo a interpretação de hora local
    const dataHoraLocal = new Date(formData.data_compromisso);
    const dataHoraISO = dataHoraLocal.toISOString();

    const compromissoData = {
      titulo: formData.titulo,
      descricao: formData.descricao || null,
      data_compromisso: dataHoraISO,
      cliente: formData.cliente || null,
      local: formData.local || null,
      user_id: user.id
    };

    if (editingCompromisso) {
      // Editar
      const { error } = await supabase
        .from('compromissos')
        .update(compromissoData)
        .eq('id', editingCompromisso.id);

      if (error) {
        toast.error('Erro ao atualizar compromisso!');
        console.error(error);
      } else {
        toast.success('Compromisso atualizado!');
        loadCompromissos();
        handleCloseDialog();
      }
    } else {
      // Criar
      const { error } = await supabase
        .from('compromissos')
        .insert([compromissoData]);

      if (error) {
        toast.error('Erro ao criar compromisso!');
        console.error(error);
      } else {
        toast.success('Compromisso criado!');
        loadCompromissos();
        handleCloseDialog();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      toast.error('Sem permissão para deletar!');
      return;
    }

    const { error } = await supabase
      .from('compromissos')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao deletar compromisso!');
    } else {
      toast.success('Compromisso deletado!');
      loadCompromissos();
    }
  };

  const handleToggleConcluido = async (compromisso: Compromisso) => {
    const { error } = await supabase
      .from('compromissos')
      .update({ concluido: !compromisso.concluido })
      .eq('id', compromisso.id);

    if (error) {
      toast.error('Erro ao atualizar status!');
    } else {
      toast.success(compromisso.concluido ? 'Compromisso reaberto!' : 'Compromisso concluído!');
      loadCompromissos();
    }
  };

  const handleOpenDialog = (compromisso?: Compromisso) => {
    if (compromisso) {
      setEditingCompromisso(compromisso);
      
      // Converte a data UTC do banco para o formato datetime-local
      // O new Date() já converte UTC para timezone local automaticamente
      const dataLocal = new Date(compromisso.data_compromisso);
      
      // Formata para o formato esperado pelo input datetime-local (YYYY-MM-DDTHH:mm)
      // Precisamos subtrair o offset do timezone para manter a hora visível correta
      const ano = dataLocal.getFullYear();
      const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(dataLocal.getDate()).padStart(2, '0');
      const hora = String(dataLocal.getHours()).padStart(2, '0');
      const minuto = String(dataLocal.getMinutes()).padStart(2, '0');
      const dataFormatada = `${ano}-${mes}-${dia}T${hora}:${minuto}`;
      
      setFormData({
        titulo: compromisso.titulo,
        descricao: compromisso.descricao || '',
        data_compromisso: dataFormatada,
        cliente: compromisso.cliente || '',
        local: compromisso.local || ''
      });
    } else {
      setEditingCompromisso(null);
      setFormData({
        titulo: '',
        descricao: '',
        data_compromisso: '',
        cliente: '',
        local: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCompromisso(null);
    setFormData({
      titulo: '',
      descricao: '',
      data_compromisso: '',
      cliente: '',
      local: ''
    });
  };

  const compromissosFiltrados = compromissos.filter(c => {
    if (filtro === 'concluidos') return c.concluido;
    if (filtro === 'proximos') {
      const hoje = new Date();
      const dataCompromisso = new Date(c.data_compromisso);
      return !c.concluido && dataCompromisso >= hoje;
    }
    return true;
  });

  const formatarData = (data: string) => {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const diasRestantes = (data: string) => {
    const hoje = new Date();
    const dataCompromisso = new Date(data);
    const diff = Math.ceil((dataCompromisso.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Funções do calendário visual
  const getDiasDoMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay(); // 0 = domingo
    
    const dias: (Date | null)[] = [];
    
    // Adiciona dias vazios no início
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(null);
    }
    
    // Adiciona os dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
      dias.push(new Date(ano, mes, dia));
    }
    
    return dias;
  };

  const getCompromissosDoDia = (dia: Date) => {
    return compromissos.filter(c => {
      const dataC = new Date(c.data_compromisso);
      return dataC.getDate() === dia.getDate() &&
             dataC.getMonth() === dia.getMonth() &&
             dataC.getFullYear() === dia.getFullYear();
    });
  };

  const handleDiaClick = (dia: Date) => {
    const compromissosDia = getCompromissosDoDia(dia);
    if (compromissosDia.length > 0) {
      setDiaSelecionado(dia);
      setShowDayDialog(true);
    }
  };

  const handleCloseDayDialog = () => {
    setShowDayDialog(false);
  };

  const proximoMes = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
  };

  const mesAnterior = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  };

  const mesAtualNome = mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="calendario-container">
        <div className="calendario-loading">
          <div className="calendario-spinner"></div>
          <p>Carregando calendário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendario-container">
      {/* Header */}
      <div className="calendario-header">
        <div className="calendario-header-content">
          <h1><CalendarIcon /> Calendário</h1>
          <p>Gerencie seus compromissos e visitas a clientes</p>
        </div>
        {canCreateCompromisso && (
          <button
            onClick={() => handleOpenDialog()}
            className="calendario-btn-primary"
          >
            <Plus size={18} />
            Novo Compromisso
          </button>
        )}
      </div>

      {/* Calendário Visual */}
      <div className="calendario-visual-container">
        <div className="calendario-visual-header">
          <button onClick={mesAnterior} className="calendario-nav-btn">
            <ChevronLeft size={20} />
          </button>
          <h2 className="calendario-mes-ano">{mesAtualNome}</h2>
          <button onClick={proximoMes} className="calendario-nav-btn">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="calendario-visual-grid">
          {/* Dias da semana */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
            <div key={dia} className="calendario-dia-semana">{dia}</div>
          ))}

          {/* Dias do mês */}
          {getDiasDoMes().map((dia, index) => {
            if (!dia) {
              return <div key={`empty-${index}`} className="calendario-dia-vazio"></div>;
            }

            const compromissosDia = getCompromissosDoDia(dia);
            const temCompromissos = compromissosDia.length > 0;
            const isHoje = dia.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`calendario-dia ${temCompromissos ? 'has-event' : ''} ${isHoje ? 'hoje' : ''}`}
                onClick={() => temCompromissos && handleDiaClick(dia)}
              >
                <span className="calendario-dia-numero">{dia.getDate()}</span>
                {temCompromissos && (
                  <div className="calendario-dia-dots">
                    {compromissosDia.slice(0, 3).map((_, i) => (
                      <span key={i} className="calendario-dot"></span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtros */}
      <div className="calendario-filtros">
        <button
          className={`calendario-filtro ${filtro === 'todos' ? 'active' : ''}`}
          onClick={() => setFiltro('todos')}
        >
          Todos ({compromissos.length})
        </button>
        <button
          className={`calendario-filtro ${filtro === 'proximos' ? 'active' : ''}`}
          onClick={() => setFiltro('proximos')}
        >
          Próximos ({compromissos.filter(c => !c.concluido && new Date(c.data_compromisso) >= new Date()).length})
        </button>
        <button
          className={`calendario-filtro ${filtro === 'concluidos' ? 'active' : ''}`}
          onClick={() => setFiltro('concluidos')}
        >
          Concluídos ({compromissos.filter(c => c.concluido).length})
        </button>
      </div>

      {/* Lista de Compromissos */}
      <div className="calendario-lista">
        {compromissosFiltrados.length === 0 ? (
          <div className="calendario-empty">
            <CalendarIcon size={48} />
            <h3>Nenhum compromisso encontrado</h3>
            <p>Crie um novo compromisso para começar</p>
          </div>
        ) : (
          compromissosFiltrados.map(compromisso => {
            const dias = diasRestantes(compromisso.data_compromisso);
            const isProximo = dias >= 0 && dias <= 5 && !compromisso.concluido;
            
            return (
              <div
                key={compromisso.id}
                className={`calendario-card ${compromisso.concluido ? 'concluido' : ''} ${isProximo ? 'proximo' : ''}`}
              >
                <div className="calendario-card-header">
                  <div className="calendario-card-date">
                    <Clock size={16} />
                    <span>{formatarData(compromisso.data_compromisso)}</span>
                    {isProximo && (
                      <span className="calendario-badge-alerta">
                        {dias === 0 ? 'HOJE' : `${dias} ${dias === 1 ? 'dia' : 'dias'}`}
                      </span>
                    )}
                  </div>
                  <div className="calendario-card-actions">
                    <button
                      onClick={() => handleToggleConcluido(compromisso)}
                      className="calendario-btn-icon"
                      title={compromisso.concluido ? 'Reabrir' : 'Concluir'}
                    >
                      <CheckCircle size={18} />
                    </button>
                    {canEdit && !compromisso.concluido && (
                      <button
                        onClick={() => handleOpenDialog(compromisso)}
                        className="calendario-btn-icon edit"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(compromisso.id)}
                        className="calendario-btn-icon delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="calendario-card-body">
                  <h3>{compromisso.titulo}</h3>
                  {compromisso.descricao && <p className="calendario-card-descricao">{compromisso.descricao}</p>}
                  
                  <div className="calendario-card-info">
                    {compromisso.cliente && (
                      <div className="calendario-card-info-item">
                        <User size={14} />
                        <span>{compromisso.cliente}</span>
                      </div>
                    )}
                    {compromisso.local && (
                      <div className="calendario-card-info-item">
                        <MapPin size={14} />
                        <span>{compromisso.local}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dialog de Detalhes do Dia - Modal estilizado */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="calendario-day-dialog-content">
          <DialogHeader>
            <DialogTitle className="calendario-day-dialog-title">
              <CalendarIcon size={20} />
              {diaSelecionado && diaSelecionado.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long',
                year: 'numeric'
              })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="calendario-day-list">
            {diaSelecionado && getCompromissosDoDia(diaSelecionado).map(compromisso => {
              const dias = diasRestantes(compromisso.data_compromisso);
              const isProximo = dias >= 0 && dias <= 5 && !compromisso.concluido;
              
              return (
                <div key={compromisso.id} className={`calendario-day-item ${compromisso.concluido ? 'concluido' : ''}`}>
                  <div className="calendario-day-item-header">
                    <div className="calendario-day-item-time">
                      <Clock size={14} />
                      <span>{new Date(compromisso.data_compromisso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {isProximo && (
                      <span className="calendario-day-badge-alerta">
                        {dias === 0 ? 'HOJE' : `${dias}d`}
                      </span>
                    )}
                  </div>
                  
                  <h4 className="calendario-day-item-title">{compromisso.titulo}</h4>
                  
                  {compromisso.descricao && (
                    <p className="calendario-day-item-descricao">{compromisso.descricao}</p>
                  )}
                  
                  <div className="calendario-day-item-info">
                    {compromisso.cliente && (
                      <div className="calendario-day-info-item">
                        <User size={12} />
                        <span>{compromisso.cliente}</span>
                      </div>
                    )}
                    {compromisso.local && (
                      <div className="calendario-day-info-item">
                        <MapPin size={12} />
                        <span>{compromisso.local}</span>
                      </div>
                    )}
                  </div>

                  <div className="calendario-day-item-actions">
                    <button
                      onClick={() => handleToggleConcluido(compromisso)}
                      className={`calendario-day-btn ${compromisso.concluido ? 'reabrir' : 'concluir'}`}
                      title={compromisso.concluido ? 'Reabrir' : 'Concluir'}
                    >
                      <CheckCircle size={16} />
                      {compromisso.concluido ? 'Reabrir' : 'Concluir'}
                    </button>
                    {canEdit && !compromisso.concluido && (
                      <button
                        onClick={() => {
                          setShowDayDialog(false);
                          handleOpenDialog(compromisso);
                        }}
                        className="calendario-day-btn edit"
                      >
                        <Edit2 size={16} />
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação/Edição - Padrão shadcn/ui */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="calendario-dialog-content">
          <DialogHeader>
            <DialogTitle className="calendario-dialog-title">
              <CalendarIcon />
              {editingCompromisso ? 'Editar Compromisso' : 'Novo Compromisso'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="calendario-form">
            <div className="calendario-form-field">
              <label>Título *</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Visita à Obra ENF Clinic"
                required
              />
            </div>

            <div className="calendario-form-field">
              <label>Data e Hora *</label>
              <input
                type="datetime-local"
                value={formData.data_compromisso}
                onChange={(e) => setFormData({ ...formData, data_compromisso: e.target.value })}
                required
              />
            </div>

            <div className="calendario-form-field">
              <label>Cliente</label>
              <input
                type="text"
                value={formData.cliente}
                onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>

            <div className="calendario-form-field">
              <label>Local</label>
              <input
                type="text"
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Endereço ou local da visita"
              />
            </div>

            <div className="calendario-form-field">
              <label>Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Detalhes adicionais sobre o compromisso..."
                rows={4}
              />
            </div>

            <div className="calendario-form-actions">
              <button type="button" className="calendario-btn-cancel" onClick={handleCloseDialog}>
                Cancelar
              </button>
              <button type="submit" className="calendario-btn-save">
                {editingCompromisso ? 'Salvar Alterações' : 'Criar Compromisso'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
