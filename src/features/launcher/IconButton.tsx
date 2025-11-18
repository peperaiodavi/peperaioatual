import { motion } from 'framer-motion';
import React from 'react';

export type LauncherApp = {
  id: string;
  label: string;
  emoji?: string;
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
      <span className="launcher-icon-emoji" aria-hidden>
        {app.emoji || '📦'}
      </span>
      <span className="launcher-icon-label">{app.label}</span>
    </motion.button>
  );
}
