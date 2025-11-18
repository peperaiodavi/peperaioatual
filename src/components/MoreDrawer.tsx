// MoreDrawer - Drawer de navegação estilo iOS
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { 
  X,
  Users,
  FileCog,
  User,
  Repeat,
  CreditCard,
  Wallet,
  FileText,
  ChevronRight,
  LogOut,
  Settings,
  Bell,
  HelpCircle,
  Building2,
  FileBarChart2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissao } from '../context/PermissaoContext';
import './MoreDrawer.css';

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  icon: any;
  label: string;
  href?: string;
  action?: () => void;
  badge?: string | number;
  variant?: 'default' | 'danger';
  divider?: boolean;
}

function MoreDrawer({ isOpen, onClose }: MoreDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isAdmin } = usePermissao();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Previne scroll do body quando drawer está aberto
      document.body.style.overflow = 'hidden';
    } else {
      // Delay para animação de saída
      const timer = setTimeout(() => setIsAnimating(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleItemClick = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.href) {
      navigate(item.href);
      onClose();
      // Scroll suave para o topo
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
      onClose();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  // Menu items baseado no tipo de usuário
  const menuItems: MenuItem[] = isAdmin ? [
    // Seção Pessoal
    { icon: Wallet, label: 'Financeiro Pessoal', href: '/financeiro-pessoal' },
    { icon: CreditCard, label: 'Dívidas Pessoais', href: '/dividas-pessoais' },
    { icon: User, label: 'Minha Conta Pessoal', href: '/minha-conta-pessoal', divider: true },
    
    // Seção Sistema
    { icon: Calendar, label: 'Calendário', href: '/calendario' },
    { icon: Users, label: 'Funcionários', href: '/funcionarios' },
    { icon: User, label: 'Minha Conta', href: '/minha-conta', divider: true },
    
    // Seção Configurações
    { 
      icon: Repeat, 
      label: 'Trocar Dashboard', 
      action: () => {
        navigate('/dashboard-selector');
        onClose();
      },
      badge: '🔄'
    },
    { icon: Settings, label: 'Configurações', badge: 'Em breve' },
    { icon: Bell, label: 'Notificações', badge: 3 },
    { icon: HelpCircle, label: 'Ajuda & Suporte', divider: true },
    
    // Logout
    { icon: LogOut, label: 'Sair', action: handleSignOut, variant: 'danger' as const },
  ] : [
    // Menu para Visualizador
    { icon: Wallet, label: 'Financeiro Pessoal', href: '/financeiro-pessoal' },
    { icon: CreditCard, label: 'Dívidas Pessoais', href: '/dividas-pessoais' },
    { icon: User, label: 'Minha Conta Pessoal', href: '/minha-conta-pessoal', divider: true },
    
    { icon: Calendar, label: 'Calendário', href: '/calendario' },
    { icon: User, label: 'Minha Conta', href: '/minha-conta', divider: true },
    
    { 
      icon: Repeat, 
      label: 'Trocar Dashboard', 
      action: () => {
        navigate('/dashboard-selector');
        onClose();
      },
      badge: '🔄'
    },
    { icon: Bell, label: 'Notificações', badge: 3 },
    { icon: HelpCircle, label: 'Ajuda & Suporte', divider: true },
    
    { icon: LogOut, label: 'Sair', action: handleSignOut, variant: 'danger' as const },
  ];

  if (!isOpen && !isAnimating) return null;

  return (
    <div className={`more-drawer-container ${isOpen ? 'open' : ''}`}>
      {/* Overlay */}
      <div 
        className="more-drawer-overlay" 
        onClick={onClose}
        aria-label="Fechar menu"
      />
      
      {/* Drawer */}
      <motion.div 
        className={`more-drawer ${isOpen ? 'open' : ''}`} 
        role="dialog" 
        aria-modal="true"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.8 }}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        initial={{ y: '100%' }}
        animate={{ 
          y: isOpen ? 0 : '100%',
          transition: {
            type: 'spring',
            damping: isDragging ? 40 : 30,
            stiffness: isDragging ? 500 : 400,
            mass: 0.8
          }
        }}
        exit={{ 
          y: '100%',
          transition: {
            type: 'spring',
            damping: 30,
            stiffness: 400,
            mass: 0.8
          }
        }}
      >
        {/* Handle (barra de arrastar) */}
        <div className="drawer-handle">
          <div className="handle-bar" />
        </div>
        
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-header-content">
            <h2 className="drawer-title">Menu</h2>
            <button 
              className="drawer-close-btn"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* User info */}
          {user && (
            <div className="drawer-user-info">
              <div className="user-avatar">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <p className="user-email">{user.email}</p>
                <span className="user-role-badge">
                  {isAdmin ? 'Administrador' : 'Visualizador'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Menu Items */}
        <nav className="drawer-menu" role="navigation">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.href && location.pathname === item.href;
            
            return (
              <div key={index}>
                <button
                  className={`menu-item ${isActive ? 'active' : ''} ${item.variant === 'danger' ? 'danger' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="menu-item-content">
                    <div className="menu-item-icon">
                      <Icon size={22} strokeWidth={2} />
                    </div>
                    <span className="menu-item-label">{item.label}</span>
                  </div>
                  
                  <div className="menu-item-end">
                    {item.badge && (
                      <span className={`menu-item-badge ${typeof item.badge === 'number' ? 'numeric' : ''}`}>
                        {item.badge}
                      </span>
                    )}
                    {item.href && <ChevronRight size={18} className="menu-item-chevron" />}
                  </div>
                </button>
                
                {item.divider && <div className="menu-divider" />}
              </div>
            );
          })}
        </nav>
        
        {/* Footer */}
        <div className="drawer-footer">
          <p className="drawer-footer-text">Peperaio Comunicação Visual</p>
          <p className="drawer-footer-version">v2.0.0</p>
        </div>
      </motion.div>
    </div>
  );
}

export { MoreDrawer };
export default MoreDrawer;
