import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PermissaoProvider } from './context/PermissaoContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import DashboardLauncher from './pages/DashboardLauncher';
import DashboardSelector from './pages/DashboardSelector';
import FinanceiroPessoal from './pages/FinanceiroPessoal';
import DividasPessoais from './pages/DividasPessoais';
import MinhaContaPessoal from './pages/MinhaContaPessoal';
import CardsDeObra from './pages/CardsDeObra';
import MinhasObras from './pages/MinhasObras';
import Funcionarios from './pages/Funcionarios';
import Calendario from './pages/Calendario';
import Dividas from './pages/Dividas';
import Obras from './pages/Obras';
import Caixa from './pages/Caixa';
import Receber from './pages/Receber';
import AutomacaoPdf from './pages/AutomacaoPdf';
import Propostas from './pages/Propostas';
import MinhaConta from './pages/MinhaConta';
import GestaoObras from './pages/GestaoObras';
import ObrasHub from './pages/ObrasHub';
import FinanceiroHub from './pages/FinanceiroHub';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import ReloadPrompt from './ReloadPrompt';

/* Ionic Setup */
import { setupIonicReact } from '@ionic/react';

// Configuração básica do Ionic
setupIonicReact({
  mode: 'ios', // Forçar estilo iOS
  rippleEffect: true,
  animated: true,
});


export default function App() {
  return (
    <AuthProvider>
      <PermissaoProvider>
        <Router>
          <Toaster position="top-right" richColors />
          {/* ADICIONE O PROMPT AQUI */}
          <ReloadPrompt />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* Rotas protegidas */}
            <Route element={<ProtectedRoute />}>
              {/* Rota do Seletor de Dashboard (sem MainLayout) */}
              <Route path="/dashboard-selector" element={<DashboardSelector />} />
              
              {/* Rotas com MainLayout (Bottom Tab Bar) */}
              <Route element={<MainLayout><Outlet /></MainLayout>}>
                {/* Dashboard Principal (novo launcher) */}
                <Route path="/dashboard" element={<DashboardLauncher />} />
                {/* Dashboard antigo ainda acessível */}
                <Route path="/dashboard-legacy" element={<Dashboard />} />
                
                {/* Hubs de Navegação */}
                <Route path="/obras-hub" element={<ObrasHub />} />
                <Route path="/financeiro-hub" element={<FinanceiroHub />} />
                
                {/* Seções de Obras */}
                <Route path="/cards-de-obra" element={<CardsDeObra />} />
                <Route path="/minhas-obras" element={<MinhasObras />} />
                <Route path="/gestao-obras" element={<GestaoObras />} />
                <Route path="/obras" element={<Obras />} />
                <Route path="/propostas" element={<Propostas />} />
                
                {/* Seções Financeiras */}
                <Route path="/caixa" element={<Caixa />} />
                <Route path="/receber" element={<Receber />} />
                <Route path="/dividas" element={<Dividas />} />
                
                {/* Seções do Menu "Mais" */}
                <Route path="/financeiro-pessoal" element={<FinanceiroPessoal />} />
                <Route path="/dividas-pessoais" element={<DividasPessoais />} />
                <Route path="/minha-conta-pessoal" element={<MinhaContaPessoal />} />
                <Route path="/calendario" element={<Calendario />} />
                <Route path="/funcionarios" element={<Funcionarios />} />
                <Route path="/automacao-pdf" element={<AutomacaoPdf />} />
                <Route path="/minha-conta" element={<MinhaConta />} />
                
                {/* Redirect padrão */}
                <Route path="/" element={<Navigate to="/dashboard-selector" replace />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </PermissaoProvider>
    </AuthProvider>
  );
}
