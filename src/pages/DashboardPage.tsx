import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import Dashboard from '@/components/Dashboard';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/hooks/use-toast';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

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

  // Efeito para scroll suave e toast de boas-vindas
  useEffect(() => {
    // Scroll suave para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Toast de boas-vindas
    toast({
      title: "Bem-vindo de volta! 👋",
      description: "Aqui está o resumo dos seus eventos.",
    });
  }, [toast]);

  return (
    <div className="min-h-screen bg-tickety-black">
      <AuthenticatedHeader />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <Dashboard />
        </main>
      </PageTransition>
    </div>
  );
};

export default DashboardPage;
