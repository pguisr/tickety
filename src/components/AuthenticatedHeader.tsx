import React, { useState, useEffect } from 'react';
import { Settings, ChevronDown, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/Logo';
import { getDisplayName, getInitials } from '@/utils/nameUtils';
import { userRepository } from '@/repositories/UserRepository';

const AuthenticatedHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [userName, setUserName] = useState('');
  const [userFullName, setUserFullName] = useState('');

  // Carregar nome do usuário da tabela users
  useEffect(() => {
    const loadUserName = async () => {
      if (user) {
        try {
          // Nome rápido dos metadados primeiro
          const quickName = user.user_metadata?.first_name || 
                           getDisplayName(user.user_metadata?.name || '') ||
                           getDisplayName(user.user_metadata?.full_name || '');
          
          const quickFullName = user.user_metadata?.name || 
                               user.user_metadata?.full_name || 
                               user.user_metadata?.display_name || '';

          if (quickName && quickName !== 'Usuário') {
            setUserName(quickName);
            setUserFullName(quickFullName || quickName);
          }

          // Depois buscar do banco
          const userFromDb = await userRepository.getUserById(user.id);
          
          if (userFromDb?.first_name) {
            setUserName(userFromDb.first_name);
            setUserFullName(userFromDb.full_name || userFromDb.first_name);
          } else if (!quickName || quickName === 'Usuário') {
            // Fallback apenas se necessário
            if (quickFullName) {
              const displayName = getDisplayName(quickFullName);
              setUserName(displayName);
              setUserFullName(quickFullName);
            } else if (user.email) {
              const emailName = user.email.split('@')[0];
              setUserName(emailName);
              setUserFullName(emailName);
            } else {
              setUserName('Usuário');
              setUserFullName('Usuário');
            }
          }
        } catch (error) {
          console.error('Erro ao carregar nome do usuário:', error);
          // Fallback final
          if (user.email) {
            const emailName = user.email.split('@')[0];
            setUserName(emailName);
            setUserFullName(emailName);
          } else {
            setUserName('Usuário');
            setUserFullName('Usuário');
          }
        }
      }
    };

    loadUserName();
  }, [user]);

  // Obter nome de exibição (primeiro nome apenas)
  const getDisplayUserName = (): string => {
    return userName;
  };

  // Obter iniciais do nome
  const getUserInitials = (): string => {
    return getInitials(userFullName);
  };

  // Obter email do usuário
  const getUserEmail = (): string => {
    return user?.email || '';
  };

  // Função para fazer logout
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Erro ao fazer logout. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <header className="sticky top-0 z-10 px-4 py-4">
      <div className="bg-black/50 backdrop-blur-lg border border-gray-800/50 shadow-lg rounded-2xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div>
              <a href="/" className="hover:opacity-80 transition-opacity">
                <Logo size="md" />
              </a>
            </div>
          </div>
                
          <div className="flex items-center space-x-6">
            {/* Navegação Desktop */}
            <nav className="hidden lg:flex items-center space-x-6">
              <a 
                href="/eventos" 
                className="text-white hover:text-primary-green transition-colors text-xs lg:text-sm font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/eventos');
                }}
              >
                Explorar
              </a>
              <a 
                href="/dashboard" 
                className="text-white hover:text-primary-green transition-colors text-xs lg:text-sm font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/dashboard');
                }}
              >
                Para produtores
              </a>
            </nav>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer group focus-visible:ring-0 focus-visible:ring-offset-0">
                  <div className="h-9 w-9 bg-primary-green hover:bg-primary-green/90 transition-colors rounded-xl flex items-center justify-center text-black font-semibold text-sm">
                    {getUserInitials() || <User size={16} />}
                  </div>
                  <ChevronDown size={16} className="text-white transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-black/90 backdrop-blur-lg border-gray-800/50 p-2 rounded-xl"
                align="end"
              >
                <DropdownMenuLabel className="text-xs font-normal text-gray-400 px-2 pb-2">
                  <div>
                    <div className="font-medium text-white">{getDisplayUserName()}</div>
                    <div className="text-xs text-gray-400">{getUserEmail()}</div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10 my-1" />
                
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer transition-colors rounded-lg px-2 py-1.5 my-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={() => navigate('/configuracoes')}
                >
                  <Settings size={16} className="text-gray-400" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10 my-1" />
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer transition-colors rounded-lg px-2 py-1.5 my-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedHeader;
