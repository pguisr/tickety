import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersRepository, ticketsRepository, eventsRepository, batchesRepository } from '@/repositories/SupabaseRepository';
import { Order, TicketEntity } from '@/types';

interface UserTicket {
  id: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketType: string;
  quantity: number;
  price: number;
  orderId: string;
  createdAt: string;
  status: string;
  ticketNumbers: string[];
}

export const useUserTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserTickets = async () => {
      if (!user) {
        setTickets([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar pedidos do usuário
        const userOrders = await ordersRepository.findByUserId(user.id);
        
        // Filtrar apenas pedidos pagos
        const paidOrders = userOrders.filter(order => order.status === 'paid');
        
        // Transformar pedidos em ingressos
        const userTickets: UserTicket[] = [];
        
        for (const order of paidOrders) {
          try {
            // Buscar tickets do pedido
            const orderTickets = await ticketsRepository.findByOrderId(order.id);
            
            if (orderTickets.length > 0) {
              // Agrupar tickets por batch para obter informações do evento
              const batchIds = [...new Set(orderTickets.map(ticket => ticket.batchId))];
              
              for (const batchId of batchIds) {
                try {
                  // Buscar informações do batch
                  const batch = await batchesRepository.findById(batchId);
                  
                  if (batch) {
                    // Buscar informações do evento
                    const event = await eventsRepository.findById(batch.eventId);
                    
                    if (event) {
                      // Filtrar tickets deste batch
                      const batchTickets = orderTickets.filter(ticket => ticket.batchId === batchId);
                      
                      // Calcular quantidade e preço
                      const quantity = batchTickets.length;
                      const price = batch.price;
                      
                      // Extrair números dos tickets
                      const ticketNumbers = batchTickets.map(ticket => ticket.ticketNumber);
                      
                      userTickets.push({
                        id: `${order.id}-${batchId}`,
                        eventTitle: event.title,
                        eventDate: event.startsAt.split('T')[0], // Extrair apenas a data
                        eventTime: event.startsAt.split('T')[1]?.split('.')[0] || '', // Extrair apenas o horário
                        eventLocation: event.location,
                        ticketType: batch.title || `Ingresso ${batchId.slice(0, 8)}`,
                        quantity,
                        price,
                        orderId: order.id,
                        createdAt: order.createdAt,
                        status: order.status,
                        ticketNumbers
                      });
                    }
                  }
                } catch (batchError) {
                  console.warn(`Erro ao buscar batch ${batchId}:`, batchError);
                  // Continuar com outros batches mesmo se um falhar
                }
              }
            }
          } catch (orderError) {
            console.warn(`Erro ao buscar tickets do pedido ${order.id}:`, orderError);
            // Continuar com outros pedidos mesmo se um falhar
          }
        }

        setTickets(userTickets);
      } catch (err) {
        console.error('Erro ao buscar ingressos:', err);
        setError('Erro ao carregar seus ingressos');
      } finally {
        setLoading(false);
      }
    };

    fetchUserTickets();
  }, [user]);

  return {
    tickets,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Recarregar dados
      if (user) {
        // Trigger do useEffect
        setTickets([]);
      }
    }
  };
};
