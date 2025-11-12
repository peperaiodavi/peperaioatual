import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Wallet, TrendingUp, Clock } from 'lucide-react';
import './DashboardSelector.css';

const DashboardSelector: React.FC = () => {
  const navigate = useNavigate();

  const handleSelection = (type: 'empresarial' | 'pessoal') => {
    if (type === 'empresarial') {
      navigate('/dashboard');
    } else {
      navigate('/financeiro-pessoal');
    }
  };

  return (
    <div className="dashboard-selector-container">
      <div className="dashboard-selector-content">
        <div className="dashboard-selector-header">
          <h1 className="dashboard-selector-title">
            Bem-vindo! 👋
          </h1>
          <p className="dashboard-selector-subtitle">
            Escolha qual área você deseja acessar
          </p>
        </div>

        <div className="dashboard-selector-cards">
          {/* Card Empresarial */}
          <button
            className="dashboard-card empresarial"
            onClick={() => handleSelection('empresarial')}
          >
            <div className="dashboard-card-icon-wrapper empresarial-icon">
              <Building2 size={40} strokeWidth={2} />
            </div>
            
            <h2 className="dashboard-card-title">
              Dashboard Empresarial
            </h2>
            
            <p className="dashboard-card-description">
              Gerencie projetos, caixa de adiantamento, obras e todas as operações da empresa
            </p>

            <div className="dashboard-card-features">
              <div className="feature-item">
                <TrendingUp size={16} />
                <span>Caixa Principal</span>
              </div>
              <div className="feature-item">
                <Building2 size={16} />
                <span>Cards de Obra</span>
              </div>
              <div className="feature-item">
                <Clock size={16} />
                <span>Adiantamentos</span>
              </div>
            </div>

            <div className="dashboard-card-arrow">
              <span>Acessar →</span>
            </div>
          </button>

          {/* Card Pessoal */}
          <button
            className="dashboard-card pessoal"
            onClick={() => handleSelection('pessoal')}
          >
            <div className="dashboard-card-icon-wrapper pessoal-icon">
              <Wallet size={40} strokeWidth={2} />
            </div>
            
            <h2 className="dashboard-card-title">
              Meu Financeiro Pessoal
            </h2>
            
            <p className="dashboard-card-description">
              Controle suas finanças pessoais de forma privada e organizada
            </p>

            <div className="dashboard-card-features">
              <div className="feature-item">
                <Wallet size={16} />
                <span>Receitas & Despesas</span>
              </div>
              <div className="feature-item">
                <TrendingUp size={16} />
                <span>Gráficos & Análises</span>
              </div>
              <div className="feature-item">
                <Clock size={16} />
                <span>Histórico Completo</span>
              </div>
            </div>

            <div className="dashboard-card-arrow">
              <span>Acessar →</span>
            </div>
          </button>
        </div>

        <div className="dashboard-selector-footer">
          <p className="footer-note">
            💡 Você pode alternar entre os dashboards a qualquer momento
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardSelector;
