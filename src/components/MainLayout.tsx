
import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import MainNavbar from './MainNavbar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div 
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh', // Dynamic Viewport Height para mobile (fallback para 100vh)
        width: '100%',
        background: 'linear-gradient(180deg, #071029 0%, #071017 60%)',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="webkit-fill-available"
    >
      <MainNavbar />
      <main 
        style={{ 
          flex: 1,
          // Ajusta padding-top para incluir safe area + altura do navbar
          paddingTop: 'calc(64px + env(safe-area-inset-top))',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          minHeight: 0, // Permite que o conteúdo interno role corretamente
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
