import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o Supabase Database - Schema Mínimo ATUALIZADO
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          location: string
          address: string
          url: string
          image_url: string | null
          max_capacity: number | null
          starts_at: string
          ends_at: string
          user_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          location: string
          address: string
          url: string
          image_url?: string | null
          max_capacity?: number | null
          starts_at: string
          ends_at: string
          user_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          location?: string
          address?: string
          url?: string
          image_url?: string | null
          max_capacity?: number | null
          starts_at?: string
          ends_at?: string
          user_id?: string
          status?: string
          created_at?: string
        }
      }
      batches: {
        Row: {
          id: string
          event_id: string
          title: string
          description: string | null
          price: number
          quantity: number
          is_active: boolean
          sale_starts_at: string | null
          sale_ends_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          title: string
          description?: string | null
          price: number
          quantity: number
          is_active?: boolean
          sale_starts_at?: string | null
          sale_ends_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          title?: string
          description?: string | null
          price?: number
          quantity?: number
          is_active?: boolean
          sale_starts_at?: string | null
          sale_ends_at?: string | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          subtotal: number
          service_fee: number
          total: number
          status: string
          buyer_name: string
          buyer_email: string
          buyer_phone: string | null
          created_at: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          subtotal: number
          service_fee?: number
          total: number
          status?: string
          buyer_name: string
          buyer_email: string
          buyer_phone?: string | null
          created_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          subtotal?: number
          service_fee?: number
          total?: number
          status?: string
          buyer_name?: string
          buyer_email?: string
          buyer_phone?: string | null
          created_at?: string
          paid_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          batch_id: string
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          batch_id: string
          quantity: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          batch_id?: string
          quantity?: number
          unit_price?: number
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          batch_id: string
          order_id: string | null
          ticket_number: string
          status: string
          qr_code: string | null
          holder_name: string | null
          holder_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          batch_id: string
          order_id?: string | null
          ticket_number?: string
          status?: string
          qr_code?: string | null
          holder_name?: string | null
          holder_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          batch_id?: string
          order_id?: string | null
          ticket_number?: string
          status?: string
          qr_code?: string | null
          holder_name?: string | null
          holder_email?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string
          provider: string
          provider_payment_id: string
          status: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          provider: string
          provider_payment_id: string
          status?: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          provider?: string
          provider_payment_id?: string
          status?: string
          amount?: number
          created_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          ticket_id: string
          checked_at: string
          checked_by_user_id: string | null
        }
        Insert: {
          id?: string
          ticket_id: string
          checked_at?: string
          checked_by_user_id?: string | null
        }
        Update: {
          id?: string
          ticket_id?: string
          checked_at?: string
          checked_by_user_id?: string | null
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          event_id: string | null
          discount_type: string | null
          discount_value: number
          max_uses: number | null
          current_uses: number
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          event_id?: string | null
          discount_type?: string | null
          discount_value: number
          max_uses?: number | null
          current_uses?: number
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          event_id?: string | null
          discount_type?: string | null
          discount_value?: number
          max_uses?: number | null
          current_uses?: number
          expires_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
