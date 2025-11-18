import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface PermissaoContextType {
  isAdmin: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  canCreateCompromisso: boolean;
  canCreateProposta: boolean;
  canEditProposta: boolean;
  canDeleteProposta: boolean;
}

const PermissaoContext = createContext<PermissaoContextType | undefined>(undefined);

export function PermissaoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const isAdmin = user?.permissao === 'admin';
  const isVisualizador = user?.permissao === 'visualizador';
  
  // Permissões gerais (apenas admin)
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canCreate = isAdmin;
  
  // Permissões específicas
  const canCreateCompromisso = isAdmin || isVisualizador; // Visualizadores podem criar compromissos
  const canCreateProposta = isAdmin || isVisualizador; // Visualizadores podem criar propostas
  const canEditProposta = isAdmin || isVisualizador; // Visualizadores podem editar propostas
  const canDeleteProposta = isAdmin || isVisualizador; // Visualizadores podem deletar propostas

  return (
    <PermissaoContext.Provider value={{ 
      isAdmin, 
      canEdit, 
      canDelete, 
      canCreate,
      canCreateCompromisso,
      canCreateProposta,
      canEditProposta,
      canDeleteProposta
    }}>
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
