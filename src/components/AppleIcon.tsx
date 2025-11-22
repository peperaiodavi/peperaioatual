import React from 'react';

interface AppleIconProps {
  gradient: string;
  icon: React.ReactNode;
  size?: number;
}

export default function AppleIcon({ gradient, icon, size = 60 }: AppleIconProps) {
  return (
    <div 
      className="apple-icon"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${gradient} 0%, ${adjustColor(gradient, -20)} 100%)`,
      }}
    >
      <div className="apple-icon-shine" />
      <div className="apple-icon-content">
        {icon}
      </div>
    </div>
  );
}

// Função para escurecer cor para o gradiente
function adjustColor(color: string, percent: number): string {
  // Remove # se existir
  const hex = color.replace('#', '');
  
  // Converte para RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Ajusta
  const newR = Math.max(0, Math.min(255, r + percent));
  const newG = Math.max(0, Math.min(255, g + percent));
  const newB = Math.max(0, Math.min(255, b + percent));
  
  // Converte de volta para hex
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}
