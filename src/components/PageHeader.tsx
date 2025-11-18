import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Repeat } from 'lucide-react';
import { ReactNode } from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  title?: string | ReactNode;
  subtitle?: string;
  showBack?: boolean;
  showDashboardSwitch?: boolean;
  transparent?: boolean;
  className?: string;
}

export default function PageHeader({ 
  title, 
  subtitle, 
  showBack = false, 
  showDashboardSwitch = false,
  transparent = false,
  className = ''
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={`page-header ${transparent ? 'transparent' : ''} ${className}`}>
      <div className="page-header-content">
        {/* Botão Voltar */}
        {showBack && (
          <button 
            className="header-btn back-btn"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
        )}
        
        {/* Título e Subtítulo */}
        {(title || subtitle) && (
          <div className="header-title-section">
            {title && <h1 className="header-title">{title}</h1>}
            {subtitle && <p className="header-subtitle">{subtitle}</p>}
          </div>
        )}
        
        {/* Espaçador */}
        <div className="header-spacer" />
        
        {/* Botão Trocar Dashboard */}
        {showDashboardSwitch && (
          <button 
            className="header-btn dashboard-switch-btn"
            onClick={() => navigate('/dashboard-selector')}
            title="Trocar Dashboard"
            aria-label="Trocar Dashboard"
          >
            <Repeat size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </header>
  );
}
