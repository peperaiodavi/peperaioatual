import { useNavigate } from 'react-router-dom';
import { PiggyBank, Wallet, FileBarChart2, CreditCard, ChevronRight, TrendingUp } from 'lucide-react';
import ParticlesBackground from '../components/ParticlesBackground';
import './FinanceiroHub.css';

interface HubCard {
  icon: any;
  title: string;
  description: string;
  path: string;
  color: string;
  gradient: string;
}

export default function FinanceiroHub() {
  const navigate = useNavigate();

  const cards: HubCard[] = [
    {
      icon: Wallet,
      title: 'Caixa',
      description: 'Gerencie entradas e saídas',
      path: '/caixa',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    {
      icon: FileBarChart2,
      title: 'A Receber',
      description: 'Controle de recebíveis',
      path: '/receber',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    },
    {
      icon: CreditCard,
      title: 'Dívidas',
      description: 'Gestão de contas a pagar',
      path: '/dividas',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    },
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="financeiro-hub">
      {/* Partículas flutuantes ao fundo */}
      <ParticlesBackground 
        particleColor="#10b981"
        particleOpacity={0.3}
        particleSize={3}
        particleCount={80}
        speed={0.5}
      />

      {/* Header com gradiente animado */}
      <div className="hub-header">
        <div className="hub-header-content">
          <div className="hub-icon-badge financeiro-badge">
            <PiggyBank size={32} strokeWidth={2.5} />
          </div>
          <h1 className="hub-title">
            Financeiro
            <TrendingUp className="hub-trending" size={20} />
          </h1>
          <p className="hub-subtitle">
            Gestão completa das finanças
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="hub-cards-grid">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <button
              key={index}
              className="hub-card"
              onClick={() => handleCardClick(card.path)}
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Background com gradiente */}
              <div 
                className="hub-card-bg"
                style={{ background: card.gradient }}
              />
              
              {/* Glow effect */}
              <div 
                className="hub-card-glow"
                style={{ 
                  background: `radial-gradient(circle at center, ${card.color}40 0%, transparent 70%)` 
                }}
              />
              
              {/* Conteúdo */}
              <div className="hub-card-content">
                <div className="hub-card-icon">
                  <Icon size={28} strokeWidth={2} />
                </div>
                <div className="hub-card-info">
                  <h3 className="hub-card-title">{card.title}</h3>
                  <p className="hub-card-description">{card.description}</p>
                </div>
              </div>
              
              {/* Chevron */}
              <ChevronRight className="hub-card-chevron" size={20} />
              
              {/* Shimmer effect */}
              <div className="hub-card-shimmer" />
            </button>
          );
        })}
      </div>

      {/* Decorative elements */}
      <div className="hub-decoration hub-decoration-1" />
      <div className="hub-decoration hub-decoration-2" />
      <div className="hub-decoration hub-decoration-3" />
    </div>
  );
}
