import React from 'react';
import { motion } from 'framer-motion';
import type { LauncherApp } from './IconButton';

type Props = {
  apps: LauncherApp[];
  onOpen: (app: LauncherApp) => void;
};

export default function Dock({ apps, onOpen }: Props) {
  return (
    <div className="launcher-dock-wrap">
      <motion.div className="launcher-dock" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        {apps.slice(0, 4).map((app) => (
          <button
            key={app.id}
            className="dock-icon"
            onClick={() => onOpen(app)}
            style={{ background: app.gradient || app.color }}
            title={app.label}
          >
            <span className="dock-emoji">{app.emoji}</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
