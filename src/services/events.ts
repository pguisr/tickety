import { Event, EventFormData, Ticket } from '@/types';

// Tipos para o serviço
export interface CreateEventRequest {
  event: EventFormData;
  userId: string;
}

export interface UpdateEventRequest {
  eventId: string;
  event: Partial<EventFormData>;
  userId: string;
}

export interface DeleteEventRequest {
  eventId: string;
  userId: string;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

// Configurações do serviço
const EVENTS_STORAGE_KEY = 'tickety_events';
const EVENTS_METADATA_KEY = 'tickety_events_metadata';

// Interface para metadados dos eventos
interface EventsMetadata {
  lastUpdated: string;
  totalEvents: number;
  version: string;
}

// Classe principal do serviço de eventos
class EventsService {
  private static instance: EventsService;
  
  private constructor() {}
  
  public static getInstance(): EventsService {
    if (!EventsService.instance) {
      EventsService.instance = new EventsService();
    }
    return EventsService.instance;
  }

  // Gera ID único para eventos
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Gera ID único para tickets
  private generateTicketId(): string {
    return `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Obtém todos os eventos do localStorage
  private getEventsFromStorage(): Event[] {
    try {
      const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar eventos do localStorage:', error);
      return [];
    }
  }

  // Salva eventos no localStorage
  private saveEventsToStorage(events: Event[]): void {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      
      // Atualiza metadados
      const metadata: EventsMetadata = {
        lastUpdated: new Date().toISOString(),
        totalEvents: events.length,
        version: '1.0.0'
      };
      localStorage.setItem(EVENTS_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Erro ao salvar eventos no localStorage:', error);
      throw new Error('Falha ao salvar evento');
    }
  }

  // Valida dados do evento
  private validateEvent(event: EventFormData): void {
    if (!event.title?.trim()) {
      throw new Error('Título do evento é obrigatório');
    }
    
    if (!event.date) {
      throw new Error('Data do evento é obrigatória');
    }
    
    if (!event.time) {
      throw new Error('Horário do evento é obrigatório');
    }
    
    if (!event.location?.trim()) {
      throw new Error('Local do evento é obrigatório');
    }
    
    if (!event.address?.trim()) {
      throw new Error('Endereço do evento é obrigatório');
    }

    // Valida tickets (opcional)
    // if (event.tickets.length === 0) {
    //   throw new Error('Pelo menos um ingresso deve ser configurado');
    // }

    for (const ticket of event.tickets) {
      if (!ticket.name?.trim()) {
        throw new Error('Nome do ingresso é obrigatório');
      }
      
      if (ticket.price < 0) {
        throw new Error('Preço do ingresso não pode ser negativo');
      }
      
      if (ticket.quantity < 0) {
        throw new Error('Quantidade do ingresso não pode ser negativa');
      }
    }
  }

  // Normaliza dados do evento para formato padrão
  private normalizeEvent(eventData: EventFormData, userId: string): Event {
    return {
      id: this.generateEventId(),
      title: eventData.title.trim(),
      subtitle: eventData.subtitle?.trim() || '',
      date: eventData.date,
      time: eventData.time,
      location: eventData.location.trim(),
      address: eventData.address.trim(),
      url: eventData.url?.trim() || this.generateUrlFromTitle(eventData.title),
      image: eventData.image || '/placeholder.svg',
      tickets: eventData.tickets.map(ticket => ({
        ...ticket,
        id: ticket.id || this.generateTicketId(),
        name: ticket.name.trim(),
        price: Number(ticket.price) || 0,
        quantity: Number(ticket.quantity) || 0,
        available: Boolean(ticket.available)
      })),
      capacity: eventData.tickets.reduce((sum, ticket) => sum + (Number(ticket.quantity) || 0), 0),
      sold: 0,
      rating: 0,
      reviews: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: userId
    };
  }

  // Gera URL amigável baseada no título
  private generateUrlFromTitle(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // CRUD Operations

  // Criar evento
  public async createEvent(request: CreateEventRequest): Promise<Event> {
    try {
      this.validateEvent(request.event);
      
      const events = this.getEventsFromStorage();
      const newEvent = this.normalizeEvent(request.event, request.userId);
      
      // Verifica se URL já existe
      const urlExists = events.some(event => event.url === newEvent.url);
      if (urlExists) {
        throw new Error(`URL "${newEvent.url}" já está em uso. Escolha uma nova URL.`);
      }
      
      events.push(newEvent);
      this.saveEventsToStorage(events);
      
      return newEvent;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }

  // Obter evento por ID
  public async getEventById(eventId: string): Promise<Event | null> {
    try {
      const events = this.getEventsFromStorage();
      return events.find(event => event.id === eventId) || null;
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      return null;
    }
  }

  // Obter evento por URL
  public async getEventByUrl(url: string): Promise<Event | null> {
    try {
      const events = this.getEventsFromStorage();
      return events.find(event => event.url === url) || null;
    } catch (error) {
      console.error('Erro ao buscar evento por URL:', error);
      return null;
    }
  }

  // Sugerir URLs alternativas disponíveis
  public suggestAvailableUrls(baseUrl: string): string[] {
    try {
      const events = this.getEventsFromStorage();
      const suggestions: string[] = [];
      
      // Remove caracteres especiais e espaços para gerar sugestões
      const cleanBase = baseUrl.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      // Sugestões com sufixos populares
      const suffixes = ['-2024', '-novo', '-evento', '-show', '-festival', '-live', '-especial'];
      
      for (const suffix of suffixes) {
        const suggestion = `${cleanBase}${suffix}`;
        const exists = events.some(event => event.url === suggestion);
        if (!exists) {
          suggestions.push(suggestion);
        }
      }
      
      // Sugestões com números sequenciais
      for (let i = 1; i <= 3; i++) {
        const suggestion = `${cleanBase}-${i}`;
        const exists = events.some(event => event.url === suggestion);
        if (!exists) {
          suggestions.push(suggestion);
        }
      }
      
      // Sugestões com variações do nome base
      const variations = [`${cleanBase}-event`, `${cleanBase}-party`, `${cleanBase}-concert`];
      for (const variation of variations) {
        const exists = events.some(event => event.url === variation);
        if (!exists) {
          suggestions.push(variation);
        }
      }
      
      // Retorna as melhores sugestões (prioriza sufixos populares)
      return suggestions.slice(0, 6);
    } catch (error) {
      console.error('Erro ao gerar sugestões de URL:', error);
      return [];
    }
  }

  // Listar eventos com paginação
  public async getEvents(options: {
    page?: number;
    limit?: number;
    userId?: string;
    search?: string;
  } = {}): Promise<EventsResponse> {
    try {
      const { page = 1, limit = 10, userId, search } = options;
      let events = this.getEventsFromStorage();
      
      // Filtra por usuário se especificado
      if (userId) {
        events = events.filter(event => event.userId === userId);
      }
      
      // Filtra por busca se especificado
      if (search) {
        const searchLower = search.toLowerCase();
        events = events.filter(event => 
          event.title.toLowerCase().includes(searchLower) ||
          event.subtitle.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower)
        );
      }
      
      // Ordena por data de criação (mais recentes primeiro)
      events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Aplica paginação
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedEvents = events.slice(startIndex, endIndex);
      
      return {
        events: paginatedEvents,
        total: events.length,
        page,
        limit
      };
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      return {
        events: [],
        total: 0,
        page: 1,
        limit: 10
      };
    }
  }

  // Atualizar evento
  public async updateEvent(request: UpdateEventRequest): Promise<Event> {
    try {
      const events = this.getEventsFromStorage();
      const eventIndex = events.findIndex(event => event.id === request.eventId);
      
      if (eventIndex === -1) {
        throw new Error('Evento não encontrado');
      }
      
      const existingEvent = events[eventIndex];
      const updatedEvent: Event = {
        ...existingEvent,
        ...request.event,
        id: request.eventId, // Mantém o ID original
        updatedAt: new Date().toISOString(),
        tickets: request.event.tickets?.map(ticket => ({
          ...ticket,
          id: ticket.id || this.generateTicketId(),
          name: ticket.name.trim(),
          price: Number(ticket.price) || 0,
          quantity: Number(ticket.quantity) || 0,
          available: Boolean(ticket.available)
        })) || existingEvent.tickets
      };
      
      // Recalcula capacidade
      updatedEvent.capacity = updatedEvent.tickets.reduce((sum, ticket) => sum + (Number(ticket.quantity) || 0), 0);
      
      events[eventIndex] = updatedEvent;
      this.saveEventsToStorage(events);
      
      return updatedEvent;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }

  // Atualizar evento por URL
  public async updateEventByUrl(url: string, eventData: Partial<EventFormData>, userId: string): Promise<Event> {
    try {
      const events = this.getEventsFromStorage();
      const eventIndex = events.findIndex(event => event.url === url);
      
      if (eventIndex === -1) {
        throw new Error('Evento não encontrado');
      }
      
      const existingEvent = events[eventIndex];
      const updatedEvent: Event = {
        ...existingEvent,
        ...eventData,
        id: existingEvent.id, // Mantém o ID original
        updatedAt: new Date().toISOString(),
        tickets: eventData.tickets?.map(ticket => ({
          ...ticket,
          id: ticket.id || this.generateTicketId(),
          name: ticket.name.trim(),
          price: Number(ticket.price) || 0,
          quantity: Number(ticket.quantity) || 0,
          available: Boolean(ticket.available)
        })) || existingEvent.tickets
      };
      
      // Recalcula capacidade
      updatedEvent.capacity = updatedEvent.tickets.reduce((sum, ticket) => sum + (Number(ticket.quantity) || 0), 0);
      
      events[eventIndex] = updatedEvent;
      this.saveEventsToStorage(events);
      
      return updatedEvent;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }

  // Deletar evento
  public async deleteEvent(request: DeleteEventRequest): Promise<void> {
    try {
      const events = this.getEventsFromStorage();
      const filteredEvents = events.filter(event => event.id !== request.eventId);
      
      if (filteredEvents.length === events.length) {
        throw new Error('Evento não encontrado');
      }
      
      this.saveEventsToStorage(filteredEvents);
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw error;
    }
  }

  // Obter estatísticas dos eventos
  public async getEventStats(userId?: string): Promise<{
    totalEvents: number;
    totalRevenue: number;
    totalTickets: number;
    averageRating: number;
  }> {
    try {
      const events = this.getEventsFromStorage();
      const userEvents = userId ? events.filter(event => event.userId === userId) : events;
      
      const totalEvents = userEvents.length;
      const totalRevenue = userEvents.reduce((sum, event) => {
        // Calcular receita baseada nos ingressos vendidos e preço médio
        const avgTicketPrice = event.tickets.length > 0 
          ? event.tickets.reduce((sum, ticket) => sum + ticket.price, 0) / event.tickets.length
          : 0;
        return sum + (avgTicketPrice * (event.sold || 0));
      }, 0);
      const totalTickets = userEvents.reduce((sum, event) => 
        sum + (event.sold || 0), 0
      );
      const averageRating = userEvents.length > 0 
        ? userEvents.reduce((sum, event) => sum + (event.rating || 0), 0) / userEvents.length 
        : 0;
      
      return {
        totalEvents,
        totalRevenue,
        totalTickets,
        averageRating
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalEvents: 0,
        totalRevenue: 0,
        totalTickets: 0,
        averageRating: 0
      };
    }
  }

  // Backup e restore
  public exportEvents(): string {
    try {
      const events = this.getEventsFromStorage();
      const metadata = localStorage.getItem(EVENTS_METADATA_KEY);
      return JSON.stringify({ events, metadata }, null, 2);
    } catch (error) {
      console.error('Erro ao exportar eventos:', error);
      throw error;
    }
  }

  public importEvents(data: string): void {
    try {
      const parsed = JSON.parse(data);
      if (parsed.events && Array.isArray(parsed.events)) {
        this.saveEventsToStorage(parsed.events);
        if (parsed.metadata) {
          localStorage.setItem(EVENTS_METADATA_KEY, JSON.stringify(parsed.metadata));
        }
      } else {
        throw new Error('Formato de dados inválido');
      }
    } catch (error) {
      console.error('Erro ao importar eventos:', error);
      throw error;
    }
  }

  // Limpar todos os eventos (útil para testes)
  public clearAllEvents(): void {
    try {
      localStorage.removeItem(EVENTS_STORAGE_KEY);
      localStorage.removeItem(EVENTS_METADATA_KEY);
    } catch (error) {
      console.error('Erro ao limpar eventos:', error);
      throw error;
    }
  }
}

// Exporta instância singleton
export const eventsService = EventsService.getInstance();

// Funções de conveniência para uso direto
export const createEvent = (eventData: EventFormData, userId: string) => 
  eventsService.createEvent({ event: eventData, userId });

export const getEventById = (eventId: string) => 
  eventsService.getEventById(eventId);

export const getEventByUrl = (url: string) => 
  eventsService.getEventByUrl(url);

export const getEvents = (options?: Parameters<typeof eventsService.getEvents>[0]) => 
  eventsService.getEvents(options);

export const updateEvent = (eventId: string, eventData: Partial<EventFormData>, userId: string) => 
  eventsService.updateEvent({ eventId, event: eventData, userId });

export const updateEventByUrl = (url: string, eventData: Partial<EventFormData>, userId: string) => 
  eventsService.updateEventByUrl(url, eventData, userId);

export const deleteEvent = (eventId: string, userId: string) => 
  eventsService.deleteEvent({ eventId, userId });

export const getEventStats = (userId?: string) => 
  eventsService.getEventStats(userId);

export const suggestAvailableUrls = (baseUrl: string) => 
  eventsService.suggestAvailableUrls(baseUrl);
