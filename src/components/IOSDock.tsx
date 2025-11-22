import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePermissao } from '../context/PermissaoContext';
import AppleIcon from './AppleIcon';
import './AppleIcon.css';
import './IOSDock.css';

// Material UI Icons - Outlined
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

type DockApp = {
  id: string;
  label: string;
  gradient: string;
  icon: React.ReactNode;
  route: string;
};

export default function IOSDock() {
  const navigate = useNavigate();
  const permissoes = usePermissao();

  // Debug: Log das permissões
  React.useEffect(() => {
    if (!permissoes.loading) {
      console.log('🎯 IOSDock: Permissões carregadas:', {
        pode_acessar_dashboard: permissoes.pode_acessar_dashboard,
        pode_acessar_obras: permissoes.pode_acessar_obras,
        pode_acessar_caixa: permissoes.pode_acessar_caixa,
      });
    }
  }, [permissoes.loading]);

  // Criar apps do dock dinamicamente baseado nas permissões
  const dockApps: DockApp[] = [
    permissoes.pode_acessar_dashboard && {
      id: 'home',
      label: 'Início',
      gradient: '#007AFF',
      icon: <HomeOutlinedIcon sx={{ fontSize: 28 }} />,
      route: '/dashboard'
    },
    permissoes.pode_acessar_obras && {
      id: 'obras-dock',
      label: 'Obras',
      gradient: '#FF9500',
      icon: <ConstructionOutlinedIcon sx={{ fontSize: 28 }} />,
      route: '/obras-hub'
    },
    permissoes.pode_acessar_caixa && {
      id: 'financeiro-dock',
      label: 'Financeiro',
      gradient: '#34C759',
      icon: <ShowChartOutlinedIcon sx={{ fontSize: 28 }} />,
      route: '/financeiro-hub'
    },
    permissoes.pode_acessar_propostas && {
      id: 'pdf-dock',
      label: 'PDF',
      gradient: '#FF3B30',
      icon: <DescriptionOutlinedIcon sx={{ fontSize: 28 }} />,
      route: '/automacao-pdf'
    },
    {
      id: 'config',
      label: 'Configurações',
      gradient: '#8E8E93',
      icon: <SettingsOutlinedIcon sx={{ fontSize: 28 }} />,
      route: '/minha-conta'
    },
  ].filter(Boolean) as DockApp[];

  console.log('🎯 IOSDock: Total de apps no dock:', dockApps.length, dockApps.map(a => a.label));

  return (
    <div className="ios-dock-wrapper">
      <motion.div 
        className="ios-dock"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          damping: 25,
          delay: 0.3
        }}
      >
        {dockApps.map((app, index) => (
          <motion.div 
            key={app.id}
            className="ios-app-item" 
            onClick={() => navigate(app.route)}
            whileHover={{ 
              scale: 1.2, 
              y: -12,
              transition: { 
                duration: 0.3,
                type: 'spring',
                stiffness: 400,
                damping: 15
              }
            }}
            whileTap={{ 
              scale: 0.85,
              transition: { duration: 0.1 }
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: 0.4 + index * 0.05,
              type: 'spring',
              stiffness: 400,
              damping: 20
            }}
          >
            <AppleIcon 
              gradient={app.gradient}
              icon={app.icon}
              size={56}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
