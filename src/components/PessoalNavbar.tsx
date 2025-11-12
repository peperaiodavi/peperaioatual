import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet, CreditCard, User, ArrowLeft, Repeat, Menu, X } from 'lucide-react';
import './MainNavbar.css';

const pessoalMenuItems = [
  { icon: Wallet, label: 'Caixa Pessoal', href: '/financeiro-pessoal' },
  { icon: CreditCard, label: 'Minhas Dívidas', href: '/dividas-pessoais' },
  { icon: User, label: 'Minha Conta', href: '/minha-conta-pessoal' },
];

export default function PessoalNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="peperaio-navbar pessoal-navbar">
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
        
        <h1 className="navbar-brand">FINANCEIRO PESSOAL</h1>
        
        <button 
          className="btn-trocar-dashboard"
          onClick={() => navigate('/dashboard-selector')}
          title="Trocar Dashboard"
        >
          <Repeat size={20} />
        </button>
      </div>

      {isOpen && <div className="navbar-overlay" onClick={() => setIsOpen(false)} />}
      
      <aside className={`navbar-sidebar pessoal-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Menu Pessoal</h2>
          <button className="sidebar-close" onClick={() => setIsOpen(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {pessoalMenuItems.map((item, index) => {
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
          <p>Financeiro Pessoal</p>
        </div>
      </aside>
    </nav>
  );
}
