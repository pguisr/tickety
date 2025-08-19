import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Order, OrderItem } from '@/types';

export interface SalesTransaction {
  id: string;
  orderId: string;
  eventTitle: string;
  batchTitle: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  buyerName: string;
  buyerEmail: string;
  status: string;
  createdAt: string;
  paidAt?: string;
}

export interface UseSalesOptions {
  userId?: string;
}

export interface UseSalesReturn {
  sales: SalesTransaction[];
  loading: boolean;
  error: string | null;
  refreshSales: () => Promise<void>;
}

export const useSales = (options: UseSalesOptions = {}): UseSalesReturn => {
  const { userId } = options;
  const { user } = useAuth();
  
  const [sales, setSales] = useState<SalesTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Função para carregar vendas
  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUserId = userId || user?.id;
      if (!currentUserId) {
        setSales([]);
        return;
      }

      // Buscar todos os pedidos dos eventos do usuário
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          buyer_name,
          buyer_email,
          created_at,
          order_items (
            id,
            quantity,
            unit_price,
            batches (
              title,
              events!inner (
                title,
                user_id
              )
            )
          )
        `)
        .filter('order_items.batches.events.user_id', 'eq', currentUserId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw new Error(ordersError.message);
      }

      // Transformar os dados para o formato desejado
      const salesTransactions: SalesTransaction[] = [];
      
      orders?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          salesTransactions.push({
            id: item.id,
            orderId: order.id,
            eventTitle: item.batches?.events?.title || 'Evento não encontrado',
            batchTitle: item.batches?.title || 'Lote não encontrado',
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalAmount: item.quantity * item.unit_price,
            buyerName: order.buyer_name,
            buyerEmail: order.buyer_email,
            status: order.status,
            createdAt: order.created_at,
            paidAt: order.paid_at
          });
        });
      });

      setSales(salesTransactions);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  }, [userId, user?.id]);

  // Carrega vendas na montagem e quando as dependências mudam
  useEffect(() => {
    loadSales();
  }, [userId, user?.id]);

  // Função para atualizar vendas manualmente
  const refreshSales = useCallback(async () => {
    await loadSales(true);
  }, [loadSales]);

  return {
    sales,
    loading,
    error,
    refreshSales
  };
};
