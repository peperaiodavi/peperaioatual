
import { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import MacOSDock from './MacOSDock';
import SwipeNavigation from './SwipeNavigation';
import { useCompromissosNotification } from '../hooks/useCompromissosNotification';

interface MainLayoutProps {
  children: ReactNode;
}

// Define a profundidade das rotas para animações
const getRouteDepth = (pathname: string): number => {
  const depths: { [key: string]: number } = {
    '/dashboard': 0,
    '/obras-hub': 0,
    '/financeiro-hub': 0,
    '/obras': 1,
    '/gestao-obras': 1,
    '/propostas': 1,
    '/minhas-obras': 1,
    '/caixa': 1,
    '/receber': 1,
    '/dividas': 1,
    '/funcionarios': 1,
    '/automacao-pdf': 1,
    '/minha-conta': 1,
  };
  return depths[pathname] || 0;
};

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const depth = getRouteDepth(location.pathname);
  const { NotificationDialog } = useCompromissosNotification();

  // Variantes de animação baseadas na profundidade
  const pageVariants = {
    initial: (depth: number) => ({
      x: depth > 0 ? '100%' : 0,
      opacity: depth > 0 ? 0 : 1,
    }),
    animate: {
      x: 0,
      opacity: 1,
    },
    exit: (depth: number) => ({
      x: depth > 0 ? '100%' : '-30%',
      opacity: 0,
    }),
  };

  const pageTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  };

  return (
    <div 
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        maxWidth: '100%',
        background: 'linear-gradient(180deg, #071029 0%, #071017 60%)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      }}
      className="webkit-fill-available"
    >
      <main 
        style={{ 
          flex: 1,
          paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))', // Ajustado para o dock
          position: 'relative',
          overflow: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          height: '100%',
          scrollBehavior: 'smooth',
        }}
      >
        <AnimatePresence mode="wait" initial={false} custom={depth}>
          <motion.div
            key={location.pathname}
            custom={depth}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            style={{
              width: '100%',
              minHeight: '100%',
              overflow: 'visible',
            }}
          >
            <SwipeNavigation enableBackSwipe={depth > 0}>
              <Outlet />
            </SwipeNavigation>
          </motion.div>
        </AnimatePresence>
      </main>
      <MacOSDock />
      <NotificationDialog />
    </div>
  );
};

export default MainLayout;
