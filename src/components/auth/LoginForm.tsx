import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface LoginFormProps {
  onSwitchToSignUp: () => void
  onSuccess: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignUp, onSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações básicas
    if (!email.trim()) {
      toast.error("O email é obrigatório.")
      return
    }

    if (!password.trim()) {
      toast.error("A senha é obrigatória.")
      return
    }

    setLoading(true)

    try {
      await signIn(email, password)
      
      toast.success("Login realizado com sucesso.")
      // Aguardar um pouco para garantir que o contexto foi atualizado
      setTimeout(() => {
        onSuccess()
      }, 150)
    } catch (error) {
      console.error('Erro no login:', error)
      
      let errorMessage = "Ocorreu um erro ao fazer login."
      
      if (error instanceof Error) {
        console.log('Erro detalhado do login:', error.message)
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Email ou senha incorretos."
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Email não confirmado. Verifique sua caixa de entrada."
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "Muitas tentativas. Tente novamente em alguns minutos."
        } else if (error.message.includes('User not found')) {
          errorMessage = "Usuário não encontrado. Verifique o email."
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-tickety-white mb-2">Entre na sua conta</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-tickety-white font-medium">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-black/30 border-gray-700 text-tickety-white placeholder:text-gray-500 focus:border-primary-green focus:ring-primary-green/20"
              placeholder="seu@email.com"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-tickety-white font-medium">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 bg-black/30 border-gray-700 text-tickety-white placeholder:text-gray-500 focus:border-primary-green focus:ring-primary-green/20"
              placeholder="••••••••"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/5 text-gray-400 hover:text-tickety-white"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-primary-green hover:bg-primary-green/90 text-black font-semibold py-3 text-base transition-all duration-200 shadow-lg hover:shadow-primary-green/25" 
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
              Entrando...
            </div>
          ) : (
            'Entrar'
          )}
        </Button>

        {onSwitchToSignUp && (
          <div className="text-center pt-4">
            <p className="text-gray-400">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="text-primary-green hover:text-primary-green/80 font-medium transition-colors duration-200"
              >
                Cadastre-se
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
