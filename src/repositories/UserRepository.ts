import { supabase } from '@/lib/supabase'
import type { IUserRepository, CreateUserData, UpdateUserData } from '@/types/repositories'
import type { Database } from '@/lib/supabase'

type User = Database['public']['Tables']['users']['Row']

export class SupabaseUserRepository implements IUserRepository {
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar usuário por ID:', error)
      return null
    }

    return data
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      console.error('Erro ao buscar usuário por email:', error)
      return null
    }

    return data
  }

  async createUser(data: CreateUserData): Promise<User> {
    const { data: user, error } = await supabase
      .from('users')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar usuário:', error)
      throw new Error('Erro ao criar usuário')
    }

    return user
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const { data: user, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar usuário:', error)
      throw new Error('Erro ao atualizar usuário')
    }

    return user
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar usuário:', error)
      throw new Error('Erro ao deletar usuário')
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao verificar email:', error)
      return false
    }

    return !!data
  }

  async syncUserData(userId: string, userData: {
    email: string;
    full_name?: string;
  }): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: userData.email,
          full_name: userData.full_name
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao sincronizar dados do usuário:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao sincronizar dados do usuário:', error)
      return null
    }
  }
}

export const userRepository = new SupabaseUserRepository()
