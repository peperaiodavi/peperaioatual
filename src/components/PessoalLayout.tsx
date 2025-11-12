import { ReactNode, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import PessoalNavbar from './PessoalNavbar';

const PessoalLayout = ({ children }: { children?: ReactNode }) => {
  useEffect(() => {
    // Aplicar tema claro ao montar
    document.documentElement.style.colorScheme = 'light';
    document.body.style.background = 'linear-gradient(180deg, #f0f4f8 0%, #e8ecf1 100%)';
    document.body.classList.add('theme-light');
    document.body.classList.remove('theme-dark');
    
    return () => {
      // Restaurar tema escuro ao desmontar
      document.documentElement.style.colorScheme = 'dark';
      document.body.style.background = 'linear-gradient(180deg, #071029 0%, #071017 60%)';
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
    };
  }, []);

  return (
    <div
      className="pessoal-layout theme-light"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        width: '100%',
        background: 'linear-gradient(180deg, #f0f4f8 0%, #e8ecf1 100%)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.6s cubic-bezier(.4,0,.2,1)',
      }}
    >
      <PessoalNavbar />
      <main
        style={{
          flex: 1,
          paddingTop: 'calc(64px + env(safe-area-inset-top))',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          minHeight: 0,
          overflow: 'auto',
          position: 'relative',
          transition: 'background 0.6s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default PessoalLayout;
