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
  const { isAdmin } = usePermissao();

  // Menu para Admin
  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Funcionários', href: '/funcionarios' },
    { icon: FileText, label: 'Propostas', href: '/propostas' },
    { icon: Building2, label: 'Obras', href: '/obras' },
    { icon: HardHat, label: 'Gestão de Obras', href: '/gestao-obras' },
    { icon: Wallet, label: 'Caixa', href: '/caixa' },
    { icon: FileBarChart2, label: 'A Receber', href: '/receber' },
    { icon: CreditCard, label: 'Dívidas', href: '/dividas' },
    { icon: FileCog, label: 'Automação PDF', href: '/automacao-pdf' },
    { icon: User, label: 'Minha Conta', href: '/minha-conta' },
  ];

  // Menu para Visualizador
  const visualizadorMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: HardHat, label: 'Minhas Obras', href: '/minhas-obras' },
  { icon: Wallet, label: 'Caixa', href: '/caixa' },
  { icon: FileCog, label: 'Automação PDF', href: '/automacao-pdf' },
  { icon: FileText, label: 'Propostas', href: '/propostas' },
  { icon: User, label: 'Minha Conta', href: '/minha-conta' },
  ];

  const menuItems = isAdmin ? adminMenuItems : visualizadorMenuItems;

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
