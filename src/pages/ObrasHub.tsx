import { useNavigate } from 'react-router-dom';
import { Building2, HardHat, FileText, ChevronRight, Sparkles } from 'lucide-react';
import { usePermissao } from '../context/PermissaoContext';
import ParticlesBackground from '../components/ParticlesBackground';
import './ObrasHub.css';

interface HubCard {
  icon: any;
  title: string;
  description: string;
  path: string;
  color: string;
  gradient: string;
}

export default function ObrasHub() {
  const navigate = useNavigate();
  const permissoes = usePermissao();

  // Criar cards dinamicamente baseado nas permissões
  const cards: HubCard[] = [
    permissoes.pode_acessar_obras && {
      icon: Building2,
      title: 'Obras',
      description: 'Gerencie todas as obras cadastradas',
      path: '/obras',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    },
    permissoes.pode_acessar_obras && permissoes.isAdmin && {
      icon: HardHat,
      title: 'Gestão de Obras',
      description: 'Acompanhamento e controle de obras',
      path: '/gestao-obras',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    },
    permissoes.pode_acessar_minhas_obras && !permissoes.isAdmin && {
      icon: HardHat,
      title: 'Minhas Obras',
      description: 'Visualize suas obras',
      path: '/minhas-obras',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    },
    permissoes.pode_acessar_propostas && {
      icon: FileText,
      title: 'Propostas',
      description: 'Crie e gerencie propostas comerciais',
      path: '/propostas',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
  ].filter(Boolean) as HubCard[];

  console.log('🏗️ ObrasHub: Cards visíveis:', cards.length, cards.map(c => c.title));

  const handleCardClick = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="obras-hub">
      {/* Partículas flutuantes ao fundo */}
      <ParticlesBackground 
        particleColor="#60a5fa"
        particleOpacity={0.3}
        particleSize={3}
        particleCount={80}
        speed={0.5}
      />

      {/* Header com gradiente animado */}
      <div className="hub-header">
        <div className="hub-header-content">
          <div className="hub-icon-badge">
            <HardHat size={32} strokeWidth={2.5} />
          </div>
          <h1 className="hub-title">
            Obras
            <Sparkles className="hub-sparkle" size={20} />
          </h1>
          <p className="hub-subtitle">
            Selecione uma seção para continuar
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
