import { useState, useRef, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissao } from '../context/PermissaoContext';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { LogOut, Edit2, Camera, Shield, Info } from 'lucide-react';
import GerenciamentoPermissoes from '../components/GerenciamentoPermissoes';
import './MinhaConta.css';
import '../styles/ios-premium.css';

export default function MinhaConta() {
  const { user, logout, updateUser } = useAuth();
  const { isAdmin } = usePermissao();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Generate floating particles
  useEffect(() => {
    const particlesContainer = document.querySelector('.minha-conta-particles');
    if (!particlesContainer) return;

    const particleCount = 25; // Otimizado para performance
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = `minha-conta-particle ${i % 3 === 0 ? 'small' : i % 3 === 1 ? 'medium' : 'large'
        }`;

      // Random position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${15 + Math.random() * 20}s`;
      particle.style.animationDelay = `${Math.random() * 5}s`;

      particlesContainer.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach(p => p.remove());
    };
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso!');
    navigate('/login');
  };

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ nome: formData.nome });
    toast.success('Nome atualizado com sucesso!');
    setIsEditDialogOpen(false);
  };

  const handleUpdateAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ avatar_url: avatarUrl });
    toast.success('Foto atualizada com sucesso!');
    setIsAvatarDialogOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });
      if (error) throw error;
      // Obter URL pública
      const { publicUrl } = supabase.storage.from('avatars').getPublicUrl(fileName).data;
      setAvatarUrl(publicUrl);
      updateUser({ avatar_url: publicUrl });
      toast.success('Foto atualizada com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao fazer upload do avatar');
    }
    setUploadingImage(false);
  };

  if (!user) return <div className="minha-conta-loading">Carregando informações do usuário...</div>;

  return (
    <div className="minha-conta-container">
      {/* Floating Particles Background */}
      <div className="minha-conta-particles"></div>

      {/* Content */}
      <div className="minha-conta-content">
        {/* Header */}
        <div className="minha-conta-header">
          <h1>Minha Conta</h1>
          <p>Gerencie suas informações pessoais</p>
        </div>

        {/* Profile Card */}
        <div className="minha-conta-profile-card">
          <div className="minha-conta-card-header">
            <h2 className="minha-conta-card-title">Informações do Perfil</h2>
          </div>
          <div className="minha-conta-card-content">
            {/* Avatar Section */}
            <div className="minha-conta-avatar-section">
              <div className="minha-conta-avatar-wrapper">
                <div className="minha-conta-avatar">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.nome} />
                  ) : (
                    <div className="minha-conta-avatar-fallback">
                      {user.nome.charAt(0)}
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  className="minha-conta-avatar-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <div className="minha-conta-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                  ) : (
                    <Camera size={20} color="#fff" />
                  )}
                </button>
              </div>
              <p className="minha-conta-avatar-hint">
                Clique no ícone para selecionar uma foto<br />
                (Máximo 5MB)
              </p>
            </div>

            {/* User Info */}
            <div className="minha-conta-info-section">
              {/* Nome */}
              <div className="minha-conta-info-item">
                <div className="minha-conta-info-content">
                  <p className="minha-conta-info-label">Nome</p>
                  <p className="minha-conta-info-value">{user.nome}</p>
                </div>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="minha-conta-edit-btn">
                      <Edit2 size={18} />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="minha-conta-dialog-content">
                    <DialogHeader>
                      <DialogTitle className="minha-conta-dialog-title">Editar Nome</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateName}>
                      <div className="minha-conta-form-field">
                        <Label>Nome de Exibição</Label>
                        <Input
                          value={formData.nome}
                          onChange={(e) => setFormData({ nome: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" className="minha-conta-btn-submit">
                        Salvar Alterações
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Email */}
              <div className="minha-conta-info-item">
                <div className="minha-conta-info-content">
                  <p className="minha-conta-info-label">Email</p>
                  <p className="minha-conta-info-value">{user.email}</p>
                </div>
              </div>

              {/* Permissão */}
              <div className="minha-conta-info-item">
                <div className="minha-conta-info-content">
                  <p className="minha-conta-info-label">Permissão</p>
                  <div className={`minha-conta-badge ${user.permissao === 'admin' || user.permissao === 'visualizador' ? 'proprietario' : 'viewer'}`}>
                    <Shield size={16} />
                    {user.permissao === 'admin' || user.permissao === 'visualizador' ? 'Proprietário' : 'Visualizador'}
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button className="minha-conta-logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              Sair da Conta
            </button>
          </div>
        </div>

        {/* Permission Management (Admin Only) */}
        {isAdmin && (
          <div className="minha-conta-permissions-section">
            <GerenciamentoPermissoes />
          </div>
        )}

        {/* Info Card */}
        <div className="minha-conta-info-card">
          <h3>
            <Info size={20} />
            Sobre as Permissões
          </h3>
          <div className="minha-conta-info-card-content">
            <p>
              <strong>Proprietário:</strong> Acesso completo ao sistema, pode criar, editar e
              excluir dados. Pode gerenciar permissões de outros usuários.
            </p>
            <p>
              <strong>Visualizador:</strong> Pode visualizar dados específicos e criar propostas/compromissos,
              mas não pode fazer alterações críticas no sistema.
            </p>
            <p style={{marginTop: '0.75rem', color: '#60a5fa'}}>
              💡 {isAdmin ? 
                'Você pode gerenciar permissões de usuários acima, definindo exatamente o que cada um pode fazer.' : 
                'Entre em contato com um proprietário para solicitar alterações em suas permissões.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
