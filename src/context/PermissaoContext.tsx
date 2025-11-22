import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabaseClient';

interface PermissoesGranulares {
  // Acesso às páginas (nomes conforme banco de dados)
  pode_acessar_dashboard: boolean;
  pode_acessar_obras: boolean;
  pode_acessar_caixa: boolean;
  pode_acessar_funcionarios: boolean;
  pode_acessar_compromissos: boolean;
  pode_acessar_propostas: boolean;
  pode_acessar_cards_obra: boolean;
  pode_acessar_orcamento: boolean;
  pode_acessar_minhas_obras: boolean;
  pode_acessar_calendario: boolean;
  
  // Ações globais
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
  pode_visualizar: boolean;
  pode_exportar: boolean;
  pode_gerenciar_permissoes: boolean;
  
  // Transações
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

interface PermissaoContextType extends PermissoesGranulares {
  isAdmin: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  canCreateCompromisso: boolean;
  canCreateProposta: boolean;
  canEditProposta: boolean;
  canDeleteProposta: boolean;
  loading: boolean;
}

const PermissaoContext = createContext<PermissaoContextType | undefined>(undefined);

export function PermissaoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [permissoes, setPermissoes] = useState<PermissoesGranulares | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissoes = async () => {
      if (!user?.id) {
        console.log('🔒 PermissaoContext: Usuário não autenticado');
        setPermissoes(null);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 PermissaoContext: Buscando permissões para usuário:', user.id);
        
        const { data, error } = await supabase
          .from('permissoes_usuario')
          .select('*')
          .eq('usuario_id', user.id)
          .single();

        if (error) {
          console.warn('⚠️ PermissaoContext: Erro ao buscar permissões (usando padrão):', error.message);
          // Se não houver permissões definidas, usar permissões padrão baseadas no tipo
          const permissoesPadrao = getPermissoesPadrao(user.permissao);
          console.log('📋 PermissaoContext: Aplicando permissões padrão para', user.permissao, permissoesPadrao);
          setPermissoes(permissoesPadrao);
        } else if (data) {
          console.log('✅ PermissaoContext: Permissões carregadas do banco:', data);
          setPermissoes(data);
        } else {
          console.log('📋 PermissaoContext: Nenhuma permissão encontrada, usando padrão');
          setPermissoes(getPermissoesPadrao(user.permissao));
        }
      } catch (error) {
        console.error('❌ PermissaoContext: Erro ao carregar permissões:', error);
        setPermissoes(getPermissoesPadrao(user.permissao));
      } finally {
        setLoading(false);
      }
    };

    fetchPermissoes();
  }, [user?.id]);

  // Listener de realtime para atualizar permissões quando mudarem
  useEffect(() => {
    if (!user?.id) return;

    console.log('👂 PermissaoContext: Configurando listener de permissões');

    const channel = supabase
      .channel('permissoes-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'permissoes_usuario',
          filter: `usuario_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 PermissaoContext: Permissões atualizadas em tempo real!', payload.new);
          setPermissoes(payload.new as PermissoesGranulares);
        }
      )
      .subscribe();

    return () => {
      console.log('🔇 PermissaoContext: Removendo listener de permissões');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getPermissoesPadrao = (tipo: 'admin' | 'visualizador'): PermissoesGranulares => {
    if (tipo === 'admin') {
      return {
        pode_acessar_dashboard: true,
        pode_acessar_obras: true,
        pode_acessar_caixa: true,
        pode_acessar_funcionarios: true,
        pode_acessar_compromissos: true,
        pode_acessar_propostas: true,
        pode_acessar_cards_obra: true,
        pode_acessar_orcamento: true,
        pode_acessar_minhas_obras: true,
        pode_acessar_calendario: true,
        pode_criar: true,
        pode_editar: true,
        pode_excluir: true,
        pode_visualizar: true,
        pode_exportar: true,
        pode_gerenciar_permissoes: true,
        pode_criar_transacao: true,
        pode_editar_transacao: true,
        pode_excluir_transacao: true,
        pode_visualizar_saldo: true,
        pode_gerenciar_categorias: true,
        pode_criar_obra: true,
        pode_editar_obra: true,
        pode_excluir_obra: true,
        pode_finalizar_obra: true,
        pode_gerenciar_gastos_obra: true,
        pode_criar_orcamento: true,
        pode_editar_orcamento: true,
        pode_aprovar_orcamento: true,
        pode_criar_proposta: true,
        pode_editar_proposta: true,
        pode_excluir_proposta: true,
        pode_visualizar_valores_proposta: true,
        pode_criar_funcionario: true,
        pode_editar_funcionario: true,
        pode_excluir_funcionario: true,
        pode_gerenciar_pagamentos: true,
        pode_registrar_diarias: true,
        pode_criar_card_obra: true,
        pode_editar_card_obra: true,
        pode_transferir_verba: true,
        pode_finalizar_card: true,
      };
    } else {
      // Visualizador: conforme SQL - acesso a todas abas mas só visualizar (exceto Propostas)
      return {
        pode_acessar_dashboard: true,
        pode_acessar_obras: true,
        pode_acessar_caixa: true,
        pode_acessar_funcionarios: true,
        pode_acessar_compromissos: true,
        pode_acessar_propostas: true,
        pode_acessar_cards_obra: true,
        pode_acessar_orcamento: true,
        pode_acessar_minhas_obras: true,
        pode_acessar_calendario: true,
        pode_criar: false,
        pode_editar: false,
        pode_excluir: false,
        pode_visualizar: true,
        pode_exportar: false,
        pode_gerenciar_permissoes: false,
        pode_criar_transacao: false,
        pode_editar_transacao: false,
        pode_excluir_transacao: false,
        pode_visualizar_saldo: true,
        pode_gerenciar_categorias: false,
        pode_criar_obra: false,
        pode_editar_obra: false,
        pode_excluir_obra: false,
        pode_finalizar_obra: false,
        pode_gerenciar_gastos_obra: false,
        pode_criar_orcamento: false,
        pode_editar_orcamento: false,
        pode_aprovar_orcamento: false,
        pode_criar_proposta: true, // PROPOSTAS: acesso completo
        pode_editar_proposta: true,
        pode_excluir_proposta: true,
        pode_visualizar_valores_proposta: true,
        pode_criar_funcionario: false,
        pode_editar_funcionario: false,
        pode_excluir_funcionario: false,
        pode_gerenciar_pagamentos: false,
        pode_registrar_diarias: false,
        pode_criar_card_obra: false,
        pode_editar_card_obra: false,
        pode_transferir_verba: false,
        pode_finalizar_card: false,
      };
    }
  };

  const isAdmin = user?.permissao === 'admin';
  
  // Permissões gerais (retrocompatibilidade)
  const canEdit = permissoes?.pode_editar || isAdmin;
  const canDelete = permissoes?.pode_excluir || isAdmin;
  const canCreate = permissoes?.pode_criar || isAdmin;
  
  // Permissões específicas
  const canCreateCompromisso = permissoes?.pode_criar || isAdmin;
  const canCreateProposta = permissoes?.pode_criar_proposta || isAdmin;
  const canEditProposta = permissoes?.pode_editar_proposta || isAdmin;
  const canDeleteProposta = permissoes?.pode_excluir_proposta || isAdmin;

  const value: PermissaoContextType = {
    ...getPermissoesPadrao('visualizador'), // fallback
    ...(permissoes || {}),
    isAdmin,
    canEdit,
    canDelete,
    canCreate,
    canCreateCompromisso,
    canCreateProposta,
    canEditProposta,
    canDeleteProposta,
    loading,
  };

  // Log das permissões finais (apenas quando carregadas)
  useEffect(() => {
    if (!loading && user?.id) {
      console.log('🎯 PermissaoContext: Permissões finais do contexto:', {
        usuario: user.email,
        isAdmin,
        pode_acessar_obras: value.pode_acessar_obras,
        pode_acessar_caixa: value.pode_acessar_caixa,
        pode_acessar_dashboard: value.pode_acessar_dashboard,
        todas_permissoes: value
      });
    }
  }, [loading, user?.id]);

  return (
    <PermissaoContext.Provider value={value}>
      {children}
    </PermissaoContext.Provider>
  );
}

export function usePermissao() {
  const context = useContext(PermissaoContext);
  if (context === undefined) {
    throw new Error('usePermissao must be used within a PermissaoProvider');
  }
  return context;
}
