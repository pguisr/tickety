import { 
  IEventsRepository, 
  ITicketsRepository, 
  ISalesRepository,
  CreateEventData,
  CreateTicketData,
  CreateSaleData,
  FindEventsOptions,
  EventsResponse,
  EventStats,
  TicketQuantities,
  ReservationResult,
  AvailabilityCheck,
  SalesReportOptions,
  SalesReport,
  RevenueStats
} from '@/types';
import { Event, Ticket, Sale, TicketReservation } from '@/types';

// Chaves para localStorage
const STORAGE_KEYS = {
  EVENTS: 'tickety_events',
  TICKETS: 'tickety_tickets',
  SALES: 'tickety_sales',
  RESERVATIONS: 'tickety_reservations',
  METADATA: 'tickety_metadata'
};

// Classe base para operações com localStorage
abstract class BaseLocalStorageRepository {
  protected getItem<T>(key: string): T[] {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error(`Erro ao carregar ${key} do localStorage:`, error);
      return [];
    }
  }

  protected setItem<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Erro ao salvar ${key} no localStorage:`, error);
      throw new Error(`Falha ao salvar ${key}`);
    }
  }

  protected generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Implementação do repositório de eventos
export class LocalStorageEventsRepository extends BaseLocalStorageRepository implements IEventsRepository {
  
  async create(eventData: CreateEventData): Promise<Event> {
    const events = this.getItem<Event>(STORAGE_KEYS.EVENTS);
    
    const newEvent: Event = {
      id: this.generateId(),
      title: eventData.title,
      subtitle: eventData.subtitle || '',
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      address: eventData.address,
      url: eventData.url,
      image: eventData.image || '',
      tickets: [],
      capacity: eventData.capacity || 0,
      sold: 0,
      rating: 0,
      reviews: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: eventData.userId
    };
    
    events.push(newEvent);
    this.setItem(STORAGE_KEYS.EVENTS, events);
    
    return newEvent;
  }

  async findById(id: string): Promise<Event | null> {
    const events = this.getItem<Event>(STORAGE_KEYS.EVENTS);
    return events.find(event => event.id === id) || null;
  }

  async findByUrl(url: string): Promise<Event | null> {
    const events = this.getItem<Event>(STORAGE_KEYS.EVENTS);
    return events.find(event => event.url === url) || null;
  }

  async update(id: string, eventData: Partial<CreateEventData>): Promise<Event> {
    const events = this.getItem<Event>(STORAGE_KEYS.EVENTS);
    const eventIndex = events.findIndex(event => event.id === id);
    
    if (eventIndex === -1) {
      throw new Error('Evento não encontrado');
    }
    
    const updatedEvent = {
      ...events[eventIndex],
      ...eventData,
      updatedAt: new Date().toISOString()
    };
    
    events[eventIndex] = updatedEvent;
    this.setItem(STORAGE_KEYS.EVENTS, events);
    
    return updatedEvent;
  }

  async delete(id: string): Promise<void> {
    const events = this.getItem<Event>(STORAGE_KEYS.EVENTS);
    const filteredEvents = events.filter(event => event.id !== id);
    this.setItem(STORAGE_KEYS.EVENTS, filteredEvents);
  }

  async findAll(options: FindEventsOptions = {}): Promise<EventsResponse> {
    let events = this.getItem<Event>(STORAGE_KEYS.EVENTS);
    
    // Aplicar filtros
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      events = events.filter(event => 
        event.title.toLowerCase().includes(searchLower) ||
        event.subtitle.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower)
      );
    }
    
    if (options.dateFrom) {
      events = events.filter(event => event.date >= options.dateFrom!);
    }
    
    if (options.dateTo) {
      events = events.filter(event => event.date <= options.dateTo!);
    }
    
    if (options.location) {
      events = events.filter(event => 
        event.location.toLowerCase().includes(options.location!.toLowerCase())
      );
    }
    
    // Aplicar ordenação
    if (options.sortBy) {
      events.sort((a, b) => {
        const aValue = a[options.sortBy!] || '';
        const bValue = b[options.sortBy!] || '';
        
        if (options.sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });
    }
    
    // Aplicar paginação
    const page = options.page || 1;
    const limit = options.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = events.slice(startIndex, endIndex);
    
    return {
      events: paginatedEvents,
      total: events.length,
      page,
      limit,
      hasMore: endIndex < events.length
    };
  }

  async findByUserId(userId: string, options: FindEventsOptions = {}): Promise<EventsResponse> {
    const events = this.getItem<Event>(STORAGE_KEYS.EVENTS);
    const userEvents = events.filter(event => event.userId === userId);
    
    // Aplicar as mesmas opções de filtro e paginação
    return this.findAll({ ...options, userId });
  }

  async getStats(userId?: string): Promise<EventStats> {
    const events = this.getItem<Event>(STORAGE_KEYS.EVENTS);
    const sales = this.getItem<Sale>(STORAGE_KEYS.SALES);
    
    let filteredEvents = events;
    if (userId) {
      filteredEvents = events.filter(event => event.userId === userId);
    }
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const eventsThisMonth = filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear;
    }).length;
    
    const revenueThisMonth = sales
      .filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
      })
      .reduce((total, sale) => total + sale.totalAmount, 0);
    
    const totalRevenue = sales.reduce((total, sale) => total + sale.totalAmount, 0);
    const totalTickets = sales.reduce((total, sale) => 
      total + sale.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0), 0
    );
    
    const averageRating = filteredEvents.length > 0 
      ? filteredEvents.reduce((sum, event) => sum + (event.rating || 0), 0) / filteredEvents.length
      : 0;
    
    return {
      totalEvents: filteredEvents.length,
      totalRevenue,
      totalTickets,
      averageRating,
      eventsThisMonth,
      revenueThisMonth
    };
  }

  async createMany(eventsData: CreateEventData[]): Promise<Event[]> {
    const createdEvents: Event[] = [];
    
    for (const eventData of eventsData) {
      const event = await this.create(eventData);
      createdEvents.push(event);
    }
    
    return createdEvents;
  }

  async updateMany(updates: Array<{ id: string; data: Partial<CreateEventData> }>): Promise<Event[]> {
    const updatedEvents: Event[] = [];
    
    for (const update of updates) {
      const event = await this.update(update.id, update.data);
      updatedEvents.push(event);
    }
    
    return updatedEvents;
  }

  async deleteMany(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }
}

// Implementação do repositório de tickets
export class LocalStorageTicketsRepository extends BaseLocalStorageRepository implements ITicketsRepository {
  
  async create(ticketData: CreateTicketData): Promise<Ticket> {
    const tickets = this.getItem<Ticket>(STORAGE_KEYS.TICKETS);
    
    const newTicket: Ticket = {
      id: this.generateId(),
      name: ticketData.name,
      price: ticketData.price,
      quantity: ticketData.quantity,
      available: ticketData.available
    };
    
    tickets.push(newTicket);
    this.setItem(STORAGE_KEYS.TICKETS, tickets);
    
    return newTicket;
  }

  async findById(id: string): Promise<Ticket | null> {
    const tickets = this.getItem<Ticket>(STORAGE_KEYS.TICKETS);
    return tickets.find(ticket => ticket.id === id) || null;
  }

  async update(id: string, ticketData: Partial<CreateTicketData>): Promise<Ticket> {
    const tickets = this.getItem<Ticket>(STORAGE_KEYS.TICKETS);
    const ticketIndex = tickets.findIndex(ticket => ticket.id === id);
    
    if (ticketIndex === -1) {
      throw new Error('Ticket não encontrado');
    }
    
    const updatedTicket = {
      ...tickets[ticketIndex],
      ...ticketData
    };
    
    tickets[ticketIndex] = updatedTicket;
    this.setItem(STORAGE_KEYS.TICKETS, tickets);
    
    return updatedTicket;
  }

  async delete(id: string): Promise<void> {
    const tickets = this.getItem<Ticket>(STORAGE_KEYS.TICKETS);
    const filteredTickets = tickets.filter(ticket => ticket.id !== id);
    this.setItem(STORAGE_KEYS.TICKETS, filteredTickets);
  }

  async findByEventId(eventId: string): Promise<Ticket[]> {
    // Para localStorage, precisamos relacionar tickets com eventos
    // Esta é uma limitação que será resolvida com banco de dados
    const tickets = this.getItem<Ticket>(STORAGE_KEYS.TICKETS);
    // Por enquanto, retornamos todos os tickets
    return tickets;
  }

  async updateQuantity(id: string, quantity: number): Promise<Ticket> {
    const tickets = this.getItem<Ticket>(STORAGE_KEYS.TICKETS);
    const ticketIndex = tickets.findIndex(ticket => ticket.id === id);
    
    if (ticketIndex === -1) {
      throw new Error('Ticket não encontrado');
    }
    
    tickets[ticketIndex].quantity = quantity;
    this.setItem(STORAGE_KEYS.TICKETS, tickets);
    
    return tickets[ticketIndex];
  }

  async reserveTickets(eventId: string, ticketQuantities: TicketQuantities): Promise<ReservationResult> {
    const reservations = this.getItem<TicketReservation>(STORAGE_KEYS.RESERVATIONS);
    
    // Verificar disponibilidade
    const availabilityCheck = await this.checkAvailability(eventId, ticketQuantities);
    
    if (!availabilityCheck.available) {
      return {
        reservationId: '',
        success: false,
        reservedTickets: [],
        errors: availabilityCheck.errors
      };
    }
    
    // Criar reserva
    const reservation: TicketReservation = {
      id: this.generateId(),
      eventId,
      userId: 'anonymous', // Será substituído por autenticação real
      tickets: Object.entries(ticketQuantities).map(([ticketId, quantity]) => ({
        ticketId,
        quantity
      })),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutos
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    reservations.push(reservation);
    this.setItem(STORAGE_KEYS.RESERVATIONS, reservations);
    
    return {
      reservationId: reservation.id,
      success: true,
      reservedTickets: reservation.tickets.map(ticket => ({
        ticketId: ticket.ticketId,
        quantity: ticket.quantity,
        expiresAt: reservation.expiresAt
      }))
    };
  }

  async releaseReservation(reservationId: string): Promise<void> {
    const reservations = this.getItem<TicketReservation>(STORAGE_KEYS.RESERVATIONS);
    const filteredReservations = reservations.filter(res => res.id !== reservationId);
    this.setItem(STORAGE_KEYS.RESERVATIONS, filteredReservations);
  }

  async checkAvailability(eventId: string, ticketQuantities: TicketQuantities): Promise<AvailabilityCheck> {
    const tickets = this.getItem<Ticket>(STORAGE_KEYS.TICKETS);
    const reservations = this.getItem<TicketReservation>(STORAGE_KEYS.RESERVATIONS);
    
    const availableTickets: Array<{
      ticketId: string;
      availableQuantity: number;
      requestedQuantity: number;
    }> = [];
    
    const errors: string[] = [];
    
    for (const [ticketId, requestedQuantity] of Object.entries(ticketQuantities)) {
      const ticket = tickets.find(t => t.id === ticketId);
      
      if (!ticket) {
        errors.push(`Ticket ${ticketId} não encontrado`);
        continue;
      }
      
      // Calcular quantidade disponível (total - reservas ativas)
      const activeReservations = reservations
        .filter(r => r.status === 'active' && r.eventId === eventId)
        .reduce((sum, r) => {
          const ticketReservation = r.tickets.find(t => t.ticketId === ticketId);
          return sum + (ticketReservation?.quantity || 0);
        }, 0);
      
      const availableQuantity = ticket.quantity - activeReservations;
      
      if (requestedQuantity > availableQuantity) {
        errors.push(`Quantidade insuficiente para ${ticket.name}`);
      }
      
      availableTickets.push({
        ticketId,
        availableQuantity,
        requestedQuantity
      });
    }
    
    return {
      available: errors.length === 0,
      availableTickets,
      errors
    };
  }
}

// Implementação do repositório de vendas
export class LocalStorageSalesRepository extends BaseLocalStorageRepository implements ISalesRepository {
  
  async createSale(saleData: CreateSaleData): Promise<Sale> {
    const sales = this.getItem<Sale>(STORAGE_KEYS.SALES);
    
    const newSale: Sale = {
      id: this.generateId(),
      eventId: saleData.eventId,
      userId: saleData.userId,
      tickets: saleData.tickets,
      totalAmount: saleData.totalAmount,
      paymentStatus: saleData.paymentStatus,
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    sales.push(newSale);
    this.setItem(STORAGE_KEYS.SALES, sales);
    
    return newSale;
  }

  async findSaleById(id: string): Promise<Sale | null> {
    const sales = this.getItem<Sale>(STORAGE_KEYS.SALES);
    return sales.find(sale => sale.id === id) || null;
  }

  async findSalesByEventId(eventId: string): Promise<Sale[]> {
    const sales = this.getItem<Sale>(STORAGE_KEYS.SALES);
    return sales.filter(sale => sale.eventId === eventId);
  }

  async findSalesByUserId(userId: string): Promise<Sale[]> {
    const sales = this.getItem<Sale>(STORAGE_KEYS.SALES);
    return sales.filter(sale => sale.userId === userId);
  }

  async getSalesReport(options: SalesReportOptions): Promise<SalesReport> {
    const sales = this.getItem<Sale>(STORAGE_KEYS.SALES);
    
    // Filtrar por período
    let filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      const fromDate = new Date(options.dateFrom);
      const toDate = new Date(options.dateTo);
      return saleDate >= fromDate && saleDate <= toDate;
    });
    
    // Filtrar por evento se especificado
    if (options.eventId) {
      filteredSales = filteredSales.filter(sale => sale.eventId === options.eventId);
    }
    
    // Filtrar por usuário se especificado
    if (options.userId) {
      filteredSales = filteredSales.filter(sale => sale.userId === options.userId);
    }
    
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTickets = filteredSales.reduce((sum, sale) => 
      sum + sale.tickets.reduce((ticketSum, ticket) => ticketSum + ticket.quantity, 0), 0
    );
    
    // Agrupamento por período
    let breakdown: Array<{
      period: string;
      sales: number;
      revenue: number;
      tickets: number;
    }> = [];
    
    if (options.groupBy === 'day') {
      // Agrupar por dia
      const groupedByDay = filteredSales.reduce((acc, sale) => {
        const day = sale.createdAt.split('T')[0];
        if (!acc[day]) {
          acc[day] = { sales: 0, revenue: 0, tickets: 0 };
        }
        acc[day].sales++;
        acc[day].revenue += sale.totalAmount;
        acc[day].tickets += sale.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
        return acc;
      }, {} as Record<string, { sales: number; revenue: number; tickets: number }>);
      
      breakdown = Object.entries(groupedByDay).map(([day, data]) => ({
        period: day,
        ...data
      }));
    }
    
    return {
      period: `${options.dateFrom} a ${options.dateTo}`,
      totalSales,
      totalRevenue,
      totalTickets,
      breakdown
    };
  }

  async getRevenueStats(userId?: string): Promise<RevenueStats> {
    const sales = this.getItem<Sale>(STORAGE_KEYS.SALES);
    const events = this.getItem<Event>(STORAGE_KEYS.EVENTS);
    
    let filteredSales = sales;
    if (userId) {
      filteredSales = sales.filter(sale => sale.userId === userId);
    }
    
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    // Receita mensal
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const monthlyRevenue = filteredSales
      .filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
      })
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    // Preço médio do ticket
    const totalTickets = filteredSales.reduce((sum, sale) => 
      sum + sale.tickets.reduce((ticketSum, ticket) => ticketSum + ticket.quantity, 0), 0
    );
    
    const averageTicketPrice = totalTickets > 0 ? totalRevenue / totalTickets : 0;
    
    // Eventos com melhor performance
    const eventPerformance = events.map(event => {
      const eventSales = filteredSales.filter(sale => sale.eventId === event.id);
      const revenue = eventSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const ticketsSold = eventSales.reduce((sum, sale) => 
        sum + sale.tickets.reduce((ticketSum, ticket) => ticketSum + ticket.quantity, 0), 0
      );
      
      return {
        eventId: event.id,
        title: event.title,
        revenue,
        ticketsSold
      };
    });
    
    const topPerformingEvents = eventPerformance
      .filter(event => event.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    return {
      totalRevenue,
      monthlyRevenue,
      averageTicketPrice,
      topPerformingEvents
    };
  }
}

// Instâncias singleton dos repositórios
export const eventsRepository = new LocalStorageEventsRepository();
export const ticketsRepository = new LocalStorageTicketsRepository();
export const salesRepository = new LocalStorageSalesRepository();
