import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, ShoppingCart, Calendar } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { getDisplayName } from '@/utils/nameUtils';
import { userRepository } from '@/repositories/UserRepository';

const HomeContent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userName, setUserName] = useState('');

  // Carregar nome do usuário da tabela users
  useEffect(() => {
    const loadUserName = async () => {
      if (user) {
        try {
          // Primeiro tentar nome rápido dos metadados enquanto carrega do banco
          const quickName = user.user_metadata?.first_name || 
                           getDisplayName(user.user_metadata?.name || '') ||
                           getDisplayName(user.user_metadata?.full_name || '');
          
          if (quickName && quickName !== 'Usuário') {
            setUserName(quickName);
          } else {
            // Se não tem nome rápido, já define um fallback inicial
            const authName = user.user_metadata?.name || 
                            user.user_metadata?.display_name || 
                            user.user_metadata?.full_name || 
                            '';
            
            const displayName = getDisplayName(authName);
            setUserName(displayName || 'Usuário');
          }

          // Depois buscar do banco para ter certeza (silenciosamente)
          const userFromDb = await userRepository.getUserById(user.id);
          
          if (userFromDb?.full_name && userFromDb.full_name !== userName) {
            const displayName = getDisplayName(userFromDb.full_name);
            setUserName(displayName || 'Usuário');
          }
        } catch (error) {
          console.error('Erro ao carregar nome do usuário:', error);
          // Fallback final se ainda não tem nome
          if (!userName) {
            const authName = user.user_metadata?.name || '';
            const displayName = getDisplayName(authName);
            setUserName(displayName || 'Usuário');
          }
        }
      }
    };

    loadUserName();
  }, [user]);

  const handleViewTickets = () => {
    navigate('/meus-ingressos');
  };

  const handleCreateEvent = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Header seguindo o padrão do sistema */}
      <div className="text-center mb-8 lg:mb-12 max-w-2xl mx-auto">
        <h1 className="text-3xl lg:text-4xl font-light text-white mb-4">
          Olá, <span className="font-semibold text-primary-green">
            {userName || 'Usuário'}
          </span>! 
          <span className="ml-2">👋</span>
        </h1>
        <p className="text-base lg:text-lg text-gray-400">
          Escolha o que você gostaria de fazer hoje
        </p>
      </div>

      {/* Cards seguindo o padrão glass-card do sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
        <button
          onClick={handleViewTickets}
          className="group p-6 glass-card border border-gray-800/50 hover:border-blue-500/30 rounded-xl transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <ShoppingCart className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Meus Ingressos
                </h3>
                <p className="text-sm text-gray-400">
                  Visualizar e gerenciar compras
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
          </div>
        </button>
        
        <button
          onClick={handleCreateEvent}
          className="group p-6 glass-card border border-gray-800/50 hover:border-primary-green/30 rounded-xl transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3 bg-primary-green/20 rounded-lg group-hover:bg-primary-green/30 transition-colors">
                <Calendar className="h-6 w-6 text-primary-green" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Área do Produtor
                </h3>
                <p className="text-sm text-gray-400">
                  Criar e gerenciar eventos
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-primary-green transition-colors" />
          </div>
        </button>
      </div>
    </div>
  );
};

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Aguardar carregamento antes de redirecionar
  if (loading) {
    return (
      <div className="min-h-screen bg-tickety-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-green"></div>
      </div>
    )
  }

  // Se não está logado, redirecionar para login
  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-tickety-black">
      <AuthenticatedHeader />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <HomeContent />
        </main>
      </PageTransition>
    </div>
  );
};

export default Index;