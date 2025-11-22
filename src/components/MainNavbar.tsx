import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MainNavbar.css';
import { Menu, X, LayoutDashboard, Users, FileText, Building2, Wallet, FileBarChart2, CreditCard, FileCog, User, Repeat, HardHat } from 'lucide-react';
import { usePermissao } from '../context/PermissaoContext';

export default function MainNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const permissoes = usePermissao();

  // Debug: Log das permissões quando carregadas
  useEffect(() => {
    if (!permissoes.loading) {
      console.log('🎨 MainNavbar: Permissões carregadas:', {
        pode_acessar_dashboard: permissoes.pode_acessar_dashboard,
        pode_acessar_obras: permissoes.pode_acessar_obras,
        pode_acessar_caixa: permissoes.pode_acessar_caixa,
        pode_acessar_funcionarios: permissoes.pode_acessar_funcionarios,
        pode_acessar_propostas: permissoes.pode_acessar_propostas,
        isAdmin: permissoes.isAdmin
      });
    }
  }, [permissoes.loading]);

  // Criar menu dinamicamente baseado nas permissões
  const menuItems = [
    permissoes.pode_acessar_dashboard && { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    permissoes.pode_acessar_funcionarios && { icon: Users, label: 'Funcionários', href: '/funcionarios' },
    permissoes.pode_acessar_propostas && { icon: FileText, label: 'Propostas', href: '/propostas' },
    permissoes.pode_acessar_obras && { icon: Building2, label: 'Obras', href: '/obras' },
    permissoes.pode_acessar_obras && permissoes.isAdmin && { icon: HardHat, label: 'Gestão de Obras', href: '/gestao-obras' },
    permissoes.pode_acessar_minhas_obras && !permissoes.isAdmin && { icon: HardHat, label: 'Minhas Obras', href: '/minhas-obras' },
    permissoes.pode_acessar_caixa && { icon: Wallet, label: 'Caixa', href: '/caixa' },
    permissoes.isAdmin && { icon: FileBarChart2, label: 'A Receber', href: '/receber' },
    permissoes.isAdmin && { icon: CreditCard, label: 'Dívidas', href: '/dividas' },
    permissoes.pode_acessar_propostas && { icon: FileCog, label: 'Automação PDF', href: '/automacao-pdf' },
    { icon: User, label: 'Minha Conta', href: '/minha-conta' },
  ].filter(Boolean) as { icon: any; label: string; href: string }[];

  console.log('🎨 MainNavbar: Total de itens no menu:', menuItems.length, menuItems.map(i => i.label));

  return (
    <nav className="peperaio-navbar">
      <div className="navbar-container">
        <button 
          className={`navbar-toggle ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)} 
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          <span className="hamburger-line line1"></span>
          <span className="hamburger-line line2"></span>
          <span className="hamburger-line line3"></span>
        </button>
        
        <h1 className="navbar-brand">PEPERAIO</h1>
        
        <button 
          className="btn-trocar-dashboard"
          onClick={() => navigate('/dashboard-selector')}
          title="Trocar Dashboard"
        >
          <Repeat size={20} />
        </button>
      </div>

      {isOpen && <div className="navbar-overlay" onClick={() => setIsOpen(false)} />}
      
      <aside className={`navbar-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Menu</h2>
          <button className="sidebar-close" onClick={() => setIsOpen(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const isActive = currentPath === item.href;
            return (
              <button 
                key={index}
                onClick={() => {
                  navigate(item.href);
                  setIsOpen(false);
                }}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} strokeWidth={2} />
                <span>{item.label}</span>
                {isActive && <span className="active-particle"></span>}
              </button>
            );
          })}
        </nav>
        
        <div className="sidebar-footer">
          <p>Comunicação Visual</p>
        </div>
      </aside>
    </nav>
  );
}
