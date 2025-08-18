import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast as sonnerToast } from 'sonner';
import { splitName, combineName } from '@/utils/nameUtils';
import { userRepository } from '@/repositories/UserRepository';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import PageTransition from '@/components/PageTransition';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [userData, setUserData] = useState({
    firstName: '',
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Estado para controlar se houve alterações
  const [hasChanges, setHasChanges] = useState(false);

  // Carrega dados do usuário do Supabase Auth e banco de dados
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    const loadUserData = async () => {
      if (user) {
        const userName = user.user_metadata?.name || 
                        user.user_metadata?.display_name || 
                        user.user_metadata?.full_name ||
                        '';
        
        const { firstName } = splitName(userName);
        
        // Carregar dados adicionais do banco de dados
        const userFromDb = await userRepository.getUserById(user.id);
        
        setUserData(prev => ({
          ...prev,
          firstName,
          fullName: userName,
          email: user.email || ''
        }));
      }
    };
    
    loadUserData();
  }, [user]);

  // Verifica se houve alterações
  useEffect(() => {
    if (!user) return;

    const userName = user.user_metadata?.name || 
                    user.user_metadata?.display_name || 
                    user.user_metadata?.full_name ||
                    '';
    
    const hasNameChanged = userData.fullName !== userName;
    const hasEmailChanged = userData.email !== (user.email || '');
    const hasPasswordChanged = Boolean(userData.newPassword || userData.confirmPassword);

    setHasChanges(hasNameChanged || hasEmailChanged || hasPasswordChanged);
  }, [userData, user]);

  const updateField = (field: string, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Validações básicas
      if (!userData.fullName.trim()) {
        sonnerToast.error("O nome é obrigatório.");
        setIsLoading(false);
        return;
      }

      // Validação de email
      if (!userData.email.trim()) {
        sonnerToast.error("Email é obrigatório.");
        return;
      }

      // Validação de senha (se estiver alterando)
      if (userData.newPassword || userData.confirmPassword) {
        if (!userData.currentPassword.trim()) {
          sonnerToast.error("Senha atual é obrigatória para alterar a senha.");
          return;
        }
        if (userData.newPassword !== userData.confirmPassword) {
          sonnerToast.error("As senhas não coincidem.");
          return;
        }
        if (userData.newPassword.length < 6) {
          sonnerToast.error("A nova senha deve ter pelo menos 6 caracteres.");
          return;
        }
      }

      // Atualizar dados do usuário no Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          name: userData.fullName,
          first_name: userData.firstName,
          display_name: userData.fullName
        },
        email: userData.email !== user?.email ? userData.email : undefined
      });

      if (updateError) {
        throw updateError;
      }

      // Atualizar dados no banco de dados
      await userRepository.updateUser(user.id, {
        full_name: userData.fullName,
        email: userData.email
      });

      // Se está alterando senha, validar e atualizar
      if (userData.newPassword || userData.confirmPassword) {
        if (!userData.currentPassword) {
          sonnerToast.error("Informe sua senha atual para alterá-la.");
          setIsLoading(false);
          return;
        }

        if (userData.newPassword !== userData.confirmPassword) {
          sonnerToast.error("As senhas não coincidem.");
          setIsLoading(false);
          return;
        }

        if (userData.newPassword.length < 6) {
          sonnerToast.error("A nova senha deve ter no mínimo 6 caracteres.");
          setIsLoading(false);
          return;
        }

        // Verificar se a nova senha é diferente da atual
        if (userData.newPassword === userData.currentPassword) {
          sonnerToast.error("A nova senha deve ser diferente da atual.");
          setIsLoading(false);
          return;
        }

        // Primeiro, verificar se a senha atual está correta
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user?.email || '',
          password: userData.currentPassword
        });

        if (signInError) {
          sonnerToast.error("Senha atual incorreta.");
          setIsLoading(false);
          return;
        }

        // Atualizar senha
        const { error: passwordError } = await supabase.auth.updateUser({
          password: userData.newPassword
        });

        if (passwordError) {
          throw passwordError;
        }

        // Se alterou senha, mostrar mensagem específica
        sonnerToast.success("Senha alterada com sucesso.");
      } else {
        // Se não alterou senha, mostrar mensagem geral
        sonnerToast.success("Configurações salvas com sucesso.");
      }
      
      // Limpar campos de senha
      setUserData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      
      // Determinar a mensagem de erro mais específica
      let errorMessage = "Erro ao salvar configurações";
      
      if (error.message) {
        if (error.message.includes('password')) {
          errorMessage = "Erro ao alterar senha. Verifique se a senha atual está correta.";
        } else if (error.message.includes('email')) {
          errorMessage = "Erro ao alterar email. Verifique se o email é válido.";
        } else if (error.message.includes('network')) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        } else {
          errorMessage = error.message;
        }
      }
      
      sonnerToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tickety-black">
      <AuthenticatedHeader />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 max-w-4xl pb-24 lg:pb-6">
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white mb-1 px-4">Configurações</h1>
          <p className="text-sm text-gray-400 px-4">Gerencie suas informações pessoais</p>
        </div>

        <div className="space-y-6">
          {/* Informações Pessoais */}
          <Card className="glass-card border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <User size={20} className="text-primary-green" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-300 mb-3 block">
                  Nome Completo *
                </Label>
                <Input
                  id="fullName"
                  value={userData.fullName}
                  onChange={(e) => {
                    const fullName = e.target.value;
                    const { firstName } = splitName(fullName);
                    setUserData(prev => ({
                      ...prev,
                      fullName,
                      firstName
                    }));
                  }}
                  className="bg-black/30 border-gray-800 text-white h-12 focus:border-primary-green"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-300 mb-3 block">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="bg-black/30 border-gray-800 text-white h-12 focus:border-primary-green"
                  placeholder="seu@email.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Alterar Senha */}
          <Card className="glass-card border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Lock size={20} className="text-primary-green" />
                Alterar Senha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-300 mb-3 block">
                  Senha Atual
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={userData.currentPassword}
                    onChange={(e) => updateField('currentPassword', e.target.value)}
                    className="bg-black/30 border-gray-800 text-white h-12 pr-12 focus:border-primary-green"
                    placeholder="Digite sua senha atual"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-black"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-300 mb-3 block">
                  Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={userData.newPassword}
                    onChange={(e) => updateField('newPassword', e.target.value)}
                    className="bg-black/30 border-gray-800 text-white h-12 pr-12 focus:border-primary-green"
                    placeholder="Digite a nova senha"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-black"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300 mb-3 block">
                  Confirmar Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={userData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className="bg-black/30 border-gray-800 text-white h-12 pr-12 focus:border-primary-green"
                    placeholder="Confirme a nova senha"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-black"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div className="bg-primary-green/10 border border-primary-green/20 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  <strong className="text-primary-green">Dica:</strong> Deixe os campos de senha em branco se não quiser alterar sua senha atual.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Barra de Ações - Mobile */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-800 shadow-2xl p-4">
          <div className="flex items-center justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleSave}
                    disabled={isLoading || !hasChanges}
                    className="bg-primary-green hover:bg-primary-green/90 text-black font-semibold gap-2 w-full max-w-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Salvar alterações</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Barra de Ações - Desktop */}
        <div className="hidden lg:block fixed bottom-6 right-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleSave}
                  disabled={isLoading || !hasChanges}
                  className="bg-primary-green hover:bg-primary-green/90 text-black font-semibold gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Salvar alterações</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        </main>
      </PageTransition>
    </div>
  );
};

export default Settings; 