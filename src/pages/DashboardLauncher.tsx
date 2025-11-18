import React, { useMemo, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import IconButton, { LauncherApp } from '../features/launcher/IconButton';
import AppWindow from '../features/launcher/AppWindow';
// Dock removido a pedido: usaremos apenas o grid de apps
import '../features/launcher/launcher.css';
// Lazy load dos componentes de conteúdo
const Caixa = lazy(() => import('./Caixa'));
const Calendario = lazy(() => import('./Calendario'));
const Propostas = lazy(() => import('./Propostas'));
const ObrasHub = lazy(() => import('./ObrasHub'));
const FinanceiroHub = lazy(() => import('./FinanceiroHub'));
const CardsDeObra = lazy(() => import('./CardsDeObra'));
const MinhasObras = lazy(() => import('./MinhasObras'));
const Receber = lazy(() => import('./Receber'));
const Dividas = lazy(() => import('./Dividas'));
const Funcionarios = lazy(() => import('./Funcionarios'));
const MinhaConta = lazy(() => import('./MinhaConta'));
// MUI icons (desenhos das abas) - escolhidos para cada app
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DescriptionIcon from '@mui/icons-material/Description';
import ConstructionIcon from '@mui/icons-material/Construction';
import AppsIcon from '@mui/icons-material/Apps';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PersonIcon from '@mui/icons-material/Person';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import ExploreIcon from '@mui/icons-material/Explore';

export default function DashboardLauncher() {
  const navigate = useNavigate();
  const [activeApp, setActiveApp] = useState<LauncherApp | null>(null);

  const apps = useMemo<any[]>(() => [
    { id: 'lancamentos', label: 'Lançamentos', gradient: 'linear-gradient(135deg,#00C853,#00E676)' , route: '/caixa', glyph: <AttachMoneyIcon htmlColor="#fff" sx={{ fontSize: 40 }} /> },
    { id: 'calendario', label: 'Calendário', gradient: 'linear-gradient(135deg,#3F51B5,#00BCD4)' , route: '/calendario', glyph: <CalendarMonthIcon htmlColor="#fff" sx={{ fontSize: 40 }} /> },
    { id: 'propostas', label: 'Propostas', gradient: 'linear-gradient(135deg,#FF6F00,#FFA000)' , route: '/propostas', glyph: <DescriptionIcon htmlColor="#fff" sx={{ fontSize: 40 }} /> },
    { id: 'obras', label: 'Obras', gradient: 'linear-gradient(135deg,#8E24AA,#D81B60)' , route: '/obras-hub', glyph: <ConstructionIcon htmlColor="#fff" sx={{ fontSize: 40 }} /> },
    { id: 'cards', label: 'Cards de Obra', gradient: 'linear-gradient(135deg,#7CB342,#C0CA33)', route: '/cards-de-obra', glyph: <AppsIcon htmlColor="#fff" sx={{ fontSize: 40 }} /> },
    { id: 'minhas-obras', label: 'Minhas Obras', gradient: 'linear-gradient(135deg,#0097A7,#26C6DA)', route: '/minhas-obras', glyph: <ContentPasteIcon htmlColor="#fff" sx={{ fontSize: 40 }} /> },
    { id: 'receber', label: 'A Receber', gradient: 'linear-gradient(135deg,#00B8D4,#00E5FF)' , route: '/receber', glyph: <DownloadIcon htmlColor="#fff" sx={{ fontSize: 40 }} /> },
    { id: 'dividas', label: 'Dívidas', gradient: 'linear-gradient(135deg,#D32F2F,#FF5252)' , route: '/dividas', glyph: <WarningAmberIcon htmlColor="#fff" sx={{ fontSize: 40 }} /> },
    { id: 'funcionarios', label: 'Funcionários', gradient: 'linear-gradient(135deg,#5E35B1,#7E57C2)' , route: '/funcionarios', glyph: <PeopleOutlineIcon htmlColor="#fff" sx={{ fontSize: 40 }} /> },
    { id: 'conta', label: 'Minha Conta', gradient: 'linear-gradient(135deg,#546E7A,#455A64)' , route: '/minha-conta', glyph: <PersonIcon htmlColor="#fff" sx={{ fontSize: 40 }} /> },
    { id: 'financeiro', label: 'Financeiro', gradient: 'linear-gradient(135deg,#1565C0,#42A5F5)', route: '/financeiro-hub', glyph: <QueryStatsIcon htmlColor="#fff" sx={{ fontSize: 40 }} /> },
    { id: 'obras-hub', label: 'Obras Hub', gradient: 'linear-gradient(135deg,#6A1B9A,#AB47BC)', route: '/obras-hub', glyph: <ExploreIcon htmlColor="#fff" sx={{ fontSize: 40 }} /> },
  ], []);

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

      {/* Janela aberta */}
      <AppWindow app={activeApp} onClose={closeApp}>
        {!activeApp ? null : (
          <Suspense fallback={<div style={{ padding: 40, color: '#fff', textAlign: 'center' }}>Carregando...</div>}>
            {activeApp.id === 'lancamentos' && <Caixa />}
            {activeApp.id === 'calendario' && <Calendario />}
            {activeApp.id === 'propostas' && <Propostas />}
            {activeApp.id === 'obras' && <ObrasHub />}
            {activeApp.id === 'cards' && <CardsDeObra />}
            {activeApp.id === 'minhas-obras' && <MinhasObras />}
            {activeApp.id === 'receber' && <Receber />}
            {activeApp.id === 'dividas' && <Dividas />}
            {activeApp.id === 'funcionarios' && <Funcionarios />}
            {activeApp.id === 'conta' && <MinhaConta />}
            {activeApp.id === 'financeiro' && <FinanceiroHub />}
            {activeApp.id === 'obras-hub' && <ObrasHub />}
          </Suspense>
        )}
      </AppWindow>
    </div>
  );
}
