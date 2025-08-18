import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignUpForm } from '@/components/auth/SignUpForm'
import PageTransition from '@/components/PageTransition'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type AuthMode = 'login' | 'signup'

const AuthContent: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [showEmailConfirmed, setShowEmailConfirmed] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  // Verificar se há dados de checkout pendentes
  const hasPendingCheckout = localStorage.getItem('pendingCheckout') !== null;
  const checkoutMessage = location.state?.message;

  useEffect(() => {
    // Verificar se há tokens de confirmação na URL
    const handleEmailConfirmation = async () => {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const type = searchParams.get('type')

      if (accessToken && refreshToken && type === 'signup') {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Erro ao confirmar email:', error)
            toast.error('Não foi possível confirmar o email. Tente novamente.')
          } else if (data.user) {
            toast.success('Email confirmado. Redirecionando...')
            
            // Limpar os parâmetros da URL
            const newUrl = window.location.pathname
            window.history.replaceState({}, document.title, newUrl)
            
            // Redirecionar automaticamente após 2 segundos
            setTimeout(() => {
              navigate('/', { replace: true })
            }, 2000)
          }
        } catch (error) {
          console.error('Erro ao processar confirmação:', error)
          toast.error('Falha no processamento da confirmação. Tente novamente.')
        }
      }
    }

    handleEmailConfirmation()
  }, [searchParams])

  const handleSuccess = () => {
    if (mode === 'signup') {
      setShowEmailConfirmation(true)
    } else {
      console.log('Auth - Login realizado, verificando dados pendentes');
      
      // Verificar se há dados de checkout pendentes
      const pendingCheckout = localStorage.getItem('pendingCheckout');
      
      if (pendingCheckout) {
        try {
          const checkoutData = JSON.parse(pendingCheckout);
          console.log('Auth - Dados pendentes encontrados:', checkoutData);
          
          // Limpar os dados do localStorage
          localStorage.removeItem('pendingCheckout');
          
          // Se tem orderId, redirecionar para checkout
          if (checkoutData.orderId) {
            console.log('Auth - Redirecionando para checkout');
            setTimeout(() => {
              navigate('/checkout', { 
                state: {
                  event: checkoutData.event,
                  ticketQuantities: checkoutData.ticketQuantities,
                  orderId: checkoutData.orderId
                },
                replace: true 
              });
            }, 100);
          } else {
            // Se não tem orderId, redirecionar para o evento
            console.log('Auth - Redirecionando para evento:', checkoutData.returnUrl);
            setTimeout(() => {
              navigate(checkoutData.returnUrl || '/', { 
                replace: true 
              });
            }, 100);
          }
        } catch (error) {
          console.error('Erro ao restaurar dados do checkout:', error);
          // Se houver erro, redirecionar para a página inicial
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 100);
        }
      } else {
        console.log('Auth - Nenhum dado pendente, redirecionando para home');
        // Aguardar um pouco para garantir que o estado foi atualizado
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      }
    }
  }

  const handleSignUpSuccess = (email?: string) => {
    if (email) {
      setUserEmail(email)
      setShowEmailConfirmation(true)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md px-4">
        {/* Container do formulário com glass effect */}
        <div className="glass-card bg-black/30 backdrop-blur-lg border border-gray-800/50 shadow-2xl rounded-3xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo />
          </div>
          
          {/* Conteúdo */}
          {showEmailConfirmed ? (
            <div className="fade-in-up text-center">
              <div className="mb-8">
                <div className="w-12 h-12 bg-primary-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-primary-green" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-3">Email confirmado!</h2>
                <p className="text-sm lg:text-base text-gray-400">
                  Sua conta foi confirmada com sucesso. Agora você pode fazer login.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setShowEmailConfirmed(false)
                    setMode('login')
                  }}
                  className="w-full bg-primary-green hover:bg-primary-green/90 text-black font-semibold"
                >
                  Fazer login
                </Button>
              </div>
            </div>
          ) : showEmailConfirmation ? (
            <div className="fade-in-up text-center">
              <div className="mb-8">
                <div className="w-12 h-12 bg-primary-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-primary-green" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-3">Verifique seu email</h2>
                <p className="text-sm lg:text-base text-gray-400">
                  Enviamos um link de confirmação para <span className="text-primary-green">{userEmail}</span>
                </p>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setShowEmailConfirmation(false)
                    setMode('login')
                  }}
                  className="w-full bg-primary-green hover:bg-primary-green/90 text-black font-semibold"
                >
                  Continuar
                </Button>
              </div>
            </div>
          ) : (
            <div className="fade-in-up">
              {mode === 'login' ? (
                <LoginForm
                  onSwitchToSignUp={() => setMode('signup')}
                  onSuccess={handleSuccess}
                />
              ) : (
                <SignUpForm
                  onSwitchToLogin={() => setMode('login')}
                  onSuccess={handleSignUpSuccess}
                />
              )}

              {/* Informações adicionais */}
              <div className="mt-8 text-center text-xs lg:text-sm text-gray-400">
                <p>
                  {mode === 'login' 
                    ? 'Esqueceu sua senha? Entre em contato conosco.'
                    : 'Ao criar uma conta, você concorda com nossos termos de uso.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Auth: React.FC = () => {
  return (
    <div className="min-h-screen bg-tickety-black">
      <PageTransition>
        <AuthContent />
      </PageTransition>
    </div>
  )
}

export default Auth
