import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface User {
  id: string;
  nome: string;
  email: string;
  permissao: 'admin' | 'visualizador';
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  register: (data: { nome: string; email: string; senha: string; permissao: 'admin' | 'visualizador'; avatar_url?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  // Cadastro completo: Auth + tabela 'usuarios'
  const register = async ({ nome, email, senha, permissao, avatar_url }: { nome: string; email: string; senha: string; permissao: 'admin' | 'visualizador'; avatar_url?: string }): Promise<boolean> => {
    // Cria usuário no Auth
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error || !data.user) return false;
    // Cria registro na tabela 'usuarios'
    const { error: dbError } = await supabase
      .from('usuarios')
      .insert({
        id: data.user.id,
        nome,
        email,
        permissao,
        avatar_url: avatar_url || null,
      });
    if (dbError) return false;
    return true;
  };
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let authListener: any;
    // Função para buscar dados do usuário
    const fetchUser = async (userObj: any) => {
      if (userObj) {
        const { data: userData } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', userObj.email)
          .single();
        if (userData) setUser(userData);
        else setUser(null);
      } else {
        setUser(null);
      }
    };

    // Verifica sessão inicial
    supabase.auth.getUser().then(({ data }) => {
      fetchUser(data?.user).then(() => setLoading(false));
    });

    // Listener para mudanças de autenticação
    authListener = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUser(session?.user).then(() => setLoading(false));
    });

    return () => {
      authListener?.data?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    // Autentica com Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error || !data.user) {
      console.error('Erro Supabase Auth:', error?.message, error);
      return false;
    }
    // Busca dados do usuário na tabela 'usuarios' usando o email do Auth
    const authEmail = data.user.email;
    const { data: userData, error: dbError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', authEmail)
      .maybeSingle();
    if (dbError) {
      console.error('Erro ao buscar usuário na tabela usuarios:', dbError?.message, dbError);
    }
    if (userData) {
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      await supabase
        .from('usuarios')
        .update(userData)
        .eq('id', user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
