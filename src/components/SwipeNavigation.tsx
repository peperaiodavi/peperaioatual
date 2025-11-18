import { ReactNode, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SwipeNavigationProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enableBackSwipe?: boolean;
}

export default function SwipeNavigation({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  enableBackSwipe = true 
}: SwipeNavigationProps) {
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Threshold para considerar um swipe (em pixels)
  const swipeThreshold = 100;
  
  // Opacidade do overlay de volta
  const backOverlayOpacity = useTransform(
    x,
    [0, 100],
    [0, 0.15]
  );

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Swipe para direita (voltar)
    if (enableBackSwipe && (offset > swipeThreshold || velocity > 500)) {
      if (onSwipeRight) {
        onSwipeRight();
      } else {
        navigate(-1);
      }
    }
    // Swipe para esquerda (avançar)
    else if (offset < -swipeThreshold || velocity < -500) {
      if (onSwipeLeft) {
        onSwipeLeft();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'visible', // Permite conteúdo filho scrollar
      }}
    >
      {/* Overlay indicador de voltar */}
      {enableBackSwipe && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 80,
            background: 'linear-gradient(90deg, rgba(96, 165, 250, 0.2) 0%, transparent 100%)',
            opacity: backOverlayOpacity,
            pointerEvents: 'none',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 16,
          }}
        >
          <motion.div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(96, 165, 250, 0.2)',
              border: '2px solid rgba(96, 165, 250, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#60a5fa',
              fontWeight: 'bold',
            }}
          >
            ‹
          </motion.div>
        </motion.div>
      )}

      {/* Conteúdo com gesto de swipe */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: enableBackSwipe ? 300 : 0 }}
        dragElastic={0.2}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{
          x,
          width: '100%',
          height: '100%',
          touchAction: 'pan-y', // Permite scroll vertical
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
