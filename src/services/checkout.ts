import { ordersRepository, ticketsRepository } from '@/repositories/SupabaseRepository';
import { Order, TicketEntity } from '@/types/repositories';
import { Event, TicketQuantities, TicketData } from '@/types';
import { supabase } from '@/lib/supabase';


export interface CheckoutResult {
  success: boolean;
  order?: Order;
  tickets?: TicketEntity[];
  error?: string;
}

export interface CheckoutData {
  event: Event;
  ticketQuantities: TicketQuantities;
  userData: {
    fullName: string;
    email: string;
    phone: string;
    cpf: string;
  };
  ticketData: TicketData[];
  userId: string; // ID do usuário autenticado
}

export class CheckoutService {
  // Criar ordem quando clicar em "Finalizar compra" na página do evento
  static async createOrder(event: Event, ticketQuantities: TicketQuantities, userId: string): Promise<CheckoutResult> {
    if (!userId) {
      return {
        success: false,
        error: 'Usuário não autenticado. É necessário fazer login para comprar ingressos.'
      };
    }
    try {
      // 1. Verificar disponibilidade dos tickets
      const availabilityCheck = await this.checkAvailability(event, ticketQuantities);
      if (!availabilityCheck.available) {
        return {
          success: false,
          error: `Tickets não disponíveis: ${availabilityCheck.errors.join(', ')}`
        };
      }

      // 2. Calcular valores
      const subtotal = Object.entries(ticketQuantities).reduce((sum, [batchId, quantity]) => {
        const batch = event.batches?.find(b => b.id === batchId);
        return sum + (batch ? batch.price * quantity : 0);
      }, 0);

      // Calcular taxa de serviço e total final
      const serviceFee = 5;
      const finalTotal = subtotal + serviceFee;

      // 3. Criar o pedido (usuário autenticado obrigatório)
      // Buscar dados do usuário para preencher campos obrigatórios
      const user = await supabase.auth.getUser();
      const userData = user.data.user;
      
      const order = await ordersRepository.create({
        userId: userId,
        subtotal: subtotal, // Valor dos ingressos (para o produtor)
        serviceFee: serviceFee, // Taxa de serviço (plataforma)
        total: finalTotal, // Total com taxa (para cobrança)
        buyerName: userData?.user_metadata?.full_name || 'Cliente',
        buyerEmail: userData?.email || 'cliente@email.com',
        buyerPhone: null
      });

      // 4. Criar order_items para cada lote
      const orderItems = [];
      for (const [batchId, quantity] of Object.entries(ticketQuantities)) {
        if (quantity > 0) {
          const batch = event.batches?.find(b => b.id === batchId);
          if (batch) {
            const orderItem = await supabase
              .from('order_items')
              .insert({
                order_id: order.id,
                batch_id: batchId,
                quantity: quantity,
                unit_price: batch.price
              })
              .select()
              .single();
            
            if (orderItem.data) {
              orderItems.push(orderItem.data);
            }
          }
        }
      }

              // 5. Diminuir quantity dos batches APENAS quando o pagamento for confirmado
        // (Movido para processCheckout)

      return {
        success: true,
        order,
        tickets: [] // Não há tickets ainda
      };

    } catch (error) {
      console.error('Erro ao criar ordem:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao criar ordem'
      };
    }
  }

  // Finalizar pagamento quando clicar em "Comprar agora" na página /compra
  static async processCheckout(
    orderId: string, 
    paymentMethod: string,
    buyerData: {
      buyerName: string;
      buyerEmail: string;
      buyerPhone?: string;
    },
    cardData?: {

    }
  ): Promise<CheckoutResult> {
    try {
      // 1. Buscar a ordem existente
      const order = await ordersRepository.findById(orderId);
      if (!order) {
        return {
          success: false,
          error: 'Ordem não encontrada'
        };
      }

      // 2. Atualizar dados da ordem com informações do comprador
      const updatedOrder = await ordersRepository.update(orderId, { 
        status: 'paid',
        buyerName: buyerData.buyerName,
        buyerEmail: buyerData.buyerEmail,
        buyerPhone: buyerData.buyerPhone || null,
        paidAt: new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T') + '.000Z'
      });

      // 3. Criar registro de pagamento
      await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          provider: paymentMethod,
          provider_payment_id: `payment_${Date.now()}`, // Simulado
          status: 'completed',
          amount: order.total
        });

      // 4. Criar tickets para cada lote após confirmação do pagamento
      const allTickets: TicketEntity[] = [];
      
      // Buscar order_items para saber quais tickets criar
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (orderItemsError) {
        throw new Error('Erro ao buscar itens da ordem');
      }

      // Criar tickets para cada item da ordem
      for (const orderItem of orderItems || []) {
        const batch = await supabase
          .from('batches')
          .select('*')
          .eq('id', orderItem.batch_id)
          .single();

        if (batch.data) {
          // Criar tickets para este lote
          for (let i = 0; i < orderItem.quantity; i++) {
            const ticketNumber = `TKT${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const qrCode = `QR_${ticketNumber}_${Date.now()}`; // QR code simples para teste
            
            const ticket = await supabase
              .from('tickets')
              .insert({
                batch_id: orderItem.batch_id,
                order_id: orderId,
                ticket_number: ticketNumber,
                status: 'sold',
                holder_name: buyerData.buyerName,
                holder_email: buyerData.buyerEmail,
                qr_code: qrCode
              })
              .select()
              .single();

            if (ticket.data) {
              allTickets.push(ticket.data);
            }
          }

          // 5. Diminuir quantity do batch APENAS quando o pagamento for confirmado
          const currentBatch = await supabase
            .from('batches')
            .select('quantity')
            .eq('id', orderItem.batch_id)
            .single();
            
          if (currentBatch.data) {
            const newQuantity = Math.max(0, currentBatch.data.quantity - orderItem.quantity);
            console.log(`Diminuindo quantity do batch ${orderItem.batch_id}: ${currentBatch.data.quantity} -> ${newQuantity} (diminuição: ${orderItem.quantity})`);
            await supabase
              .from('batches')
              .update({ quantity: newQuantity })
              .eq('id', orderItem.batch_id);
          }
        }
      }

      return {
        success: true,
        order: updatedOrder,
        tickets: allTickets
      };

    } catch (error) {
      console.error('Erro no checkout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido no checkout'
      };
    }
  }

  private static async checkAvailability(event: Event, ticketQuantities: TicketQuantities): Promise<{
    available: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Validar se há pelo menos um ingresso selecionado
    const totalQuantity = Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0);
    if (totalQuantity === 0) {
      errors.push('Selecione pelo menos um ingresso para continuar.');
      return { available: false, errors };
    }

    // Validar se o evento ainda está ativo
    if (event.status !== 'published') {
      errors.push('Este evento não está mais disponível para compra.');
      return { available: false, errors };
    }

    // Validar se o evento não passou
    const now = new Date();
    const eventStart = new Date(event.startsAt);
    if (eventStart <= now) {
      errors.push('Este evento já passou e não está mais disponível para compra.');
      return { available: false, errors };
    }

    for (const [batchId, requestedQuantity] of Object.entries(ticketQuantities)) {
      if (requestedQuantity > 0) {
        const batch = event.batches?.find(b => b.id === batchId);
        
        if (!batch) {
          errors.push(`Lote ${batchId} não encontrado`);
          continue;
        }

        // Verificar se há capacidade suficiente no lote
        const availableCapacity = batch.quantity || 0;

        if (requestedQuantity > availableCapacity) {
          errors.push(`Quantidade insuficiente para ${batch.title} (disponível: ${availableCapacity}, solicitado: ${requestedQuantity})`);
        }

        // Verificar limite de 10 ingressos por lote
        if (requestedQuantity > 10) {
          errors.push(`Máximo de 10 ingressos por lote para ${batch.title}`);
        }

        // Validar preço mínimo
        if (batch.price <= 0) {
          errors.push(`Preço inválido para ${batch.title}`);
        }
      }
    }

    return {
      available: errors.length === 0,
      errors
    };
  }
}
