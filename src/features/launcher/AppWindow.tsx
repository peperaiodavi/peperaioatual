import { AnimatePresence, motion } from 'framer-motion';
import React, { PropsWithChildren } from 'react';
import type { LauncherApp } from './IconButton';

type Props = PropsWithChildren<{
  app?: LauncherApp | null;
  onClose: () => void;
}>;

export default function AppWindow({ app, onClose, children }: Props) {
  return (
    <AnimatePresence>
      {app && (
        <>
          {/* Backdrop */}
          <motion.div
            className="launcher-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Expanding window using shared layoutId */}
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
                <span className="emoji">{app.emoji}</span>
                <span>{app.label}</span>
              </div>
              <button className="close-btn" onClick={onClose} aria-label="Fechar">✕</button>
            </div>
            <div className="launcher-window-content">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
