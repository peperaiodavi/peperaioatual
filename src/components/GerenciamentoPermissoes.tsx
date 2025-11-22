import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';
import { 
  Shield, Users, Eye, Edit2, Trash2, Save, X, Check, 
  Lock, Unlock, ChevronDown, ChevronUp, AlertCircle, Award,
  Briefcase, FileText, Calendar, CreditCard, Building2, Home,
  TrendingUp, Settings, UserCheck, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './GerenciamentoPermissoes.css';

interface Permissoes {
  // Acesso a páginas
  pode_acessar_dashboard: boolean;
  pode_acessar_caixa: boolean;
  pode_acessar_obras: boolean;
  pode_acessar_orcamento: boolean;
  pode_acessar_propostas: boolean;
  pode_acessar_compromissos: boolean;
  pode_acessar_cards_obra: boolean;
  pode_acessar_funcionarios: boolean;
  pode_acessar_minhas_obras: boolean;
  pode_acessar_calendario: boolean;
  
  // Ações globais
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
  pode_visualizar: boolean;
  pode_exportar: boolean;
  pode_gerenciar_permissoes: boolean;
  
  // Caixa
  pode_criar_transacao: boolean;
  pode_editar_transacao: boolean;
  pode_excluir_transacao: boolean;
  pode_visualizar_saldo: boolean;
  pode_gerenciar_categorias: boolean;
  
  // Obras
  pode_criar_obra: boolean;
  pode_editar_obra: boolean;
  pode_excluir_obra: boolean;
  pode_finalizar_obra: boolean;
  pode_gerenciar_gastos_obra: boolean;
  
  // Orçamento
  pode_criar_orcamento: boolean;
  pode_editar_orcamento: boolean;
  pode_aprovar_orcamento: boolean;
  
  // Propostas
  pode_criar_proposta: boolean;
  pode_editar_proposta: boolean;
  pode_excluir_proposta: boolean;
  pode_visualizar_valores_proposta: boolean;
  
  // Funcionários
  pode_criar_funcionario: boolean;
  pode_editar_funcionario: boolean;
  pode_excluir_funcionario: boolean;
  pode_gerenciar_pagamentos: boolean;
  pode_registrar_diarias: boolean;
  
  // Cards de Obra
  pode_criar_card_obra: boolean;
  pode_editar_card_obra: boolean;
  pode_transferir_verba: boolean;
  pode_finalizar_card: boolean;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  avatar_url?: string;
  permissoes?: Permissoes;
}

interface PresetPermissoes {
  nome: string;
  descricao: string;
  icon: any;
  cor: string;
}

const PRESETS: Record<string, PresetPermissoes> = {
  proprietario: {
    nome: 'Proprietário',
    descricao: 'Acesso total ao sistema',
    icon: Award,
    cor: 'gold'
  },
  visualizador: {
    nome: 'Visualizador',
    descricao: 'Acessa tudo, mas só visualiza (exceto Propostas)',
    icon: Eye,
    cor: 'blue'
  }
};

const CATEGORIAS_PERMISSOES = [
  {
    titulo: 'Acesso a Páginas',
    icon: Home,
    permissoes: [
      { key: 'pode_acessar_dashboard', label: 'Dashboard', icon: TrendingUp },
      { key: 'pode_acessar_caixa', label: 'Caixa', icon: CreditCard },
      { key: 'pode_acessar_obras', label: 'Obras', icon: Building2 },
      { key: 'pode_acessar_orcamento', label: 'Orçamento', icon: FileText },
      { key: 'pode_acessar_propostas', label: 'Propostas', icon: FileText },
      { key: 'pode_acessar_compromissos', label: 'Compromissos', icon: Calendar },
      { key: 'pode_acessar_cards_obra', label: 'Cards de Obra', icon: Briefcase },
      { key: 'pode_acessar_funcionarios', label: 'Funcionários', icon: Users },
      { key: 'pode_acessar_minhas_obras', label: 'Minhas Obras', icon: Building2 },
      { key: 'pode_acessar_calendario', label: 'Calendário', icon: Calendar },
    ]
  },
  {
    titulo: 'Ações Globais',
    icon: Settings,
    permissoes: [
      { key: 'pode_criar', label: 'Criar', icon: Edit2 },
      { key: 'pode_editar', label: 'Editar', icon: Edit2 },
      { key: 'pode_excluir', label: 'Excluir', icon: Trash2 },
      { key: 'pode_visualizar', label: 'Visualizar', icon: Eye },
      { key: 'pode_exportar', label: 'Exportar', icon: FileText },
      { key: 'pode_gerenciar_permissoes', label: 'Gerenciar Permissões', icon: Shield },
    ]
  },
  {
    titulo: 'Caixa',
    icon: CreditCard,
    permissoes: [
      { key: 'pode_criar_transacao', label: 'Criar Transação', icon: DollarSign },
      { key: 'pode_editar_transacao', label: 'Editar Transação', icon: Edit2 },
      { key: 'pode_excluir_transacao', label: 'Excluir Transação', icon: Trash2 },
      { key: 'pode_visualizar_saldo', label: 'Visualizar Saldo', icon: Eye },
      { key: 'pode_gerenciar_categorias', label: 'Gerenciar Categorias', icon: Settings },
    ]
  },
  {
    titulo: 'Obras',
    icon: Building2,
    permissoes: [
      { key: 'pode_criar_obra', label: 'Criar Obra', icon: Edit2 },
      { key: 'pode_editar_obra', label: 'Editar Obra', icon: Edit2 },
      { key: 'pode_excluir_obra', label: 'Excluir Obra', icon: Trash2 },
      { key: 'pode_finalizar_obra', label: 'Finalizar Obra', icon: Check },
      { key: 'pode_gerenciar_gastos_obra', label: 'Gerenciar Gastos', icon: DollarSign },
    ]
  },
  {
    titulo: 'Funcionários',
    icon: Users,
    permissoes: [
      { key: 'pode_criar_funcionario', label: 'Criar Funcionário', icon: Edit2 },
      { key: 'pode_editar_funcionario', label: 'Editar Funcionário', icon: Edit2 },
      { key: 'pode_excluir_funcionario', label: 'Excluir Funcionário', icon: Trash2 },
      { key: 'pode_gerenciar_pagamentos', label: 'Gerenciar Pagamentos', icon: DollarSign },
      { key: 'pode_registrar_diarias', label: 'Registrar Diárias', icon: Calendar },
    ]
  }
];

export default function GerenciamentoPermissoes() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [permissoesTemp, setPermissoesTemp] = useState<Permissoes | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários da tabela usuarios
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nome, email, avatar_url')
        .order('nome', { ascending: true });

      if (usuariosError) throw usuariosError;

      // Buscar permissões de cada usuário
      const usuariosComPermissoes = await Promise.all(
        (usuariosData || []).map(async (usuario) => {
          const { data: permissoesData } = await supabase
            .from('permissoes_usuario')
            .select('*')
            .eq('usuario_id', usuario.id)
            .single();

          return {
            ...usuario,
            permissoes: permissoesData || {}
          };
        })
      );

      setUsuarios(usuariosComPermissoes);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicao = (usuario: Usuario) => {
    setEditandoId(usuario.id);
    setPermissoesTemp(usuario.permissoes || {} as Permissoes);
    setExpandedUserId(usuario.id);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setPermissoesTemp(null);
  };

  const atualizarPermissao = (key: keyof Permissoes, valor: boolean) => {
    if (permissoesTemp) {
      setPermissoesTemp({ ...permissoesTemp, [key]: valor });
    }
  };

  const salvarPermissoes = async (usuarioId: string) => {
    if (!permissoesTemp) return;

    try {
      console.log('💾 Salvando permissões para usuário:', usuarioId);
      console.log('📦 Permissões a serem salvas:', permissoesTemp);
      
      const { data, error } = await supabase
        .from('permissoes_usuario')
        .update(permissoesTemp)
        .eq('usuario_id', usuarioId)
        .select();

      if (error) {
        console.error('❌ Erro ao salvar:', error);
        throw error;
      }

      console.log('✅ Permissões salvas no banco:', data);
      toast.success('Permissões atualizadas com sucesso!');
      setEditandoId(null);
      setPermissoesTemp(null);
      carregarUsuarios();
    } catch (error: any) {
      console.error('Erro ao salvar permissões:', error);
      toast.error('Erro ao atualizar permissões: ' + error.message);
    }
  };

  const aplicarPreset = async (usuarioId: string, preset: 'proprietario' | 'visualizador') => {
    try {
      const { error } = await supabase.rpc(
        preset === 'proprietario' ? 'aplicar_preset_proprietario' : 'aplicar_preset_visualizador',
        { p_usuario_id: usuarioId }
      );

      if (error) throw error;

      toast.success(`Preset "${PRESETS[preset].nome}" aplicado com sucesso!`);
      carregarUsuarios();
    } catch (error: any) {
      console.error('Erro ao aplicar preset:', error);
      toast.error('Erro ao aplicar preset');
    }
  };

  const toggleExpand = (usuarioId: string) => {
    setExpandedUserId(expandedUserId === usuarioId ? null : usuarioId);
  };

  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategory(expandedCategory === categoryTitle ? null : categoryTitle);
  };

  const contarPermissoesAtivas = (permissoes?: Permissoes) => {
    if (!permissoes) return 0;
    return Object.values(permissoes).filter(v => v === true).length;
  };

  if (loading) {
    return (
      <div className="ios-permissions-loading">
        <motion.div 
          className="ios-loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Shield size={32} />
        </motion.div>
        <p>Carregando usuários...</p>
      </div>
    );
  };

  return (
    <div className="ios-permissions-container">
      {/* Header */}
      <div className="ios-permissions-header">
        <div className="ios-permissions-header-content">
          <div className="ios-permissions-header-icon">
            <Shield size={28} />
          </div>
          <div>
            <h2>Gerenciamento de Permissões</h2>
            <p>Controle de acesso granular por usuário</p>
          </div>
        </div>
        <div className="ios-permissions-stats">
          <Users size={18} />
          <span>{usuarios.length} {usuarios.length === 1 ? 'usuário' : 'usuários'}</span>
        </div>
      </div>

      {/* Info Card */}
      <motion.div 
        className="ios-permissions-info-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AlertCircle size={20} className="info-icon" />
        <div className="info-content">
          <h3>Sobre Permissões</h3>
          <p>
            Defina exatamente o que cada usuário pode fazer no sistema. 
            Use os presets para aplicar configurações rápidas ou personalize individualmente.
          </p>
        </div>
      </motion.div>

      {/* Lista de Usuários */}
      <div className="ios-permissions-users-list">
        {usuarios.map((usuario, index) => {
          const isExpanded = expandedUserId === usuario.id;
          const isEditing = editandoId === usuario.id;
          const permissoes = isEditing ? permissoesTemp : usuario.permissoes;
          const permissoesAtivas = contarPermissoesAtivas(permissoes);
          const totalPermissoes = Object.keys(permissoes || {}).length;
          const percentualPermissoes = totalPermissoes > 0 
            ? Math.round((permissoesAtivas / totalPermissoes) * 100) 
            : 0;

          return (
            <motion.div
              key={usuario.id}
              className="ios-permission-user-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {/* Cabeçalho do Usuário */}
              <div className="ios-user-card-header">
                <div className="ios-user-info">
                  <div className="ios-user-avatar">
                    {usuario.avatar_url ? (
                      <img src={usuario.avatar_url} alt={usuario.nome} />
                    ) : (
                      <div className="ios-avatar-fallback">
                        {usuario.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="ios-user-details">
                    <h3>{usuario.nome}</h3>
                    <p>{usuario.email}</p>
                    <div className="ios-permissions-badge">
                      <Lock size={12} />
                      <span>{permissoesAtivas} de {totalPermissoes} permissões ativas</span>
                    </div>
                  </div>
                </div>

                <div className="ios-user-actions">
                  {!isEditing ? (
                    <>
                      <motion.button
                        className="ios-btn-secondary"
                        onClick={() => toggleExpand(usuario.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        {isExpanded ? 'Ocultar' : 'Ver'}
                      </motion.button>
                      <motion.button
                        className="ios-btn-primary"
                        onClick={() => iniciarEdicao(usuario)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit2 size={16} />
                        Editar
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <motion.button
                        className="ios-btn-cancel"
                        onClick={cancelarEdicao}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X size={16} />
                        Cancelar
                      </motion.button>
                      <motion.button
                        className="ios-btn-save"
                        onClick={() => salvarPermissoes(usuario.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Save size={16} />
                        Salvar
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="ios-permissions-progress">
                <div className="progress-bar">
                  <motion.div 
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentualPermissoes}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  />
                </div>
                <span className="progress-label">{percentualPermissoes}%</span>
              </div>

              {/* Conteúdo Expandido */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="ios-user-permissions-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Presets Rápidos */}
                    {isEditing && (
                      <div className="ios-presets-section">
                        <h4>Presets Rápidos</h4>
                        <div className="ios-presets-grid">
                          {Object.entries(PRESETS).map(([key, preset]) => {
                            const Icon = preset.icon;
                            return (
                              <motion.button
                                key={key}
                                className={`ios-preset-btn preset-${preset.cor}`}
                                onClick={() => aplicarPreset(usuario.id, key as any)}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Icon size={20} />
                                <div className="preset-info">
                                  <strong>{preset.nome}</strong>
                                  <span>{preset.descricao}</span>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Categorias de Permissões */}
                    <div className="ios-permissions-categories">
                      {CATEGORIAS_PERMISSOES.map((categoria) => {
                        const Icon = categoria.icon;
                        const isCategoryExpanded = expandedCategory === categoria.titulo;

                        return (
                          <div key={categoria.titulo} className="ios-permission-category">
                            <button
                              className="ios-category-header"
                              onClick={() => isEditing && toggleCategory(categoria.titulo)}
                              disabled={!isEditing}
                            >
                              <div className="category-title">
                                <Icon size={18} />
                                <span>{categoria.titulo}</span>
                              </div>
                              {isEditing && (
                                <ChevronDown 
                                  size={18} 
                                  className={isCategoryExpanded ? 'rotated' : ''}
                                />
                              )}
                            </button>

                            <AnimatePresence>
                              {(isCategoryExpanded || !isEditing) && (
                                <motion.div
                                  className="ios-permissions-grid"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {categoria.permissoes.map((perm) => {
                                    const PermIcon = perm.icon;
                                    const isActive = permissoes?.[perm.key as keyof Permissoes] || false;

                                    return (
                                      <motion.div
                                        key={perm.key}
                                        className={`ios-permission-item ${isActive ? 'active' : ''} ${!isEditing ? 'disabled' : ''}`}
                                        onClick={() => isEditing && atualizarPermissao(perm.key as keyof Permissoes, !isActive)}
                                        whileHover={isEditing ? { scale: 1.02 } : {}}
                                        whileTap={isEditing ? { scale: 0.98 } : {}}
                                      >
                                        <div className="permission-icon">
                                          {isActive ? <Check size={16} /> : <PermIcon size={16} />}
                                        </div>
                                        <span className="permission-label">{perm.label}</span>
                                        <div className={`permission-toggle ${isActive ? 'active' : ''}`}>
                                          <div className="toggle-circle" />
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {usuarios.length === 0 && (
        <motion.div 
          className="ios-permissions-empty"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Users size={48} />
          <h3>Nenhum usuário encontrado</h3>
          <p>Adicione usuários ao sistema para gerenciar suas permissões</p>
        </motion.div>
      )}
    </div>
  );
}
