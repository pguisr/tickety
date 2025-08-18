import { supabase } from '@/lib/supabase'
import { 
  Event, 
  Ticket, 
  Sale, 
  TicketReservation,
  CreateSaleData,
  TicketQuantities,
  ReservationResult,
  AvailabilityCheck,
  SalesReportOptions,
  SalesReport,
  RevenueStats
} from '@/types'
import { 
  IEventsRepository, 
  IUserRepository, 
  IBatchesRepository, 
  ISalesRepository,
  IOrdersRepository,
  ITicketsRepository,
  CreateEventData, 
  FindEventsOptions, 
  EventsResponse, 
  EventStats, 
  DeleteEventResult,
  CreateUserData,
  UpdateUserData,
  Batch,
  Order,
  CreateOrderData,
  UpdateOrderData,
  TicketEntity,
  CreateTicketData
} from '@/types/repositories'

// Classe base para repositórios Supabase
abstract class BaseSupabaseRepository {
  protected handleError(error: any, operation: string): never {
    console.error(`Erro na operação ${operation}:`, error)
    throw new Error(error.message || `Falha na operação ${operation}`)
  }
}

// Implementação do repositório de eventos
export class SupabaseEventsRepository extends BaseSupabaseRepository {
  
  async create(eventData: CreateEventData): Promise<Event> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          starts_at: eventData.startsAt,
          ends_at: eventData.endsAt,
          location: eventData.location,
          address: eventData.address,
          url: eventData.url,
          image_url: eventData.image,
          user_id: eventData.userId,
          status: 'published' // Eventos criados são publicados por padrão
        })
        .select()
        .single()

      if (error) this.handleError(error, 'criar evento')
      
      return this.mapToEvent(data)
    } catch (error) {
      this.handleError(error, 'criar evento')
    }
  }

  async findById(id: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Não encontrado
        this.handleError(error, 'buscar evento por ID')
      }
      
      // Carregar batches do evento
      const event = this.mapToEvent(data);
      if (event) {
        const batches = await batchesRepository.findByEventId(event.id);
        event.batches = batches;
      }
      
      return event;
    } catch (error) {
      this.handleError(error, 'buscar evento por ID')
    }
  }

  async findByUrl(url: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('url', url)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Não encontrado
        this.handleError(error, 'buscar evento por URL')
      }
      
      // Carregar batches do evento
      const event = this.mapToEvent(data);
      if (event) {
        const batches = await batchesRepository.findByEventId(event.id);
        event.batches = batches;
      }
      
      return event;
    } catch (error) {
      this.handleError(error, 'buscar evento por URL')
    }
  }

  async update(id: string, eventData: Partial<CreateEventData>): Promise<Event> {
          try {
        // Mapear campos do frontend para o banco de dados
        const updateData: any = {};

        // Mapear campos obrigatórios se presentes
        if (eventData.title !== undefined) updateData.title = eventData.title;
        if (eventData.description !== undefined) updateData.description = eventData.description;
        if (eventData.startsAt !== undefined) updateData.starts_at = eventData.startsAt;
        if (eventData.endsAt !== undefined) updateData.ends_at = eventData.endsAt;
        if (eventData.location !== undefined) updateData.location = eventData.location;
        if (eventData.address !== undefined) updateData.address = eventData.address;
        if (eventData.url !== undefined) updateData.url = eventData.url;
        if (eventData.image !== undefined) updateData.image_url = eventData.image;
        if (eventData.maxCapacity !== undefined) updateData.max_capacity = eventData.maxCapacity;
        if (eventData.userId !== undefined) updateData.user_id = eventData.userId;

      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()

      if (error) this.handleError(error, 'atualizar evento')
      
      return this.mapToEvent(data)
    } catch (error) {
      this.handleError(error, 'atualizar evento')
    }
  }

  // Verificar se evento tem vendas (por enquanto sempre retorna false)
  async hasActiveSales(eventId: string): Promise<boolean> {
    // Por enquanto, não temos sistema de vendas implementado
    // Quando implementarmos, podemos verificar na tabela orders ou tickets
    return false;
  }

  // Arquivar evento (soft delete)
  async archiveEvent(eventId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('events')
        .update({ 
          status: 'archived',
          archived_at: new Date().toISOString(),
          archived_by: userId
        })
        .eq('id', eventId);

      if (error) this.handleError(error, 'arquivar evento');
    } catch (error) {
      this.handleError(error, 'arquivar evento');
    }
  }

  // Reativar evento arquivado
  async reactivateEvent(eventId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('events')
        .update({ 
          status: 'published',
          archived_at: null,
          archived_by: null
        })
        .eq('id', eventId);

      if (error) this.handleError(error, 'reativar evento');
    } catch (error) {
      this.handleError(error, 'reativar evento');
    }
  }

  // Método delete inteligente - delete sem vendas, archive com vendas
  async delete(id: string): Promise<DeleteEventResult> {
    try {
      // Verificar se tem vendas confirmadas
      const hasSales = await this.hasActiveSales(id);
      
      if (hasSales) {
        // Se tem vendas, arquiva (invisível no frontend)
        await this.archiveEvent(id, 'system');
        return {
          success: true,
          action: 'archived',
          message: 'Evento arquivado (possui vendas registradas)',
          hasSales: true
        };
      }

      // Se não tem vendas, exclui definitivamente
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) this.handleError(error, 'deletar evento');

      return {
        success: true,
        action: 'deleted',
        message: 'Evento excluído com sucesso',
        hasSales: false
      };
    } catch (error) {
      this.handleError(error, 'deletar evento');
    }
  }

  async findAll(options: FindEventsOptions = {}): Promise<EventsResponse> {
    try {
      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })

      // Aplicar filtros existentes
      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,subtitle.ilike.%${options.search}%,location.ilike.%${options.search}%`)
      }

      if (options.userId) {
        query = query.eq('user_id', options.userId)
      }

      // NUNCA mostrar eventos arquivados no frontend (só no banco para auditoria)
      query = query.neq('status', 'archived')

      // Filtro específico de status (mas nunca arquivados)
      if (options.status && options.status !== 'archived') {
        query = query.eq('status', options.status)
      }

      if (options.dateFrom) {
        query = query.gte('start_date', options.dateFrom)
      }

      if (options.dateTo) {
        query = query.lte('start_date', options.dateTo)
      }

      if (options.location) {
        query = query.ilike('location', `%${options.location}%`)
      }

      // Aplicar ordenação
      if (options.sortBy) {
        const ascending = options.sortOrder !== 'desc'
        query = query.order(options.sortBy, { ascending })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Aplicar paginação
      const page = options.page || 1
      const limit = options.limit || 10
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) this.handleError(error, 'listar eventos')

      return {
        events: data.map(this.mapToEvent),
        total: count || 0,
        page: options.page || 1,
        limit: options.limit || 10,
        hasMore: (count || 0) > ((options.page || 1) - 1) * (options.limit || 10) + (options.limit || 10)
      }
    } catch (error) {
      this.handleError(error, 'listar eventos')
    }
  }

  async findByUserId(userId: string, options: FindEventsOptions = {}): Promise<EventsResponse> {
    return this.findAll({ ...options, userId })
  }

  async getStats(userId?: string): Promise<EventStats> {
    try {
      let eventsQuery = supabase
        .from('events')
        .select('*', { count: 'exact' })

      if (userId) {
        eventsQuery = eventsQuery.eq('user_id', userId)
      }

      const { data: events, error: eventsError, count } = await eventsQuery
      if (eventsError) this.handleError(eventsError, 'obter estatísticas de eventos')

      // Obter pedidos pagos 
      let ordersQuery = supabase
        .from('orders')
        .select('*')
        .eq('status', 'paid')

      // Se há filtro de usuário, precisamos buscar apenas orders de eventos desse usuário
      if (userId) {
        if (events?.length) {
          // Usuário tem eventos - buscar orders desses eventos
          const eventIds = events.map(e => e.id)
          const { data: batches } = await supabase
            .from('batches')
            .select('id')
            .in('event_id', eventIds)
          
          if (batches?.length) {
            const batchIds = batches.map(b => b.id)
            
            // Buscar tickets desses batches
            const { data: userTickets } = await supabase
              .from('tickets')
              .select('order_id')
              .in('batch_id', batchIds)
              .not('order_id', 'is', null)
            
            if (userTickets?.length) {
              const orderIds = [...new Set(userTickets.map(t => t.order_id).filter(Boolean))]
              ordersQuery = ordersQuery.in('id', orderIds)
            } else {
              // Se não há tickets, não há orders para este usuário
              ordersQuery = ordersQuery.eq('id', '00000000-0000-0000-0000-000000000000') // ID impossível
            }
          } else {
            // Se não há batches, não há orders para este usuário
            ordersQuery = ordersQuery.eq('id', '00000000-0000-0000-0000-000000000000') // ID impossível
          }
        } else {
          // Usuário não tem eventos - não deve ter orders relacionadas
          ordersQuery = ordersQuery.eq('id', '00000000-0000-0000-0000-000000000000') // ID impossível
        }
      }

      const { data: orders, error: ordersError } = await ordersQuery
      if (ordersError) this.handleError(ordersError, 'obter estatísticas de pedidos')

      // Obter tickets vendidos dos eventos do produtor
      let tickets: any[] = []
      
      if (userId) {
        if (events?.length) {
          // Só buscar tickets se o usuário tem eventos
          let ticketsQuery = supabase
            .from('tickets')
            .select('*, batches!inner(event_id, events!inner(user_id))')
            .in('status', ['sold', 'checked_in'])
            .eq('batches.events.user_id', userId)

          const { data: ticketsData, error: ticketsError } = await ticketsQuery
          if (ticketsError) this.handleError(ticketsError, 'obter estatísticas de tickets')
          tickets = ticketsData || []
        }
        // Se usuário não tem eventos, tickets fica como array vazio
      } else {
        // Se não há filtro de usuário, buscar todos os tickets
        let ticketsQuery = supabase
          .from('tickets')
          .select('*, batches!inner(event_id, events!inner(user_id))')
          .in('status', ['sold', 'checked_in'])

        const { data: ticketsData, error: ticketsError } = await ticketsQuery
        if (ticketsError) this.handleError(ticketsError, 'obter estatísticas de tickets')
        tickets = ticketsData || []
      }

      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()

      const eventsThisMonth = events?.filter(event => {
        const eventDate = new Date(event.starts_at)
        return eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear
      }).length || 0

      // Calcular faturamento baseado no subtotal (valor para o produtor, sem taxa)
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.subtotal || 0), 0) || 0
      
      const revenueThisMonth = orders?.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear
              }).reduce((sum, order) => sum + (order.subtotal || 0), 0) || 0
      
      return {
        totalEvents: count || 0,
        totalRevenue,
        totalTickets: orders?.length || 0, // Número de vendas = número de orders
        eventsThisMonth,
        revenueThisMonth
      }
    } catch (error) {
      this.handleError(error, 'obter estatísticas')
    }
  }

  // Método para obter estatísticas de um evento específico
  async getEventStats(eventId: string): Promise<{
    participants: number;
    revenue: number;
    ticketsSold: number;
  }> {
    try {
      // Buscar tickets vendidos deste evento
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          id,
          status,
          order_id,
          batches!inner(event_id)
        `)
        .eq('batches.event_id', eventId)
        .in('status', ['sold', 'checked_in'])

      if (ticketsError) this.handleError(ticketsError, 'obter estatísticas do evento')

      // Calcular estatísticas básicas
      const ticketsSold = tickets?.length || 0
      const participants = ticketsSold // Cada ticket = 1 participante
      
      // Para calcular revenue, precisamos buscar as orders separadamente
      const orderIds = tickets?.map(ticket => ticket.order_id).filter(Boolean) || []
      let revenue = 0
      
      if (orderIds.length > 0) {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('subtotal, total, status')
          .in('id', orderIds)
          .eq('status', 'paid')

        if (!ordersError && orders) {
          revenue = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0)
          
          // Debug: log para verificar os dados
          console.log(`Evento ${eventId} - Revenue calculation:`, {
            ticketsFound: tickets?.length || 0,
            orderIds,
            ordersFound: orders?.length || 0,
            orders: orders.map(o => ({ id: o.id, subtotal: o.subtotal, total: o.total, status: o.status })),
            calculatedRevenue: revenue
          });
        }
      }

      return {
        participants,
        revenue,
        ticketsSold
      }
    } catch (error) {
      this.handleError(error, 'obter estatísticas do evento')
      // Retornar valores padrão em caso de erro
      return {
        participants: 0,
        revenue: 0,
        ticketsSold: 0
      }
    }
  }

  private mapToEvent(data: any): Event {
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      startsAt: data.starts_at,
      endsAt: data.ends_at,
      location: data.location,
      address: data.address,
      url: data.url,
      image: data.image_url || '',
      tickets: [], // Por enquanto, não carregamos tickets aqui
      batches: [], // Será preenchido pelos métodos findById e findByUrl
      capacity: data.max_capacity || 0,
      ticketsSold: 0, // Não temos tickets_sold no schema mínimo
      createdAt: data.created_at,
      updatedAt: data.created_at, // Usar created_at como fallback
      userId: data.user_id,
      status: data.status || 'published'
    }
  }
}

// Implementação do repositório de orders
export class SupabaseOrdersRepository extends BaseSupabaseRepository implements IOrdersRepository {
  
  async create(orderData: CreateOrderData): Promise<Order> {
    try {
      const insertData: any = {
        user_id: orderData.userId,
        subtotal: orderData.subtotal,
        service_fee: orderData.serviceFee || 5,
        total: orderData.total,
        status: 'pending'
      };

      // Campos opcionais do comprador
      if (orderData.buyerName) insertData.buyer_name = orderData.buyerName;
      if (orderData.buyerEmail) insertData.buyer_email = orderData.buyerEmail;
      if (orderData.buyerPhone) insertData.buyer_phone = orderData.buyerPhone;

      const { data, error } = await supabase
        .from('orders')
        .insert(insertData)
        .select()
        .single()

      if (error) this.handleError(error, 'criar pedido')
      
      return this.mapToOrder(data)
    } catch (error) {
      this.handleError(error, 'criar pedido')
    }
  }

  async findById(id: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        this.handleError(error, 'buscar pedido por ID')
      }
      
      return this.mapToOrder(data)
    } catch (error) {
      this.handleError(error, 'buscar pedido por ID')
    }
  }

  async findByUserId(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'listar pedidos do usuário')
      
      return data.map(this.mapToOrder)
    } catch (error) {
      this.handleError(error, 'listar pedidos do usuário')
    }
  }

      async update(id: string, orderData: UpdateOrderData): Promise<Order> {
      try {
        const updateData: any = {};

      // Campos de valores
      if (orderData.subtotal !== undefined) updateData.subtotal = orderData.subtotal;
      if (orderData.serviceFee !== undefined) updateData.service_fee = orderData.serviceFee;
      if (orderData.total !== undefined) updateData.total = orderData.total;
      
      // Status
      if (orderData.status !== undefined) updateData.status = orderData.status;
      
      // Dados de pagamento

      
      // Dados do comprador
      if (orderData.buyerName !== undefined) updateData.buyer_name = orderData.buyerName;
      if (orderData.buyerEmail !== undefined) updateData.buyer_email = orderData.buyerEmail;
      if (orderData.buyerPhone !== undefined) updateData.buyer_phone = orderData.buyerPhone;
      
      // Timestamps
      if (orderData.paidAt !== undefined) updateData.paid_at = orderData.paidAt;


      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) this.handleError(error, 'atualizar pedido')
      
      return this.mapToOrder(data)
    } catch (error) {
      this.handleError(error, 'atualizar pedido')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)

      if (error) this.handleError(error, 'deletar pedido')
    } catch (error) {
      this.handleError(error, 'deletar pedido')
    }
  }

  private mapToOrder(data: any): Order {
    return {
      id: data.id,
      userId: data.user_id,
      
      // Valores do pedido
      subtotal: data.subtotal,
      serviceFee: data.service_fee,
      total: data.total,
      
      // Status do pedido
      status: data.status,
      
      // Dados do comprador (prioriza dados do usuário se disponível)
      buyerName: data.buyer_name,
      buyerEmail: data.buyer_email,
      buyerPhone: data.buyer_phone,
      
      // Timestamps
      createdAt: data.created_at,
      updatedAt: data.created_at, // Usar created_at como fallback
      paidAt: data.paid_at
    };
  }

  // Método para obter order com dados completos do comprador
  async findByIdWithBuyerInfo(id: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (
            full_name,
            email,
            phone,
            cpf
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        this.handleError(error, 'buscar pedido por ID com dados do comprador')
      }
      
      // Mapear com dados consolidados do comprador
      const order = this.mapToOrder(data)
      
      // Se há dados do usuário, usar eles como fallback
      if (data.users) {
        order.buyerName = order.buyerName || data.users.full_name
        order.buyerEmail = order.buyerEmail || data.users.email
        order.buyerPhone = order.buyerPhone || data.users.phone

      }
      
      return order
    } catch (error) {
      this.handleError(error, 'buscar pedido por ID com dados do comprador')
    }
  }
}

// Implementação do repositório de tickets
export class SupabaseTicketsRepository extends BaseSupabaseRepository implements ITicketsRepository {
  
  async create(ticketData: CreateTicketData): Promise<TicketEntity> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          batch_id: ticketData.batchId,
          order_id: ticketData.orderId,
          ticket_number: ticketData.ticketNumber,
          status: ticketData.status || 'available',
          reserved_until: ticketData.reservedUntil,
          reserved_by: ticketData.reservedBy
        })
        .select()
        .single()

      if (error) this.handleError(error, 'criar ticket')
      
      return this.mapToTicket(data)
    } catch (error) {
      this.handleError(error, 'criar ticket')
    }
  }

  async findById(id: string): Promise<TicketEntity | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        this.handleError(error, 'buscar ticket por ID')
      }
      
      return this.mapToTicket(data)
    } catch (error) {
      this.handleError(error, 'buscar ticket por ID')
    }
  }

  async findByBatchId(batchId: string): Promise<TicketEntity[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true })

      if (error) this.handleError(error, 'listar tickets do lote')
      
      return data.map(this.mapToTicket)
    } catch (error) {
      this.handleError(error, 'listar tickets do lote')
    }
  }

  async findByOrderId(orderId: string): Promise<TicketEntity[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      if (error) this.handleError(error, 'listar tickets do pedido')
      
      return data.map(this.mapToTicket)
    } catch (error) {
      this.handleError(error, 'listar tickets do pedido')
    }
  }

  async update(id: string, ticketData: Partial<TicketEntity>): Promise<TicketEntity> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (ticketData.batchId !== undefined) updateData.batch_id = ticketData.batchId;
      if (ticketData.orderId !== undefined) updateData.order_id = ticketData.orderId;
      if (ticketData.ticketNumber !== undefined) updateData.ticket_number = ticketData.ticketNumber;
      if (ticketData.status !== undefined) updateData.status = ticketData.status;
      if (ticketData.reservedUntil !== undefined) updateData.reserved_until = ticketData.reservedUntil;
      if (ticketData.reservedBy !== undefined) updateData.reserved_by = ticketData.reservedBy;

      const { data, error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) this.handleError(error, 'atualizar ticket')
      
      return this.mapToTicket(data)
    } catch (error) {
      this.handleError(error, 'atualizar ticket')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id)

      if (error) this.handleError(error, 'deletar ticket')
    } catch (error) {
      this.handleError(error, 'deletar ticket')
    }
  }

  async reserveTickets(batchId: string, quantity: number, userId: string | null): Promise<TicketEntity[]> {
    try {
      // Buscar tickets existentes disponíveis
      const { data: existingTickets, error: findError } = await supabase
        .from('tickets')
        .select('*')
        .eq('batch_id', batchId)
        .eq('status', 'available')
        .limit(quantity)

      if (findError) this.handleError(findError, 'buscar tickets disponíveis')

      let ticketsToReserve: any[] = [];

      if (existingTickets && existingTickets.length >= quantity) {
        // Usar tickets existentes
        ticketsToReserve = existingTickets.slice(0, quantity);
      } else {
        // Criar novos tickets se não houver suficientes
        const ticketsToCreate = [];
        const existingCount = existingTickets ? existingTickets.length : 0;
        const needToCreate = quantity - existingCount;

        for (let i = 0; i < needToCreate; i++) {
          ticketsToCreate.push({
            batch_id: batchId,
            ticket_number: `TKT${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            status: 'available'
          });
        }

        if (ticketsToCreate.length > 0) {
          const { data: newTickets, error: createError } = await supabase
            .from('tickets')
            .insert(ticketsToCreate)
            .select();

          if (createError) this.handleError(createError, 'criar tickets para reserva');

          ticketsToReserve = [...(existingTickets || []), ...(newTickets || [])];
        } else {
          ticketsToReserve = existingTickets || [];
        }
      }

      if (ticketsToReserve.length < quantity) {
        throw new Error('Não foi possível criar tickets suficientes para a reserva');
      }

      // No schema mínimo, não há mais reservas temporárias
      // Retornar os tickets disponíveis diretamente
      return ticketsToReserve.map(this.mapToTicket)
    } catch (error) {
      this.handleError(error, 'reservar tickets')
    }
  }

  async assignTicketsToOrder(ticketIds: string[], orderId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          order_id: orderId,
          status: 'sold'
        })
        .in('id', ticketIds)

      if (error) this.handleError(error, 'atribuir tickets ao pedido')
    } catch (error) {
      this.handleError(error, 'atribuir tickets ao pedido')
    }
  }

  private mapToTicket(data: any): TicketEntity {
    return {
      id: data.id,
      batchId: data.batch_id,
      orderId: data.order_id,
      ticketNumber: data.ticket_number,
      status: data.status,
      qrCode: data.qr_code,
      holderName: data.holder_name,
      holderEmail: data.holder_email,
      createdAt: data.created_at
    };
  }
}

// Implementação do repositório de vendas
export class SupabaseSalesRepository extends BaseSupabaseRepository {
  
  async createSale(saleData: CreateSaleData): Promise<Sale> {
    try {
      // No schema mínimo, não há mais tabela 'sales'
      // As vendas são gerenciadas através de 'orders' e 'order_items'
      throw new Error('Sistema de vendas não disponível no schema mínimo. Use orders e order_items.');
    } catch (error) {
      this.handleError(error, 'criar venda')
    }
  }

  async findSaleById(id: string): Promise<Sale | null> {
    try {
      // No schema mínimo, não há mais tabela 'sales'
      throw new Error('Sistema de vendas não disponível no schema mínimo. Use orders e order_items.');
    } catch (error) {
      this.handleError(error, 'buscar venda por ID')
    }
  }

  async findSalesByEventId(eventId: string): Promise<Sale[]> {
    try {
      // No schema mínimo, não há mais tabela 'sales'
      throw new Error('Sistema de vendas não disponível no schema mínimo. Use orders e order_items.');
    } catch (error) {
      this.handleError(error, 'buscar vendas por evento')
    }
  }

  async findSalesByUserId(userId: string): Promise<Sale[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            *,
            tickets (*)
          )
        `)
        .eq('user_id', userId)

      if (error) this.handleError(error, 'buscar vendas por usuário')
      
      return data.map(this.mapToSale)
    } catch (error) {
      this.handleError(error, 'buscar vendas por usuário')
    }
  }

  async getSalesReport(options: SalesReportOptions): Promise<SalesReport> {
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .gte('created_at', options.dateFrom)
        .lte('created_at', options.dateTo)

      if (options.eventId) {
        query = query.eq('event_id', options.eventId)
      }

      if (options.userId) {
        query = query.eq('user_id', options.userId)
      }

      const { data: sales, error } = await query
      if (error) this.handleError(error, 'gerar relatório de vendas')

      const totalSales = sales?.length || 0
      const totalRevenue = sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0

      // Para obter total de tickets, precisamos buscar os itens
      let itemsQuery = supabase
        .from('sale_items')
        .select('quantity, sales!inner(created_at)')
        .gte('sales.created_at', options.dateFrom)
        .lte('sales.created_at', options.dateTo)

      if (options.eventId) {
        itemsQuery = itemsQuery.eq('sales.event_id', options.eventId)
      }

      if (options.userId) {
        itemsQuery = itemsQuery.eq('sales.user_id', options.userId)
      }

      const { data: items, error: itemsError } = await itemsQuery
      if (itemsError) this.handleError(itemsError, 'obter itens para relatório')

      const totalTickets = items?.reduce((sum, item) => sum + item.quantity, 0) || 0

      // Agrupamento por período
      let breakdown: Array<{
        period: string;
        sales: number;
        revenue: number;
        tickets: number;
      }> = []

      if (options.groupBy === 'day' && sales) {
        const groupedByDay = sales.reduce((acc, sale) => {
          const day = sale.created_at.split('T')[0]
          if (!acc[day]) {
            acc[day] = { sales: 0, revenue: 0, tickets: 0 }
          }
          acc[day].sales++
          acc[day].revenue += sale.total_amount
          return acc
        }, {} as Record<string, { sales: number; revenue: number; tickets: number }>)

        breakdown = Object.entries(groupedByDay).map(([day, data]) => ({
          period: day,
          sales: (data as any).sales,
          revenue: (data as any).revenue,
          tickets: (data as any).tickets
        }))
      }

      return {
        period: `${options.dateFrom} a ${options.dateTo}`,
        totalSales,
        totalRevenue,
        totalTickets,
        breakdown
      }
    } catch (error) {
      this.handleError(error, 'gerar relatório de vendas')
    }
  }

  async getRevenueStats(userId?: string): Promise<RevenueStats> {
    try {
      let query = supabase
        .from('sales')
        .select('total_amount, created_at')

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: sales, error } = await query
      if (error) this.handleError(error, 'obter estatísticas de receita')

      const totalRevenue = sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0

      // Receita mensal
      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()

      const monthlyRevenue = sales?.filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear
      }).reduce((sum, sale) => sum + sale.total_amount, 0) || 0

      // Preço médio do ticket
      const { data: items, error: itemsError } = await supabase
        .from('sale_items')
        .select('quantity, price')

      if (itemsError) this.handleError(itemsError, 'obter itens para estatísticas')

      const totalTickets = items?.reduce((sum, item) => sum + item.quantity, 0) || 0
      const totalItemsValue = items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
      const averageTicketPrice = totalTickets > 0 ? totalItemsValue / totalTickets : 0

      // Eventos com melhor performance
      const { data: eventPerformance, error: perfError } = await supabase
        .from('sales')
        .select(`
          total_amount,
          events!inner(title)
        `)

      if (perfError) this.handleError(perfError, 'obter performance dos eventos')

      const groupedEvents = eventPerformance
        ?.reduce((acc, sale) => {
          const eventTitle = (sale.events as any)?.title || 'Evento Desconhecido'
          if (!acc[eventTitle]) {
            acc[eventTitle] = { revenue: 0, ticketsSold: 0 }
          }
          acc[eventTitle].revenue += sale.total_amount
          return acc
        }, {} as Record<string, { revenue: number; ticketsSold: number }>) || {}

      const topPerformingEvents = Object.entries(groupedEvents).map(([title, data]) => ({
        eventId: title, // Simplificado para o exemplo
        title,
        revenue: (data as any).revenue,
        ticketsSold: (data as any).ticketsSold
      }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      return {
        totalRevenue,
        monthlyRevenue,
        averageTicketPrice,
        topPerformingEvents
      }
    } catch (error) {
      this.handleError(error, 'obter estatísticas de receita')
    }
  }

  private mapToSale(data: any): Sale {
    // No schema mínimo, não há mais tabela 'sales'
    throw new Error('Sistema de vendas não disponível no schema mínimo. Use orders e order_items.');
  }
}

export class SupabaseBatchesRepository extends BaseSupabaseRepository implements IBatchesRepository {
  async create(batch: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>): Promise<Batch> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .insert({
          event_id: batch.eventId,
          title: batch.title,
          description: batch.description,
          price: batch.price,
          quantity: batch.quantity,
          is_active: batch.isActive ?? true,
          sale_starts_at: batch.saleStartsAt,
          sale_ends_at: batch.saleEndsAt
        })
        .select()
        .single();

      if (error) this.handleError(error, 'criar lote');
      
      return this.mapToBatch(data);
    } catch (error) {
      this.handleError(error, 'criar lote');
    }
  }

  async findById(id: string): Promise<Batch | null> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        this.handleError(error, 'buscar lote por ID');
      }
      return this.mapToBatch(data);
    } catch (error) {
      this.handleError(error, 'buscar lote por ID');
    }
  }

  async findByEventId(eventId: string): Promise<Batch[]> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) this.handleError(error, 'listar lotes do evento');
      
      const batches = data.map(this.mapToBatch);
      return batches;
    } catch (error) {
      this.handleError(error, 'listar lotes do evento');
    }
  }

  async update(id: string, batch: Partial<Batch>): Promise<Batch> {
    try {
      const updateData: any = {};
      if (batch.title !== undefined) updateData.title = batch.title;
      if (batch.description !== undefined) updateData.description = batch.description;
      if (batch.price !== undefined) updateData.price = batch.price;
      if (batch.quantity !== undefined) updateData.quantity = batch.quantity;
      if (batch.isActive !== undefined) updateData.is_active = batch.isActive;
      if (batch.saleStartsAt !== undefined) updateData.sale_starts_at = batch.saleStartsAt;
      if (batch.saleEndsAt !== undefined) updateData.sale_ends_at = batch.saleEndsAt;

      const { data, error } = await supabase
        .from('batches')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) this.handleError(error, 'atualizar lote');
      return this.mapToBatch(data);
    } catch (error) {
      this.handleError(error, 'atualizar lote');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id);

      if (error) this.handleError(error, 'deletar lote');
    } catch (error) {
      this.handleError(error, 'deletar lote');
    }
  }

  async updateBatches(eventId: string, batches: Batch[]): Promise<void> {
    try {
      // Buscar batches existentes
      const { data: existingBatches, error: fetchError } = await supabase
        .from('batches')
        .select('id, title, quantity')
        .eq('event_id', eventId);

      if (fetchError) this.handleError(fetchError, 'buscar batches existentes');

      // Criar mapa dos batches existentes por título
      const existingBatchesMap = new Map();
      if (existingBatches) {
        existingBatches.forEach(batch => {
          existingBatchesMap.set(batch.title, batch);
        });
      }

      // Atualizar ou criar batches preservando total_tickets vendidos
      for (const batch of batches) {
        const existingBatch = existingBatchesMap.get(batch.title);
        
        if (existingBatch) {
          // Atualizar batch existente
          const { error: updateError } = await supabase
            .from('batches')
            .update({
              title: batch.title,
              description: batch.description,
              price: batch.price,
              quantity: batch.quantity,
              is_active: batch.isActive ?? true,
              sale_starts_at: batch.saleStartsAt,
              sale_ends_at: batch.saleEndsAt
            })
            .eq('id', existingBatch.id);

          if (updateError) this.handleError(updateError, 'atualizar lote existente');
        } else {
          // Criar novo batch
          const { error: insertError } = await supabase
            .from('batches')
            .insert({
              event_id: eventId,
              title: batch.title,
              description: batch.description,
              price: batch.price,
              quantity: batch.quantity,
              is_active: batch.isActive ?? true,
              sale_starts_at: batch.saleStartsAt,
              sale_ends_at: batch.saleEndsAt
            });

          if (insertError) this.handleError(insertError, 'criar novo lote');
        }
      }

      // Deletar batches que não existem mais
      const currentBatchTitles = batches.map(b => b.title);
      const batchesToDelete = existingBatches?.filter(b => !currentBatchTitles.includes(b.title)) || [];
      
      for (const batchToDelete of batchesToDelete) {
        const { error: deleteError } = await supabase
          .from('batches')
          .delete()
          .eq('id', batchToDelete.id);

        if (deleteError) this.handleError(deleteError, 'deletar lote removido');
      }
    } catch (error) {
      this.handleError(error, 'atualizar lotes do evento');
    }
  }

  private mapToBatch(data: any): Batch {
    return {
      id: data.id,
      eventId: data.event_id,
      title: data.title,
      description: data.description,
      price: data.price,
      quantity: data.quantity,
      isActive: data.is_active ?? true,
      saleStartsAt: data.sale_starts_at,
      saleEndsAt: data.sale_ends_at,
      createdAt: data.created_at,
      updatedAt: data.created_at // Usar created_at como fallback
    };
  }
}

// Instâncias singleton dos repositórios
export const eventsRepository = new SupabaseEventsRepository()
export const ticketsRepository = new SupabaseTicketsRepository()
export const batchesRepository = new SupabaseBatchesRepository()
export const salesRepository = new SupabaseSalesRepository()
export const ordersRepository = new SupabaseOrdersRepository()
