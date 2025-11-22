import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissao } from '../context/PermissaoContext';

export default function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const permissao = usePermissao();
  const location = useLocation();

  if (authLoading || permissao.loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #141414 100%)',
        color: '#ffffff',
        fontSize: '1.2rem'
      }}>
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Mapeamento de rotas para permissões
  const routePermissions: { [key: string]: boolean } = {
    '/dashboard': permissao.pode_acessar_dashboard,
    '/dashboard-legacy': permissao.pode_acessar_dashboard,
    '/dashboard-selector': true, // Sempre permitido
    '/obras-hub': permissao.pode_acessar_obras,
    '/financeiro-hub': permissao.pode_acessar_caixa,
    '/cards-de-obra': permissao.pode_acessar_obras,
    '/minhas-obras': permissao.pode_acessar_obras,
    '/gestao-obras': permissao.pode_acessar_obras,
    '/obras': permissao.pode_acessar_obras,
    '/propostas': permissao.pode_acessar_propostas,
    '/caixa': permissao.pode_acessar_caixa,
    '/receber': permissao.pode_acessar_caixa,
    '/dividas': permissao.pode_acessar_caixa,
    '/financeiro-pessoal': permissao.pode_acessar_caixa,
    '/dividas-pessoais': permissao.pode_acessar_caixa,
    '/calendario': permissao.pode_acessar_compromissos,
    '/funcionarios': permissao.pode_acessar_funcionarios,
    '/automacao-pdf': permissao.pode_acessar_automacao_pdf,
    '/minha-conta': permissao.pode_acessar_minha_conta,
    '/minha-conta-pessoal': permissao.pode_acessar_minha_conta,
  };

  // Verificar se usuário tem permissão para acessar a rota atual
  const currentPath = location.pathname;
  const hasPermission = routePermissions[currentPath];

  // Se a rota não está no mapeamento ou se tem permissão, permite acesso
  if (hasPermission === undefined || hasPermission === true) {
    return <Outlet />;
  }

  // Se não tem permissão, redireciona para dashboard
  return <Navigate to="/dashboard" replace />;
}

