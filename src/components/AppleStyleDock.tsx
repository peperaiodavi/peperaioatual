import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  Hammer,
  Wallet,
  FileText,
  MoreHorizontal,
} from 'lucide-react';

import { Dock, DockIcon, DockItem, DockLabel } from './core/dock';
import MoreDrawer from './MoreDrawer';

interface TabItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  paths: string[];
}

export default function AppleStyleDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  const tabs: TabItem[] = [
    {
      id: 'obras',
      title: 'Obras',
      icon: <Hammer className='h-full w-full text-neutral-600 dark:text-neutral-300' />,
      paths: ['/obras-hub', '/obras', '/gestao-obras', '/propostas', '/minhas-obras', '/cards-de-obra'],
    },
    {
      id: 'financeiro',
      title: 'Financeiro',
      icon: <Wallet className='h-full w-full text-neutral-600 dark:text-neutral-300' />,
      paths: ['/financeiro-hub', '/caixa', '/receber', '/dividas'],
    },
    {
      id: 'dashboard',
      title: 'Início',
      icon: <HomeIcon className='h-full w-full text-neutral-600 dark:text-neutral-300' />,
      paths: ['/dashboard'],
    },
    {
      id: 'pdf',
      title: 'PDF',
      icon: <FileText className='h-full w-full text-neutral-600 dark:text-neutral-300' />,
      paths: ['/automacao-pdf'],
    },
    {
      id: 'mais',
      title: 'Mais',
      icon: <MoreHorizontal className='h-full w-full text-neutral-600 dark:text-neutral-300' />,
      paths: ['/mais'],
    },
  ];

  // Detecta qual tab está ativa baseado no path atual
  useEffect(() => {
    const currentPath = location.pathname;
    const activeTabItem = tabs.find(tab => 
      tab.paths.some(path => currentPath.startsWith(path))
    );
    
    if (activeTabItem) {
      setActiveTab(activeTabItem.id);
    } else if (
      ['/funcionarios', '/minha-conta', '/financeiro-pessoal', '/dividas-pessoais', '/minha-conta-pessoal', '/calendario'].includes(currentPath)
    ) {
      setActiveTab('mais');
    }
  }, [location.pathname]);

  const handleTabClick = (tab: TabItem) => {
    if (tab.id === 'mais') {
      setShowMoreDrawer(true);
      setActiveTab('mais');
    } else {
      setShowMoreDrawer(false);
      setActiveTab(tab.id);
      
      const currentPath = location.pathname;
      const isInSubPage = tab.paths.slice(1).some(path => currentPath === path);
      
      let targetPath = tab.paths[0];
      
      if (isInSubPage) {
        targetPath = tab.paths[0];
      } else if (currentPath === tab.paths[0]) {
        return;
      }
      
      navigate(targetPath);
      
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <>
      <div 
        className='fixed bottom-2 left-1/2 max-w-full -translate-x-1/2 z-50'
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <Dock className='items-end pb-3'>
          {tabs.map((item, idx) => (
            <DockItem
              key={idx}
              onClick={() => handleTabClick(item)}
              className='aspect-square rounded-full bg-gray-200 dark:bg-neutral-800'
            >
              <DockLabel>{item.title}</DockLabel>
              <DockIcon>{item.icon}</DockIcon>
            </DockItem>
          ))}
        </Dock>
      </div>
      
      <MoreDrawer 
        isOpen={showMoreDrawer}
        onClose={() => setShowMoreDrawer(false)}
      />
    </>
  );
}
