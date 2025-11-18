import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

// Define as direções de animação baseado nas rotas
const getPageDirection = (pathname: string) => {
  // Mapeamento de rotas para níveis de profundidade
  const routeLevels: { [key: string]: number } = {
    '/dashboard': 0,
    '/obras-hub': 1,
    '/financeiro-hub': 1,
    '/obras': 2,
    '/gestao-obras': 2,
    '/propostas': 2,
    '/minhas-obras': 2,
    '/caixa': 2,
    '/receber': 2,
    '/dividas': 2,
  };

  return routeLevels[pathname] || 0;
};

// Variantes para animação de slide
const pageVariants = {
  // Entra da direita (forward)
  enterFromRight: {
    x: '100%',
    opacity: 0,
  },
  // Entra da esquerda (backward)
  enterFromLeft: {
    x: '-100%',
    opacity: 0,
  },
  // Centro (estado atual)
  center: {
    x: 0,
    opacity: 1,
  },
  // Sai para esquerda (forward)
  exitToLeft: {
    x: '-30%',
    opacity: 0,
  },
  // Sai para direita (backward)
  exitToRight: {
    x: '100%',
    opacity: 0,
  },
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="enterFromRight"
        animate="center"
        exit="exitToLeft"
        variants={pageVariants}
        transition={pageTransition}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
