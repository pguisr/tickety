import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { splitName } from '@/utils/nameUtils';
import { userRepository } from '@/repositories/UserRepository';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Força re-render em dispositivos móveis e sincroniza dados
        if (event === 'SIGNED_IN' && session?.user) {
          // Sincronizar dados do usuário com a tabela users
          const syncUserDataOnLogin = async () => {
            try {
              if (session.user?.user_metadata) {
                const fullName = session.user.user_metadata.full_name || 
                                session.user.user_metadata.name || 
                                session.user.user_metadata.display_name || '';
                const firstName = session.user.user_metadata.first_name || 
                                 splitName(fullName).firstName;

                await userRepository.syncUserData(session.user.id, {
                  email: session.user.email || '',
                  full_name: fullName,
                  first_name: firstName
                });
              }
            } catch (error) {
              console.error('Erro ao sincronizar dados do usuário:', error);
            }
          };

          // Pequeno delay para garantir que o estado foi propagado
          setTimeout(() => {
            setUser(session.user);
            setSession(session);
            syncUserDataOnLogin();
          }, 50);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Separar nome em first_name e last_name
      const { firstName, lastName } = splitName(name);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: name,
            first_name: firstName
          }
        }
      });
      

      
      if (error) {

        throw error;
      }
      

      return data;
    } catch (error) {

      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
