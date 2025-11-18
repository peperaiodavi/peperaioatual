import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import {
  Home,
  Building2,
  Wallet2,
  FileText,
  Grid3x3,
} from 'lucide-react';
import MoreDrawer from './MoreDrawer';

interface TabItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  paths: string[];
}

interface DockItemProps {
  item: TabItem;
  index: number;
  mouseX: any;
  isActive: boolean;
  onClick: () => void;
  isDark?: boolean;
}

const DockItem = ({ item, index, mouseX, isActive, onClick, isDark = false }: DockItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [48, 80, 48]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 200,
    damping: 15,
  });

  const heightSync = useTransform(distance, [-150, 0, 150], [48, 80, 48]);
  const height = useSpring(heightSync, {
    mass: 0.1,
    stiffness: 200,
    damping: 15,
  });

  const ySync = useTransform(distance, [-150, 0, 150], [0, -20, 0]);
  const y = useSpring(ySync, {
    mass: 0.1,
    stiffness: 200,
    damping: 15,
  });

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none z-50"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(10px)',
              color: 'white',
            }}
          >
            {item.title}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        ref={ref}
        style={{ width, height, y }}
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        className="relative flex items-center justify-center cursor-pointer"
      >
        <motion.div
          className="relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center"
          style={{
            background: isActive 
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(79, 70, 229, 0.95) 50%, rgba(67, 56, 202, 0.95) 100%)'
              : isDark
                ? 'rgba(30, 41, 59, 0.7)'
                : 'rgba(255, 255, 255, 0.85)',
            boxShadow: isActive
              ? '0 10px 40px rgba(99, 102, 241, 0.6), 0 0 0 3px rgba(165, 180, 252, 0.3) inset, 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
              : isDark
                ? '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(148, 163, 184, 0.1) inset'
                : '0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.6) inset',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          whileHover={{
            scale: 1.05,
            boxShadow: isActive
              ? '0 12px 48px rgba(99, 102, 241, 0.7), 0 0 0 3px rgba(165, 180, 252, 0.4) inset, 0 0 0 1px rgba(255, 255, 255, 0.3) inset'
              : isDark
                ? '0 6px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(148, 163, 184, 0.2) inset'
                : '0 6px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? 'white' : isDark ? '#d1d5db' : '#4b5563',
            }}
          >
            <div style={{ width: '55%', height: '55%' }}>
              {item.icon}
            </div>
          </div>
        </motion.div>

        {/* Indicador de ativo */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2"
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(165, 180, 252, 0.95) 0%, rgba(129, 140, 248, 0.95) 100%)',
              boxShadow: '0 0 12px rgba(129, 140, 248, 0.9), 0 0 24px rgba(99, 102, 241, 0.6)',
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default function MacOSDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const mouseX = useMotionValue(Infinity);

  // Detecta tema dark/light
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Observer para mudanças no tema
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  const tabs: TabItem[] = [
    {
      id: 'obras',
      title: 'Obras',
      icon: <Building2 strokeWidth={2.5} />,
      paths: ['/obras-hub', '/obras', '/gestao-obras', '/propostas', '/minhas-obras', '/cards-de-obra'],
    },
    {
      id: 'financeiro',
      title: 'Financeiro',
      icon: <Wallet2 strokeWidth={2.5} />,
      paths: ['/financeiro-hub', '/caixa', '/receber', '/dividas'],
    },
    {
      id: 'dashboard',
      title: 'Início',
      icon: <Home strokeWidth={2.5} />,
      paths: ['/dashboard'],
    },
    {
      id: 'pdf',
      title: 'PDF',
      icon: <FileText strokeWidth={2.5} />,
      paths: ['/automacao-pdf'],
    },
    {
      id: 'mais',
      title: 'Mais',
      icon: <Grid3x3 strokeWidth={2.5} />,
      paths: ['/mais'],
    },
  ];

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
        style={{
          position: 'fixed',
          bottom: window.innerWidth < 640 ? 8 : 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            delay: 0.1,
          }}
        >
          <div
            onMouseMove={(e: React.MouseEvent) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              gap: window.innerWidth < 640 ? 12 : 16,
              padding: window.innerWidth < 640 ? '14px 18px' : '18px 26px',
              borderRadius: 40,
              background: isDark
                ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.7) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(248, 250, 252, 0.7) 100%)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              border: `2px solid ${
                isDark
                  ? 'rgba(99, 102, 241, 0.2)'
                  : 'rgba(99, 102, 241, 0.15)'
              }`,
              boxShadow: isDark
                ? '0 24px 64px rgba(0, 0, 0, 0.7), 0 10px 40px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(165, 180, 252, 0.1) inset'
                : '0 24px 64px rgba(0, 0, 0, 0.12), 0 10px 40px rgba(99, 102, 241, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
            }}
          >
            {tabs.map((tab, index) => (
              <DockItem
                key={tab.id}
                item={tab}
                index={index}
                mouseX={mouseX}
                isActive={activeTab === tab.id}
                onClick={() => handleTabClick(tab)}
                isDark={isDark}
              />
            ))}
          </div>
        </motion.div>
      </div>
      
      <MoreDrawer 
        isOpen={showMoreDrawer}
        onClose={() => setShowMoreDrawer(false)}
      />
    </>
  );
}
