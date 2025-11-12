// Tema MUI X - Paleta de cores moderna e dark
export const muiTheme = {
  colors: {
    // Background
    background: {
      primary: '#1e1e2e',      // Fundo principal (azul médio MUI X)
      secondary: '#252837',    // Fundo secundário
      card: '#2a2d3e',         // Fundo dos cards (azul mais claro)
      cardHover: '#2d3142',    // Card no hover
    },
    
    // Texto
    text: {
      primary: '#e0e0e0',      // Texto principal
      secondary: '#94a3b8',    // Texto secundário
      muted: '#64748b',        // Texto menos importante
    },
    
    // Accent Colors
    accent: {
      blue: '#3b82f6',         // Azul principal
      blueLight: '#60a5fa',    // Azul claro
      purple: '#8b5cf6',       // Roxo
      orange: '#f97316',       // Laranja
      yellow: '#fbbf24',       // Amarelo
      green: '#10b981',        // Verde
      red: '#ef4444',          // Vermelho
      pink: '#ec4899',         // Rosa
    },
    
    // Chart Colors
    chart: {
      primary: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#fbbf24', '#10b981'],
      gradient: {
        blue: ['#3b82f6', '#1e40af'],
        purple: ['#8b5cf6', '#5b21b6'],
        orange: ['#f97316', '#c2410c'],
      }
    },
    
    // Border
    border: {
      default: '#3d4259',
      light: '#4a4f66',
    },
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    secondary: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
    danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  },
  
  // Shadows
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
    md: '0 4px 16px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
    glow: {
      blue: '0 0 20px rgba(59, 130, 246, 0.3)',
      purple: '0 0 20px rgba(139, 92, 246, 0.3)',
      orange: '0 0 20px rgba(249, 115, 22, 0.3)',
    }
  },
  
  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  }
};

export type MuiTheme = typeof muiTheme;
