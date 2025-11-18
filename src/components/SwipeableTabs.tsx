import { useState, useEffect, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

interface SwipeableTabsProps {
  tabs: {
    id: string;
    path: string;
    component: ReactNode;
  }[];
}

export default function SwipeableTabs({ tabs }: SwipeableTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);

  // Sincroniza o índice atual com a rota
  useEffect(() => {
    const index = tabs.findIndex(tab => 
      location.pathname.startsWith(tab.path)
    );
    if (index !== -1 && index !== currentIndex) {
      setCurrentIndex(index);
      animate(x, -index * window.innerWidth, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    }
  }, [location.pathname, tabs]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const swipeThreshold = window.innerWidth * 0.2; // 20% da largura

    let newIndex = currentIndex;

    // Determina a direção do swipe
    if (offset < -swipeThreshold || velocity < -500) {
      // Swipe para esquerda (próxima tab)
      newIndex = Math.min(currentIndex + 1, tabs.length - 1);
    } else if (offset > swipeThreshold || velocity > 500) {
      // Swipe para direita (tab anterior)
      newIndex = Math.max(currentIndex - 1, 0);
    }

    // Atualiza se mudou
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      navigate(tabs[newIndex].path);
    }

    // Anima para a posição correta
    animate(x, -newIndex * window.innerWidth, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    });
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <motion.div
        drag="x"
        dragConstraints={{
          left: -(tabs.length - 1) * window.innerWidth,
          right: 0,
        }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{
          x,
          display: 'flex',
          width: `${tabs.length * 100}%`,
          height: '100%',
          touchAction: 'pan-y',
        }}
      >
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            style={{
              width: `${100 / tabs.length}%`,
              height: '100%',
              flexShrink: 0,
            }}
          >
            {tab.component}
          </div>
        ))}
      </motion.div>

      {/* Indicadores de página (dots) */}
      <div
        style={{
          position: 'absolute',
          bottom: 100, // Acima do bottom tab bar
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
          padding: '8px 16px',
          background: 'rgba(7, 16, 41, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: 20,
          pointerEvents: 'none',
        }}
      >
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            style={{
              width: index === currentIndex ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background:
                index === currentIndex
                  ? '#60a5fa'
                  : 'rgba(230, 238, 248, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
