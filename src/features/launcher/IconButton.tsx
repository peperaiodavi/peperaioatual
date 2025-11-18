import { motion } from 'framer-motion';
import React from 'react';

export type LauncherApp = {
  id: string;
  label: string;
  emoji?: string;
  icon?: string; // Ionicon name, e.g., 'cash-outline'
  color?: string;
  gradient?: string;
  route?: string;
};

type Props = {
  app: LauncherApp & { glyph?: React.ReactNode };
  onOpen: (app: LauncherApp) => void;
};

export default function IconButton({ app, onOpen }: Props) {
  return (
    <div className="launcher-item">
      <motion.button
        aria-label={app.label}
        layoutId={`app-${app.id}`}
        className="launcher-icon"
        onClick={() => onOpen(app)}
        whileTap={{ scale: 0.96 }}
        style={{
          background: app.gradient || app.color || 'linear-gradient(135deg,#2b5876,#4e4376)',
        }}
      >
        <div className="launcher-icon-inner">
          {app.glyph ? (
            app.glyph
          ) : app.icon ? (
            <ion-icon name={app.icon} style={{ fontSize: 28, color: 'white' }}></ion-icon>
          ) : (
            <span className="launcher-icon-emoji" aria-hidden>
              {app.emoji || '📦'}
            </span>
          )}
        </div>
      </motion.button>
      <div className="launcher-label">{app.label}</div>
    </div>
  );
}
