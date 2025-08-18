import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { userRepository } from '@/repositories/UserRepository'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { toast } from 'sonner'

interface SignUpFormProps {
  onSwitchToLogin: () => void
  onSuccess: (email?: string) => void
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp, signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações básicas
    if (!name.trim()) {
      toast.error("O nome é obrigatório.")
      return
    }

    if (!email.trim()) {
      toast.error("O email é obrigatório.")
      return
    }

    if (!email.includes('@')) {
      toast.error("Email inválido. Verifique e tente novamente.")
      return
    }

    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.")
      return
    }

    setLoading(true)

    try {
      // Tentar fazer cadastro diretamente
      await signUp(email, password, name)
      
      // Se chegou até aqui sem erro, significa que o cadastro foi bem-sucedido
      toast.success("Conta criada. Confirme seu email antes de fazer login.")
      onSuccess(email)
      
    } catch (error) {
      console.error('Erro no signUp:', error)
      
      if (error instanceof Error) {
        const errorMessageLower = error.message.toLowerCase()
        
        // Verificar se é um erro de email já cadastrado
        if (errorMessageLower.includes('already registered') || 
            errorMessageLower.includes('already exists') ||
            errorMessageLower.includes('duplicate key') ||
            errorMessageLower.includes('user already registered') ||
            errorMessageLower.includes('already been registered') ||
            errorMessageLower.includes('email already') ||
            errorMessageLower.includes('user exists') ||
            errorMessageLower.includes('duplicate')) {
          
          // Email já existe - mostrar mensagem específica
          toast.error("Esse email já está cadastrado. Use outro ou faça login.")
          
          // Limpar o campo de email para facilitar a correção
          setEmail('')
          
        } else if (errorMessageLower.includes('invalid email')) {
          toast.error("Email inválido. Verifique e tente novamente.")
        } else if (errorMessageLower.includes('weak password')) {
          toast.error("Senha fraca. Use ao menos 6 caracteres.")
        } else {
          toast.error("Falha ao criar a conta. Tente novamente.")
        }
      } else {
        toast.error("Falha ao criar a conta. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-tickety-white mb-2">Vamos criar sua conta</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-tickety-white font-medium">Nome Completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 bg-black/30 border-gray-700 text-tickety-white placeholder:text-gray-500 focus:border-primary-green focus:ring-primary-green/20"
              placeholder="Seu nome completo"
              required
            />
          </div>
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-tickety-white font-medium">Confirmar Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-10 bg-black/30 border-gray-700 text-tickety-white placeholder:text-gray-500 focus:border-primary-green focus:ring-primary-green/20"
              placeholder="••••••••"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/5 text-gray-400 hover:text-tickety-white"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
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
              Criando conta...
            </div>
          ) : (
            'Criar conta'
          )}
        </Button>

        {onSwitchToLogin && (
          <div className="text-center pt-4">
            <p className="text-gray-400">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary-green hover:text-primary-green/80 font-medium transition-colors duration-200"
              >
                Faça login
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
