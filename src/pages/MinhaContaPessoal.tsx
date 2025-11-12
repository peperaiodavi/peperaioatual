import React, { useState, useEffect } from 'react';
import { User, Mail, LogOut } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';
import PessoalLayout from '../components/PessoalLayout';
import { useNavigate } from 'react-router-dom';
import './FinanceiroPessoal.css';

interface UserData {
  email?: string;
  name?: string;
  created_at?: string;
}

const MinhaContaPessoal: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDadosUsuario();
  }, []);

  const carregarDadosUsuario = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      setUserData({
        email: user.email,
        name: user.user_metadata?.name || 'Usuário',
        created_at: user.created_at
      });
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Desconectado com sucesso!');
      navigate('/login');
    } catch (error: any) {
      console.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar');
    }
  };

  const formatarData = (data?: string) => {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <PessoalLayout>
      <div className="financeiro-pessoal-container">
        {/* Header */}
        <div className="financeiro-header">
          <div className="financeiro-header-content">
            <div className="financeiro-title-section">
              <div className="financeiro-icon">
                <User size={32} />
              </div>
              <div>
                <h1 className="financeiro-title">Minha Conta Pessoal</h1>
                <p className="financeiro-subtitle">Gerencie seus dados e preferências</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dados do Usuário */}
        <div className="financeiro-resumo">
          <div className="resumo-card saldo">
            <div className="resumo-card-header">
              <span className="resumo-label">Usuário</span>
              <User size={20} />
            </div>
            <div className="resumo-valor">{loading ? '...' : userData.name}</div>
            <div className="resumo-badge positivo">Conta Ativa</div>
          </div>

          <div className="resumo-card info">
            <div className="resumo-card-header">
              <span className="resumo-label">Email</span>
              <Mail size={20} />
            </div>
            <div className="resumo-valor" style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
              {loading ? '...' : userData.email}
            </div>
            <div className="resumo-badge info">Verificado</div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="financeiro-transacoes">
          <div className="info-section">
            <h3 className="info-title">Informações da Conta</h3>
            <div className="info-item">
              <span className="info-label">Data de Criação:</span>
              <span className="info-value">{formatarData(userData.created_at)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className="info-value">Ativo</span>
            </div>
            <div className="info-item">
              <span className="info-label">Tipo de Conta:</span>
              <span className="info-value">Financeiro Pessoal</span>
            </div>
          </div>

          {/* Seção de Segurança */}
          <div className="info-section" style={{ marginTop: '2rem' }}>
            <h3 className="info-title">Segurança e Privacidade</h3>
            <p className="info-description">
              Seus dados financeiros pessoais são armazenados de forma segura e criptografada. 
              Apenas você tem acesso às suas transações e dívidas.
            </p>
            <div className="info-item">
              <span className="info-label">Dados Pessoais:</span>
              <span className="info-value">Protegidos por RLS (Row Level Security)</span>
            </div>
            <div className="info-item">
              <span className="info-label">Privacidade:</span>
              <span className="info-value">Exclusiva para você</span>
            </div>
          </div>

          {/* Seção de Ações */}
          <div className="info-section" style={{ marginTop: '2rem' }}>
            <h3 className="info-title">Ações</h3>
            <button className="btn-logout" onClick={logout}>
              <LogOut size={20} />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      </div>
    </PessoalLayout>
  );
};

export default MinhaContaPessoal;
