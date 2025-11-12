import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Building2, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, senha);
      if (success) {
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      } else {
        toast.error('Email ou senha incorretos');
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Elementos de fundo animados */}
      <div className="login-bg-blob login-bg-blob-1"></div>
      <div className="login-bg-blob login-bg-blob-2"></div>
      <div className="login-bg-blob login-bg-blob-3"></div>

      {/* Partículas flutuantes */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="login-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}
        />
      ))}

      <div className="login-card-wrapper">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            {/* Logo com animação */}
            <div className="login-logo-container">
              <div className="login-logo-wrapper">
                <div className="login-logo-glow"></div>
                <div className="login-logo-box">
                  <Building2 className="login-logo-icon" />
                </div>
              </div>
            </div>

            {/* Logo e título */}
            <div className="login-title-container">
              <div className="login-brand-wrapper">
                <h1 className="login-brand-title">PEPERAIO</h1>
                <p className="login-brand-subtitle">Comunicação Visual</p>
                <div className="login-brand-bars">
                  <div className="login-brand-bar login-brand-bar-green"></div>
                  <div className="login-brand-bar login-brand-bar-red"></div>
                </div>
              </div>
              <p className="login-description">
                <Sparkles className="login-sparkle-icon" />
                Faça login para acessar o sistema
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="login-content">
            <form onSubmit={handleLogin} className="login-form">
              {/* Campo Email */}
              <div className="login-field">
                <label htmlFor="email" className="login-label">Email</label>
                <div className="login-input-wrapper">
                  <Mail className="login-input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="login-input"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="login-field">
                <label htmlFor="senha" className="login-label">Senha</label>
                <div className="login-input-wrapper">
                  <Lock className="login-input-icon" />
                  <input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="login-input"
                  />
                </div>
              </div>

              {/* Botão de login */}
              <div className="login-button-wrapper">
                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="login-spinner"></div>
                  ) : (
                    <>
                      <span>Entrar</span>
                      <ArrowRight className="login-button-arrow" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Link de recuperação */}
            <div className="login-forgot">
              <button
                type="button"
                className="login-forgot-link"
                onClick={() => {/* Implementar recuperação de senha */}}
              >
                Esqueceu sua senha?
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p className="login-copyright">
          © 2025 PEPERAIO. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
