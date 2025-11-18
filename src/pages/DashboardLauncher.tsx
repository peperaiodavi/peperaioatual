import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import IconButton, { LauncherApp } from '../features/launcher/IconButton';
import AppWindow from '../features/launcher/AppWindow';
import Dock from '../features/launcher/Dock';
import '../features/launcher/launcher.css';

export default function DashboardLauncher() {
  const navigate = useNavigate();
  const [activeApp, setActiveApp] = useState<LauncherApp | null>(null);

  const apps = useMemo<LauncherApp[]>(() => [
    { id: 'lancamentos', label: 'Lançamentos', emoji: '💵', gradient: 'linear-gradient(135deg,#00C853,#00E676)' , route: '/caixa' },
    { id: 'calendario', label: 'Calendário', emoji: '📆', gradient: 'linear-gradient(135deg,#3F51B5,#00BCD4)' , route: '/calendario' },
    { id: 'propostas', label: 'Propostas', emoji: '📄', gradient: 'linear-gradient(135deg,#FF6F00,#FFA000)' , route: '/propostas' },
    { id: 'obras', label: 'Obras', emoji: '🏗️', gradient: 'linear-gradient(135deg,#8E24AA,#D81B60)' , route: '/obras-hub' },
    { id: 'cards', label: 'Cards de Obra', emoji: '🧩', gradient: 'linear-gradient(135deg,#7CB342,#C0CA33)', route: '/cards-de-obra' },
    { id: 'minhas-obras', label: 'Minhas Obras', emoji: '📋', gradient: 'linear-gradient(135deg,#0097A7,#26C6DA)', route: '/minhas-obras' },
    { id: 'receber', label: 'A Receber', emoji: '📥', gradient: 'linear-gradient(135deg,#00B8D4,#00E5FF)' , route: '/receber' },
    { id: 'dividas', label: 'Dívidas', emoji: '⚠️', gradient: 'linear-gradient(135deg,#D32F2F,#FF5252)' , route: '/dividas' },
    { id: 'funcionarios', label: 'Funcionários', emoji: '👥', gradient: 'linear-gradient(135deg,#5E35B1,#7E57C2)' , route: '/funcionarios' },
    { id: 'conta', label: 'Minha Conta', emoji: '👤', gradient: 'linear-gradient(135deg,#546E7A,#455A64)' , route: '/minha-conta' },
    { id: 'financeiro', label: 'Financeiro', emoji: '📊', gradient: 'linear-gradient(135deg,#1565C0,#42A5F5)', route: '/financeiro-hub' },
    { id: 'obras-hub', label: 'Obras Hub', emoji: '🧭', gradient: 'linear-gradient(135deg,#6A1B9A,#AB47BC)', route: '/obras-hub' },
  ], []);

  const dockApps = useMemo(() => [
    apps.find(a => a.id === 'lancamentos')!,
    apps.find(a => a.id === 'calendario')!,
    apps.find(a => a.id === 'propostas')!,
    apps.find(a => a.id === 'financeiro')!,
  ].filter(Boolean), [apps]);

  const openApp = (app: LauncherApp) => setActiveApp(app);
  const closeApp = () => setActiveApp(null);

  return (
    <div className="launcher-wallpaper">
      {/* Grid de ícones */}
      <div className="launcher-grid">
        {apps.map((app) => (
          <IconButton key={app.id} app={app} onOpen={openApp} />
        ))}
      </div>

      {/* Dock */}
      <Dock apps={dockApps} onOpen={openApp} />

      {/* Janela aberta */}
      <AppWindow app={activeApp} onClose={closeApp}>
        {!activeApp ? null : (
          <div className="placeholder">
            <p>
              Esta é a janela de <strong>{activeApp.label}</strong>.
              Use os gestos de arrastar para fechar (puxe para cima/baixo com força).
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {activeApp.route && (
                <button
                  onClick={() => { navigate(activeApp.route!); }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >Ir para {activeApp.label}</button>
              )}
              <button
                onClick={closeApp}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >Fechar</button>
            </div>
            <div style={{ opacity: 0.85 }}>
              <p>
                Dica: podemos injetar aqui o conteúdo existente da rota
                correspondente para uma experiência completa em janela.
              </p>
            </div>
          </div>
        )}
      </AppWindow>
    </div>
  );
}
