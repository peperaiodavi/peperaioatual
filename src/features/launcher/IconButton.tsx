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
  app: LauncherApp;
  onOpen: (app: LauncherApp) => void;
};

export default function IconButton({ app, onOpen }: Props) {
  return (
    <motion.button
      layoutId={`app-${app.id}`}
      className="launcher-icon"
      onClick={() => onOpen(app)}
      whileTap={{ scale: 0.96 }}
      style={{
        background: app.gradient || app.color || 'linear-gradient(135deg,#2b5876,#4e4376)',
      }}
    >
      {app.icon ? (
        <ion-icon name={app.icon} style={{ fontSize: 28, color: 'white', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }}></ion-icon>
      ) : (
        <span className="launcher-icon-emoji" aria-hidden>
          {app.emoji || '📦'}
        </span>
      )}
      <span className="launcher-icon-label">{app.label}</span>
    </motion.button>
  );
}
