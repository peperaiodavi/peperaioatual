import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// Imports corretos dos hooks do projeto
import { useTransacoes } from '../hooks/queries/useTransacoes';
import { useCompromissos } from '../hooks/queries/useCompromissos';
import { useObras } from '../hooks/queries/useObras';
import { useAuth } from '../context/AuthContext';
import { format, isToday, isTomorrow, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QuickTransactionCard from '../components/QuickTransactionCard';
import AppleIcon from '../components/AppleIcon';
import '../components/AppleIcon.css';
import './inicio.css';

// Material UI Icons - Outline Style
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';

interface AppConfig {
  id: string;
  label: string;
  gradient: string;
  icon: React.ReactNode;
  route: string;
}

const apps: AppConfig[] = [
  { 
    id: 'lancamentos', 
    label: 'Lançamentos', 
    gradient: '#34C759',
    icon: <AttachMoneyOutlinedIcon sx={{ fontSize: 32 }} />,
    route: '/caixa'
  },
  { 
    id: 'calendario', 
    label: 'Calendário', 
    gradient: '#007AFF',
    icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 32 }} />,
    route: '/calendario'
  },
  { 
    id: 'propostas', 
    label: 'Propostas', 
    gradient: '#FF9500',
    icon: <DescriptionOutlinedIcon sx={{ fontSize: 32 }} />,
    route: '/propostas'
  },
  { 
    id: 'obras', 
    label: 'Obras', 
    gradient: '#AF52DE',
    icon: <ConstructionOutlinedIcon sx={{ fontSize: 32 }} />,
    route: '/obras-hub'
  },
  { 
    id: 'cards', 
    label: 'Cards de Obra', 
    gradient: '#32ADE6',
    icon: <CreditCardOutlinedIcon sx={{ fontSize: 32 }} />,
    route: '/cards-de-obra'
  },
  { 
    id: 'minhas-obras', 
    label: 'Minhas Obras', 
    gradient: '#00C7BE',
    icon: <FolderOutlinedIcon sx={{ fontSize: 32 }} />,
    route: '/minhas-obras'
  },
  { 
    id: 'receber', 
    label: 'A Receber', 
    gradient: '#5AC8FA',
    icon: <ReceiptOutlinedIcon sx={{ fontSize: 32 }} />,
    route: '/receber'
  },
  { 
    id: 'dividas', 
    label: 'Dívidas', 
    gradient: '#FF3B30',
    icon: <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 32 }} />,
    route: '/dividas'
  },
  { 
    id: 'funcionarios', 
    label: 'Funcionários', 
    gradient: '#BF5AF2',
    icon: <PeopleOutlineIcon sx={{ fontSize: 32 }} />,
    route: '/funcionarios'
  },
  { 
    id: 'minha-conta', 
    label: 'Minha Conta', 
    gradient: '#8E8E93',
    icon: <AccountCircleOutlinedIcon sx={{ fontSize: 32 }} />,
    route: '/minha-conta'
  },
  { 
    id: 'financeiro', 
    label: 'Financeiro', 
    gradient: '#0A84FF',
    icon: <ShowChartOutlinedIcon sx={{ fontSize: 32 }} />,
    route: '/financeiro-hub'
  },
  { 
    id: 'obras-hub', 
    label: 'Obras Hub', 
    gradient: '#AF52DE',
    icon: <AppsOutlinedIcon sx={{ fontSize: 32 }} />,
    route: '/obras-hub'
  },
  // Ícone pepIA
  {
    id: 'pepIA',
    label: 'pepIA',
    gradient: '#FFD600', // Amarelo vibrante, destaque
    icon: (
      <span style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        fontWeight: 700,
        fontSize: 22,
        color: '#222',
        fontFamily: 'Montserrat, Arial, sans-serif',
        letterSpacing: 0.5,
      }}>
        <span style={{ fontWeight: 900 }}>IA</span>
      </span>
    ),
    route: '/pepIA-section',
  },
];

interface AppIconProps {
  app: AppConfig;
  index: number;
}

const AppIcon: React.FC<AppIconProps> = ({ app, index }) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTimeout(() => {
      navigate(app.route);
    }, 100);
  };

  return (
    <div 
      className="app-item" 
      onClick={handleClick}
      style={{ '--item-index': index } as React.CSSProperties}
    >
      <AppleIcon 
        gradient={app.gradient}
        icon={app.icon}
      />
      <span className="app-label">{app.label}</span>
    </div>
  );
};

export default function Inicio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Buscar dados reais
  const { data: transacoes, isLoading: loadingTransacoes } = useTransacoes();
  const { data: compromissos, isLoading: loadingCompromissos } = useCompromissos();
  const { data: obras, isLoading: loadingObras } = useObras();

  // Calcular resumo financeiro
  const resumoFinanceiro = useMemo(() => {
    if (!transacoes) return { receitas: 0, despesas: 0, saldo: 0 };

    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);

    const transacoesMes = transacoes.filter(t => {
      const data = parseISO(t.data);
      return data >= inicioMes && data <= fimMes;
    });

    const receitas = transacoesMes
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + t.valor, 0);

    const despesas = transacoesMes
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + t.valor, 0);

    return {
      receitas,
      despesas,
      saldo: receitas - despesas
    };
  }, [transacoes]);

  // Filtrar compromissos próximos
  const compromissosProximos = useMemo(() => {
    if (!compromissos) return [];

    const hoje = new Date();
    return compromissos
      .filter(c => {
        const dataCompromisso = parseISO(c.data);
        return dataCompromisso >= hoje && c.status !== 'concluido';
      })
      .sort((a, b) => {
        const dataA = parseISO(a.data);
        const dataB = parseISO(b.data);
        return dataA.getTime() - dataB.getTime();
      })
      .slice(0, 3);
  }, [compromissos]);

  // Filtrar obras em andamento
  const obrasEmAndamento = useMemo(() => {
    if (!obras) return [];
    return obras.filter(o => o.status !== 'Finalizada' && o.status !== 'Cancelada').slice(0, 3);
  }, [obras]);

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarDataCompromisso = (data: string) => {
    const dataObj = parseISO(data);
    if (isToday(dataObj)) return 'Hoje';
    if (isTomorrow(dataObj)) return 'Amanhã';
    return format(dataObj, "dd 'de' MMM", { locale: ptBR });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    
    // Limitar o arraste baseado na página atual
    if (currentPage === 0 && diff > 0) {
      // Não permite arrastar para direita na primeira página
      return;
    }
    if (currentPage === 1 && diff < 0) {
      // Não permite arrastar para esquerda na última página
      return;
    }
    
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    const threshold = 75; // Threshold para considerar uma mudança de página
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset < 0 && currentPage === 0) {
        // Swipe para esquerda - vai para página 1
        setCurrentPage(1);
      } else if (dragOffset > 0 && currentPage === 1) {
        // Swipe para direita - volta para página 0
        setCurrentPage(0);
      }
    }
    
    setDragOffset(0);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      className="inicio-screen"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Poeiras flutuantes */}
      <div className="dust-container">
        {Array.from({ length: 40 }).map((_, i) => (
          <div 
            key={i} 
            className="dust-particle"
            style={{
              '--delay': `${Math.random() * 5}s`,
              '--duration': `${12 + Math.random() * 12}s`,
              '--x': `${Math.random() * 100}vw`,
              '--size': `${3 + Math.random() * 5}px`
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div style={{ width: 60 }}></div>
        <div className="status-time">{getCurrentTime()}</div>
        <div style={{ width: 60 }}></div>
      </div>

      {/* Container de Páginas */}
      <div 
        className="pages-container"
        style={{
          transform: `translateX(calc(-${currentPage * 100}vw + ${dragOffset}px))`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Página 1 - Apps */}
        <div className="page">
          <div className="app-grid">
            {apps.map((app, index) => (
              <AppIcon key={app.id} app={app} index={index} />
            ))}
          </div>
          
          {/* Card de Lançamento Rápido - Oculto para Isaac */}
          {user && user.email?.toLowerCase() !== 'isaacpeperaio@gmail.com' && (
            <div style={{ 
              padding: '0 20px', 
              marginTop: '8px',
              maxWidth: '430px',
              margin: '8px auto 0'
            }}>
              <QuickTransactionCard />
            </div>
          )}
        </div>

        {/* Página 2 - Widgets */}
        <div className="page widgets-page">
          <div className="widgets-container">
            <h2 className="widgets-title">Widgets</h2>
            
            {/* Widget Calendário */}
            <div 
              className="widget widget-calendar"
              onClick={() => navigate('/calendario')}
              style={{ cursor: 'pointer' }}
            >
              <div className="widget-header">
                <CalendarMonthOutlinedIcon sx={{ fontSize: 24, color: '#000000' }} />
                <span>Próximos Compromissos</span>
              </div>
              <div className="widget-content">
                {loadingCompromissos ? (
                  <p className="widget-placeholder">Carregando...</p>
                ) : compromissosProximos.length === 0 ? (
                  <p className="widget-placeholder">Nenhum compromisso próximo</p>
                ) : (
                  <div className="compromissos-list">
                    {compromissosProximos.map((comp) => (
                      <div key={comp.id} className="compromisso-item">
                        <div className="compromisso-data">
                          {formatarDataCompromisso(comp.data)}
                        </div>
                        <div className="compromisso-titulo">{comp.titulo}</div>
                        {comp.descricao && (
                          <div className="compromisso-descricao">{comp.descricao}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Widget Financeiro */}
            <div 
              className="widget widget-finance"
              onClick={() => navigate('/caixa')}
              style={{ cursor: 'pointer' }}
            >
              <div className="widget-header">
                <ShowChartOutlinedIcon sx={{ fontSize: 24, color: '#000000' }} />
                <span>Resumo Financeiro (Mês)</span>
              </div>
              <div className="widget-content">
                {loadingTransacoes ? (
                  <p className="widget-placeholder">Carregando...</p>
                ) : (
                  <>
                    <div className="widget-stat">
                      <span className="stat-label">Receitas</span>
                      <span className="stat-value positive">{formatarValor(resumoFinanceiro.receitas)}</span>
                    </div>
                    <div className="widget-stat">
                      <span className="stat-label">Despesas</span>
                      <span className="stat-value negative">{formatarValor(resumoFinanceiro.despesas)}</span>
                    </div>
                    <div className="widget-stat">
                      <span className="stat-label">Saldo</span>
                      <span className={`stat-value ${resumoFinanceiro.saldo >= 0 ? 'positive' : 'negative'}`}>
                        {formatarValor(resumoFinanceiro.saldo)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Widget Obras */}
            <div 
              className="widget widget-obras"
              onClick={() => navigate('/obras-hub')}
              style={{ cursor: 'pointer' }}
            >
              <div className="widget-header">
                <ConstructionOutlinedIcon sx={{ fontSize: 24, color: '#000000' }} />
                <span>Obras em Andamento</span>
              </div>
              <div className="widget-content">
                {loadingObras ? (
                  <p className="widget-placeholder">Carregando...</p>
                ) : obrasEmAndamento.length === 0 ? (
                  <p className="widget-placeholder">Nenhuma obra em andamento</p>
                ) : (
                  <div className="obras-list">
                    {obrasEmAndamento.map((obra) => (
                      <div key={obra.id} className="obra-item">
                        <div className="obra-nome">{obra.nome}</div>
                        <div className="obra-cliente">{obra.cliente}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
