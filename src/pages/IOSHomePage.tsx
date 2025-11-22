import React, { useMemo, useState, useEffect } from 'react';
import AppIcon, { AppConfig } from '../features/launcher/AppIcon';
import { supabase } from '../utils/supabaseClient';
import { useSaldoCaixa } from '../hooks/useSaldoCaixa';
import '../features/launcher/ios-home.css';

// MUI Icons
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DescriptionIcon from '@mui/icons-material/Description';
import ConstructionIcon from '@mui/icons-material/Construction';
import AppsIcon from '@mui/icons-material/Apps';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PersonIcon from '@mui/icons-material/Person';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import ExploreIcon from '@mui/icons-material/Explore';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

// Tipos de widgets disponíveis
type WidgetType = 
  | 'compromissos' 
  | 'financeiro-resumo' 
  | 'financeiro-receitas'
  | 'financeiro-despesas'
  | 'financeiro-saldo'
  | 'obras-ativas'
  | 'obras-finalizadas'
  | 'funcionarios-total'
  | 'propostas-pendentes'
  | 'dividas-total'
  | 'receber-total';

interface WidgetConfig {
  id: number;
  type: WidgetType;
  title: string;
}

interface WidgetOption {
  value: WidgetType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export default function IOSHomePage() {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 2;
  
  // Hook para buscar o saldo real do Caixa
  const { saldo: saldoCaixa, loading: loadingSaldo } = useSaldoCaixa();
  
  // Configurações de widgets (salvos no localStorage)
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem('widget_configs');
    return saved ? JSON.parse(saved) : [
      { id: 1, type: 'compromissos', title: 'Próximos Compromissos' },
      { id: 2, type: 'financeiro-resumo', title: 'Resumo Financeiro' },
      { id: 3, type: 'obras-ativas', title: 'Obras em Andamento' }
    ];
  });

  // Modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<WidgetType>('compromissos');

  // Opções de widgets disponíveis
  const widgetOptions: WidgetOption[] = [
    { value: 'compromissos', label: 'Compromissos Hoje', icon: <CalendarMonthIcon />, description: 'Quantidade de compromissos para hoje' },
    { value: 'financeiro-resumo', label: 'Resumo Financeiro', icon: <QueryStatsIcon />, description: 'Receitas, despesas e saldo do mês' },
    { value: 'financeiro-receitas', label: 'Receitas do Mês', icon: <TrendingUpIcon />, description: 'Total de receitas deste mês' },
    { value: 'financeiro-despesas', label: 'Despesas do Mês', icon: <TrendingDownIcon />, description: 'Total de despesas deste mês' },
    { value: 'financeiro-saldo', label: 'Saldo Total', icon: <AccountBalanceIcon />, description: 'Saldo total do caixa' },
    { value: 'obras-ativas', label: 'Obras Ativas', icon: <ConstructionIcon />, description: 'Quantidade de obras em andamento' },
    { value: 'obras-finalizadas', label: 'Obras Finalizadas', icon: <ConstructionIcon />, description: 'Quantidade de obras concluídas' },
    { value: 'funcionarios-total', label: 'Total Funcionários', icon: <PeopleOutlineIcon />, description: 'Quantidade de funcionários cadastrados' },
    { value: 'propostas-pendentes', label: 'Propostas Pendentes', icon: <DescriptionIcon />, description: 'Propostas aguardando aprovação' },
    { value: 'dividas-total', label: 'Total de Dívidas', icon: <WarningAmberIcon />, description: 'Valor total de dívidas' },
    { value: 'receber-total', label: 'Total a Receber', icon: <DownloadIcon />, description: 'Valor total a receber' }
  ];
  
  // Estados para dados reais
  const [financialData, setFinancialData] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0
  });
  const [obrasAtivas, setObrasAtivas] = useState(0);
  const [obrasFinalizadas, setObrasFinalizadas] = useState(0);
  const [funcionariosTotal, setFuncionariosTotal] = useState(0);
  const [propostasPendentes, setPropostasPendentes] = useState(0);
  const [dividasTotal, setDividasTotal] = useState(0);
  const [receberTotal, setReceberTotal] = useState(0);
  const [compromissosHoje, setCompromissosHoje] = useState(0);
  const [loading, setLoading] = useState(true);

  // Salvar configurações no localStorage
  useEffect(() => {
    localStorage.setItem('widget_configs', JSON.stringify(widgetConfigs));
  }, [widgetConfigs]);

  // Abrir modal de customização geral
  const openCustomizeModal = () => {
    console.log('🎨 Abrindo modal de adicionar widget');
    setEditingWidgetId(null);
    setEditModalOpen(true);
  };

  // Abrir modal de edição de widget específico
  const openEditModal = (widgetId: number) => {
    const widget = widgetConfigs.find(w => w.id === widgetId);
    if (widget) {
      setEditingWidgetId(widgetId);
      setSelectedType(widget.type);
      setEditModalOpen(true);
    }
  };

  // Adicionar novo widget
  const handleAddWidget = () => {
    const option = widgetOptions.find(opt => opt.value === selectedType);
    if (!option) return;

    const newId = Math.max(...widgetConfigs.map(w => w.id), 0) + 1;
    setWidgetConfigs(prev => [...prev, {
      id: newId,
      type: selectedType,
      title: option.label
    }]);

    setEditModalOpen(false);
  };

  // Salvar alterações do widget
  const handleSaveWidget = () => {
    if (editingWidgetId === null) {
      handleAddWidget();
      return;
    }

    const option = widgetOptions.find(opt => opt.value === selectedType);
    if (!option) return;

    setWidgetConfigs(prev => prev.map(w => 
      w.id === editingWidgetId 
        ? { ...w, type: selectedType, title: option.label }
        : w
    ));

    setEditModalOpen(false);
    setEditingWidgetId(null);
  };

  // Remover widget
  const handleRemoveWidget = (widgetId: number) => {
    if (widgetConfigs.length <= 1) {
      alert('Você precisa ter pelo menos 1 widget');
      return;
    }
    setWidgetConfigs(prev => prev.filter(w => w.id !== widgetId));
  };

  // Buscar dados reais do Supabase
  useEffect(() => {
    const fetchWidgetData = async () => {
      try {
        setLoading(true);
        console.log('📊 [Widget] Iniciando busca de dados...');

        // 1. Buscar transações do mês atual para receitas/despesas
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        const { data: transacoesMes, error: erroMes } = await supabase
          .from('transacoes')
          .select('tipo, valor')
          .gte('data', primeiroDiaMes.toISOString().split('T')[0])
          .lte('data', ultimoDiaMes.toISOString().split('T')[0]);

        console.log('📊 [Widget] Transações do mês:', transacoesMes?.length || 0);
        if (erroMes) console.error('❌ [Widget] Erro ao buscar transações do mês:', erroMes);

        const receitas = transacoesMes?.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor, 0) || 0;
        const despesas = transacoesMes?.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + t.valor, 0) || 0;

        console.log('📈 [Widget] Receitas:', receitas, '| Despesas:', despesas);

        setFinancialData({
          receitas,
          despesas,
          saldo: saldoCaixa // Usando o saldo do hook
        });

        console.log('✅ [Widget] Dados financeiros salvos:', { receitas, despesas, saldo: saldoCaixa });

        // 3. Buscar obras ativas e finalizadas
        const { count: ativas } = await supabase
          .from('obras')
          .select('*', { count: 'exact', head: true })
          .eq('finalizada', false);

        const { count: finalizadas } = await supabase
          .from('obras')
          .select('*', { count: 'exact', head: true })
          .eq('finalizada', true);

        setObrasAtivas(ativas || 0);
        setObrasFinalizadas(finalizadas || 0);

        // 4. Total de funcionários
        const { count: funcionarios } = await supabase
          .from('funcionarios')
          .select('*', { count: 'exact', head: true });

        setFuncionariosTotal(funcionarios || 0);

        // 5. Propostas pendentes
        const { count: propostas } = await supabase
          .from('propostas')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente');

        setPropostasPendentes(propostas || 0);

        // 6. Compromissos de hoje
        const hojeStr = hoje.toISOString().split('T')[0];
        const { count: compromissos } = await supabase
          .from('compromissos')
          .select('*', { count: 'exact', head: true })
          .eq('data', hojeStr);

        setCompromissosHoje(compromissos || 0);

        // 7. Total de dívidas
        const { data: dividas } = await supabase
          .from('dividas_pagas')
          .select('valor_total')
          .eq('pago', false);

        const totalDividas = dividas?.reduce((sum, d) => sum + (d.valor_total || 0), 0) || 0;
        setDividasTotal(totalDividas);

        // 8. Total a receber
        const { data: receber } = await supabase
          .from('receber_tab')
          .select('valor')
          .eq('recebido', false);

        const totalReceber = receber?.reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
        setReceberTotal(totalReceber);

        console.log('✅ [Widget] Busca completa! Loading: false');

      } catch (error) {
        console.error('❌ [Widget] Erro geral ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWidgetData();
  }, [saldoCaixa]); // Atualiza quando o saldo mudar

  // Renderizar widget baseado no tipo
  const renderWidget = (config: WidgetConfig) => {
    const option = widgetOptions.find(opt => opt.value === config.type);
    if (!option) return null;

    let content = null;
    let iconElement = option.icon;

    switch (config.type) {
      case 'compromissos':
        content = (
          <div className="ios-widget-content">
            {loading ? (
              <p>Carregando...</p>
            ) : compromissosHoje > 0 ? (
              <div className="ios-widget-big-number">{compromissosHoje}</div>
            ) : (
              <p>Nenhum compromisso hoje</p>
            )}
          </div>
        );
        break;

      case 'financeiro-resumo':
        content = (
          <div className="ios-widget-content">
            {loading || loadingSaldo ? (
              <p>Carregando...</p>
            ) : (
              <div className="ios-widget-finance-grid">
                <div className="ios-finance-item">
                  <span className="ios-finance-label">Receitas</span>
                  <span className="ios-finance-value positive">
                    R$ {financialData.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="ios-finance-item">
                  <span className="ios-finance-label">Despesas</span>
                  <span className="ios-finance-value negative">
                    R$ {financialData.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="ios-finance-item">
                  <span className="ios-finance-label">Saldo do Caixa</span>
                  <span className={`ios-finance-value ${saldoCaixa >= 0 ? 'positive' : 'negative'}`}>
                    R$ {saldoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
        break;

      case 'financeiro-receitas':
        content = (
          <div className="ios-widget-content">
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <>
                <div className="ios-widget-big-number positive">
                  R$ {financialData.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="ios-widget-subtitle">Receitas do mês</p>
              </>
            )}
          </div>
        );
        break;

      case 'financeiro-despesas':
        content = (
          <div className="ios-widget-content">
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <>
                <div className="ios-widget-big-number negative">
                  R$ {financialData.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="ios-widget-subtitle">Despesas do mês</p>
              </>
            )}
          </div>
        );
        break;

      case 'financeiro-saldo':
        content = (
          <div className="ios-widget-content">
            {loadingSaldo ? (
              <p>Carregando...</p>
            ) : (
              <>
                <div className={`ios-widget-big-number ${saldoCaixa >= 0 ? 'positive' : 'negative'}`}>
                  R$ {saldoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="ios-widget-subtitle">Saldo do caixa</p>
              </>
            )}
          </div>
        );
        break;

      case 'obras-ativas':
        content = (
          <div className="ios-widget-content">
            {loading ? (
              <p>Carregando...</p>
            ) : obrasAtivas > 0 ? (
              <div className="ios-widget-big-number">{obrasAtivas}</div>
            ) : (
              <p>Nenhuma obra em andamento</p>
            )}
          </div>
        );
        break;

      case 'obras-finalizadas':
        content = (
          <div className="ios-widget-content">
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <>
                <div className="ios-widget-big-number">{obrasFinalizadas}</div>
                <p className="ios-widget-subtitle">Obras concluídas</p>
              </>
            )}
          </div>
        );
        break;

      case 'funcionarios-total':
        content = (
          <div className="ios-widget-content">
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <>
                <div className="ios-widget-big-number">{funcionariosTotal}</div>
                <p className="ios-widget-subtitle">Funcionários cadastrados</p>
              </>
            )}
          </div>
        );
        break;

      case 'propostas-pendentes':
        content = (
          <div className="ios-widget-content">
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <>
                <div className="ios-widget-big-number">{propostasPendentes}</div>
                <p className="ios-widget-subtitle">Aguardando aprovação</p>
              </>
            )}
          </div>
        );
        break;

      case 'dividas-total':
        content = (
          <div className="ios-widget-content">
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <>
                <div className="ios-widget-big-number negative">
                  R$ {dividasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="ios-widget-subtitle">Total de dívidas</p>
              </>
            )}
          </div>
        );
        break;

      case 'receber-total':
        content = (
          <div className="ios-widget-content">
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <>
                <div className="ios-widget-big-number positive">
                  R$ {receberTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="ios-widget-subtitle">Total a receber</p>
              </>
            )}
          </div>
        );
        break;

      default:
        content = <p>Widget não configurado</p>;
    }

    return (
      <div key={config.id} className={`ios-widget ios-widget-${config.type}`}>
        <div className="ios-widget-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {iconElement}
          <span style={{ flex: 1 }}>{config.title}</span>
          <div className="ios-widget-actions" style={{ 
            display: 'flex', 
            gap: '0.5rem',
            marginLeft: 'auto'
          }}>
            <button 
              className="ios-widget-edit-btn" 
              onClick={() => {
                console.log('✏️ Editando widget', config.id);
                openEditModal(config.id);
              }}
              title="Editar widget"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <SettingsIcon fontSize="small" />
            </button>
            <button 
              className="ios-widget-remove-btn" 
              onClick={() => {
                console.log('🗑️ Removendo widget', config.id);
                handleRemoveWidget(config.id);
              }}
              title="Remover widget"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(255, 59, 48, 0.2)',
                color: 'rgba(255, 59, 48, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <DeleteIcon fontSize="small" />
            </button>
          </div>
        </div>
        {content}
      </div>
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Bloqueia comportamento padrão
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (currentPage === 0 && Math.abs(touch.clientX - touch.clientY) > 5) {
      e.preventDefault(); // Bloqueia arraste horizontal na tela inicial
    }
  };

  const apps = useMemo<AppConfig[]>(() => [
    { 
      id: 'lancamentos', 
      label: 'Lançamentos', 
      gradient: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
      icon: <AttachMoneyIcon />, 
      route: '/caixa'
    },
    { 
      id: 'calendario', 
      label: 'Calendário', 
      gradient: 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)',
      icon: <CalendarMonthIcon />, 
      route: '/calendario'
    },
    { 
      id: 'propostas', 
      label: 'Propostas', 
      gradient: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
      icon: <DescriptionIcon />, 
      route: '/propostas'
    },
    { 
      id: 'obras', 
      label: 'Obras', 
      gradient: 'linear-gradient(135deg, #AF52DE 0%, #8E3CC9 100%)',
      icon: <ConstructionIcon />, 
      route: '/obras-hub'
    },
    { 
      id: 'cards', 
      label: 'Cards de Obra', 
      gradient: 'linear-gradient(135deg, #32ADE6 0%, #0A84FF 100%)',
      icon: <AppsIcon />,
      route: '/cards-de-obra'
    },
    { 
      id: 'minhas-obras', 
      label: 'Minhas Obras', 
      gradient: 'linear-gradient(135deg, #00C7BE 0%, #00A8A0 100%)',
      icon: <ContentPasteIcon />,
      route: '/minhas-obras'
    },
    { 
      id: 'receber', 
      label: 'A Receber', 
      gradient: 'linear-gradient(135deg, #5AC8FA 0%, #0A84FF 100%)',
      icon: <DownloadIcon />,
      route: '/receber'
    },
    { 
      id: 'dividas', 
      label: 'Dívidas', 
      gradient: 'linear-gradient(135deg, #FF3B30 0%, #D70015 100%)',
      icon: <WarningAmberIcon />,
      route: '/dividas'
    },
    { 
      id: 'funcionarios', 
      label: 'Funcionários', 
      gradient: 'linear-gradient(135deg, #BF5AF2 0%, #A346D8 100%)',
      icon: <PeopleOutlineIcon />,
      route: '/funcionarios'
    },
    { 
      id: 'conta', 
      label: 'Minha Conta', 
      gradient: 'linear-gradient(135deg, #8E8E93 0%, #636366 100%)',
      icon: <PersonIcon />,
      route: '/minha-conta'
    },
    { 
      id: 'financeiro', 
      label: 'Financeiro', 
      gradient: 'linear-gradient(135deg, #0A84FF 0%, #0051D5 100%)',
      icon: <QueryStatsIcon />,
      route: '/financeiro-hub'
    },
    { 
      id: 'obras-hub', 
      label: 'Obras Hub', 
      gradient: 'linear-gradient(135deg, #AF52DE 0%, #8E3CC9 100%)',
      icon: <ExploreIcon />,
      route: '/obras-hub'
    },
  ], []);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      className="ios-home-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Status Bar */}
      <div className="ios-status-bar">
        <div style={{ width: 60 }}></div>
        <div className="ios-status-time">{getCurrentTime()}</div>
        <div style={{ width: 60 }}></div>
      </div>

      {/* Container de Páginas */}
      <div 
        className="ios-pages-container"
        style={{
          transform: `translateX(-${currentPage * 100}%)`,
          transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {/* Página 1 - Apps */}
        <div className="ios-page">
          <div className="ios-app-grid">
            {apps.map((app, index) => (
              <div key={app.id} style={{ '--item-index': index } as React.CSSProperties}>
                <AppIcon app={app} />
              </div>
            ))}
          </div>
        </div>

        {/* Página 2 - Widgets */}
        <div className="ios-page ios-widgets-page">
          <div className="ios-widgets-container">
            <div className="ios-widgets-header" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '24px',
              gap: '1rem',
              position: 'relative',
              zIndex: 10
            }}>
              <h2 className="ios-widgets-title" style={{ margin: 0 }}>Widgets</h2>
              <button 
                className="ios-widgets-add-btn"
                onClick={openCustomizeModal}
                title="Adicionar Widget"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(10, 132, 255, 0.3)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}
              >
                <AddIcon fontSize="small" />
                <span>Adicionar</span>
              </button>
            </div>
            
            {/* Renderizar widgets dinamicamente */}
            {widgetConfigs.map(config => renderWidget(config))}
          </div>
        </div>
      </div>

      {/* Indicadores de Página */}
      <div className="ios-page-indicators">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index} 
            className={`ios-page-indicator ${index === currentPage ? 'active' : ''}`}
            onClick={() => setCurrentPage(index)}
            aria-label={`Página ${index + 1}`}
          />
        ))}
      </div>

      {/* Modal de Edição/Adição de Widget */}
      {editModalOpen && (
        <div className="ios-widget-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="ios-widget-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ios-widget-modal-header">
              <h3>{editingWidgetId ? 'Editar Widget' : 'Adicionar Widget'}</h3>
              <button 
                className="ios-widget-modal-close" 
                onClick={() => setEditModalOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="ios-widget-modal-body">
              <label className="ios-widget-modal-label">
                Tipo de Widget
              </label>
              <select 
                className="ios-widget-modal-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as WidgetType)}
              >
                {widgetOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="ios-widget-modal-preview">
                {widgetOptions.find(opt => opt.value === selectedType)?.description}
              </div>
            </div>

            <div className="ios-widget-modal-footer">
              <button 
                className="ios-widget-modal-btn ios-widget-modal-btn-cancel"
                onClick={() => setEditModalOpen(false)}
              >
                Cancelar
              </button>
              <button 
                className="ios-widget-modal-btn ios-widget-modal-btn-save"
                onClick={handleSaveWidget}
              >
                {editingWidgetId ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
