import { AnimatePresence, motion } from 'framer-motion';
import React, { PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
import type { LauncherApp } from './IconButton';

type Props = PropsWithChildren<{
  app?: LauncherApp | null;
  onClose: () => void;
}>;

export default function AppWindow({ app, onClose, children }: Props) {
  // Renderiza como portal para evitar problemas de transform/overflow nos ancestrais
  return createPortal(
    <AnimatePresence>
      {app && (
        <>
          {/* Backdrop */}
          <motion.div
            className="launcher-backdrop"
            style={{ zIndex: 999 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Overlay centralizado evita posicionamento incorreto em diferentes devices */}
          <div className="launcher-overlay" style={{ zIndex: 1000 }}>
            <motion.div
              layoutId={`app-${app.id}`}
              className="launcher-window"
              drag="y"
              dragElastic={0.2}
              dragMomentum={true}
              onDragEnd={(e, info) => {
                const threshold = 140; // px
                const velocityThreshold = 1200; // px/s
                if (Math.abs(info.offset.y) > threshold || Math.abs(info.velocity.y) > velocityThreshold) {
                  onClose();
                }
              }}
            >
              <div className="launcher-window-header">
                <div className="grabber" />
                <div className="title">
                  {app.emoji && <span className="emoji">{app.emoji}</span>}
                  <span>{app.label}</span>
                </div>
                <button className="close-btn" onClick={onClose} aria-label="Fechar">✕</button>
              </div>
              <div className="launcher-window-content">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
