import { useState, useEffect, useCallback } from 'react';
import { Event, EventFormData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { SupabaseEventsRepository } from '@/repositories/SupabaseRepository';

export interface UseEventsOptions {
  userId?: string;
  page?: number;
  limit?: number;
  search?: string;
  autoRefresh?: boolean;
}

export interface UseEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  createEvent: (eventData: EventFormData, userId: string) => Promise<Event>;
  updateEvent: (eventId: string, eventData: Partial<EventFormData>, userId: string) => Promise<Event>;
  deleteEvent: (eventId: string, userId: string) => Promise<void>;
  refreshEvents: () => Promise<void>;
  getEventById: (eventId: string) => Promise<Event | null>;
  getEventByUrl: (url: string) => Promise<Event | null>;
  getEventStats: (userId?: string) => Promise<{
    totalEvents: number;
    totalRevenue: number;
    totalTickets: number;
    averageRating: number;
  }>;
}

export const useEvents = (options: UseEventsOptions = {}): UseEventsReturn => {
  const { userId, page = 1, limit = 10, search, autoRefresh = true } = options;
  const { user } = useAuth();
  const [repository] = useState(() => new SupabaseEventsRepository());
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [currentLimit, setCurrentLimit] = useState(limit);

  // Função para carregar eventos
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUserId = userId || user?.id;
      if (!currentUserId) {
        setEvents([]);
        setTotal(0);
        return;
      }
      
      const response = await repository.findAll({
        page: currentPage,
        limit: currentLimit,
        search
      });
      
      setEvents(response.events);
      setTotal(response.total);
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentLimit, userId, user?.id, search, repository]);

  // Carrega eventos na montagem e quando as dependências mudam
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Auto-refresh se habilitado
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadEvents();
    }, 30000); // Atualiza a cada 30 segundos
    
    return () => clearInterval(interval);
  }, [autoRefresh, loadEvents]);

  // Função para criar evento
  const createEvent = useCallback(async (eventData: EventFormData, userId: string): Promise<Event> => {
    try {
      setError(null);
      const newEvent = await repository.create({
        title: eventData.title,
        subtitle: eventData.subtitle,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        address: eventData.address,
        url: eventData.url,
        image: eventData.image,
        userId: userId
      });
      
      // Atualiza a lista de eventos
      await loadEvents();
      
      return newEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar evento';
      setError(errorMessage);
      throw err;
    }
  }, [loadEvents, repository]);

  // Função para atualizar evento
  const updateEvent = useCallback(async (eventId: string, eventData: Partial<EventFormData>, userId: string): Promise<Event> => {
    try {
      setError(null);
      const updatedEvent = await repository.update(eventId, {
        title: eventData.title,
        subtitle: eventData.subtitle,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        address: eventData.address,
        url: eventData.url,
        image: eventData.image,
        userId: userId
      });
      
      // Atualiza a lista de eventos
      await loadEvents();
      
      return updatedEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar evento';
      setError(errorMessage);
      throw err;
    }
  }, [loadEvents, repository]);

  // Função para deletar evento
  const deleteEvent = useCallback(async (eventId: string, userId: string): Promise<void> => {
    try {
      setError(null);
      await repository.delete(eventId);
      
      // Atualiza a lista de eventos
      await loadEvents();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar evento';
      setError(errorMessage);
      throw err;
    }
  }, [loadEvents, repository]);

  // Função para buscar evento por ID
  const getEventById = useCallback(async (eventId: string): Promise<Event | null> => {
    try {
      return await repository.findById(eventId);
    } catch (err) {
      console.error('Erro ao buscar evento por ID:', err);
      return null;
    }
  }, [repository]);

  // Função para buscar evento por URL
  const getEventByUrl = useCallback(async (url: string): Promise<Event | null> => {
    try {
      return await repository.findByUrl(url);
    } catch (err) {
      console.error('Erro ao buscar evento por URL:', err);
      return null;
    }
  }, [repository]);

  // Função para obter estatísticas
  const getEventStats = useCallback(async (userId?: string) => {
    try {
      const currentUserId = userId || user?.id;
      if (!currentUserId) {
        return {
          totalEvents: 0,
          totalRevenue: 0,
          totalTickets: 0,
          averageRating: 0
        };
      }
      
      const stats = await repository.getStats(currentUserId);
      return {
        totalEvents: stats.totalEvents,
        totalRevenue: stats.totalRevenue,
        totalTickets: stats.totalTickets,
        averageRating: stats.averageRating
      };
    } catch (err) {
      console.error('Erro ao obter estatísticas:', err);
      return {
        totalEvents: 0,
        totalRevenue: 0,
        totalTickets: 0,
        averageRating: 0
      };
    }
  }, [repository, user?.id]);

  // Função para atualizar eventos manualmente
  const refreshEvents = useCallback(async () => {
    await loadEvents();
  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    total,
    page: currentPage,
    limit: currentLimit,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    getEventById,
    getEventByUrl,
    getEventStats
  };
};

// Hook específico para um único evento
export const useEvent = (eventId: string) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repository] = useState(() => new SupabaseEventsRepository());

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const eventData = await repository.findById(eventId);
        setEvent(eventData);
      } catch (err) {
        console.error('Erro ao carregar evento:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar evento');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadEvent();
    }
  }, [eventId, repository]);

  return { event, loading, error };
};

// Hook específico para estatísticas
export const useEventStats = (userId?: string) => {
  const { user } = useAuth();
  const [repository] = useState(() => new SupabaseEventsRepository());
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRevenue: 0,
    totalTickets: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const currentUserId = userId || user?.id;
        if (!currentUserId) {
          setStats({
            totalEvents: 0,
            totalRevenue: 0,
            totalTickets: 0,
            averageRating: 0
          });
          return;
        }
        
        const statsData = await repository.getStats(currentUserId);
        setStats({
          totalEvents: statsData.totalEvents,
          totalRevenue: statsData.totalRevenue,
          totalTickets: statsData.totalTickets,
          averageRating: statsData.averageRating
        });
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId, user?.id, repository]);

  return { stats, loading, error };
};
