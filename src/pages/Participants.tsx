import React, { useState, useEffect } from 'react';
import { Search, Mail, Download, Filter, CheckCircle, Clock, XCircle, Users as UsersIcon, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';

interface Participant {
  id: string;
  name: string;
  email: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  eventTitle: string;
  createdAt: string;
  ticketsCount: number;
  totalSpent: number;
  ticketNumber: string;
}

const Participants: React.FC = () => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [events, setEvents] = useState<Array<{id: string, title: string}>>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    cancelled: 0
  });
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const participantsPerPage = 15;

  // Carregar eventos
  useEffect(() => {
    const loadEvents = async () => {
      if (!user?.id) return;

      try {
        setLoadingEvents(true);
        const { data: eventsData, error } = await supabase
          .from('events')
          .select('id, title')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEvents(eventsData || []);
        
        // Selecionar o primeiro evento automaticamente se houver eventos
        if (eventsData && eventsData.length > 0 && !selectedEvent) {
          setSelectedEvent(eventsData[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar eventos:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEvents();
  }, [user?.id]);

  // Carregar participantes
  useEffect(() => {
    const loadParticipants = async () => {
      if (!user?.id || !selectedEvent) return;

      try {
        setLoading(true);
        
        // Buscar tickets diretamente (cada ticket = 1 participante)
        const { data: tickets, error } = await supabase
          .from('tickets')
          .select(`
            id,
            ticket_number,
            status,
            holder_name,
            holder_email,
            created_at,
            batches!inner (
              title,
              events!inner (
                id,
                title,
                user_id
              )
            ),
            orders (
              id,
              status,
              total
            )
          `)
          .filter('batches.events.user_id', 'eq', user.id)
          .filter('batches.events.id', 'eq', selectedEvent)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const participantsData: Participant[] = [];

        tickets?.forEach((ticket: any) => {
          // Cada ticket é um participante individual
          participantsData.push({
            id: ticket.id,
            name: ticket.holder_name || 'Nome não informado',
            email: ticket.holder_email || 'Email não informado',
            status: ticket.status === 'sold' ? 'confirmed' : 
                   ticket.status === 'cancelled' ? 'cancelled' : 'pending',
            eventTitle: ticket.batches?.events?.title || 'Evento não encontrado',
            createdAt: ticket.created_at,
            ticketsCount: 1, // Cada ticket = 1 ingresso
            totalSpent: ticket.orders?.total || 0,
            ticketNumber: ticket.ticket_number || 'N/A'
          });
        });

        setParticipants(participantsData);

        // Calcular estatísticas (apenas vendidos e cancelados)
        const confirmed = participantsData.filter(p => p.status === 'confirmed').length;
        const cancelled = participantsData.filter(p => p.status === 'cancelled').length;
        const total = confirmed + cancelled;
        
        setStats({
          total,
          confirmed,
          cancelled
        });

      } catch (error) {
        console.error('Erro ao carregar participantes:', error);
        setError('Erro ao carregar participantes');
      } finally {
        setLoading(false);
      }
    };

    loadParticipants();
  }, [user?.id, selectedEvent]);

  // Filtrar participantes (apenas vendidos e cancelados)
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
    
    // Mostrar apenas vendidos e cancelados
    const isRelevantStatus = participant.status === 'confirmed' || participant.status === 'cancelled';
    
    return matchesSearch && matchesStatus && isRelevantStatus;
  });

  // Calcular paginação
  const totalPages = Math.ceil(filteredParticipants.length / participantsPerPage);
  const startIndex = (currentPage - 1) * participantsPerPage;
  const endIndex = startIndex + participantsPerPage;
  const currentParticipants = filteredParticipants.slice(startIndex, endIndex);

  // Reset para primeira página quando filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedEvent]);

  // Obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={14} />;
      case 'pending':
        return <Clock size={14} />;
      case 'cancelled':
        return <XCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Formatar data e hora
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Abrir modal de detalhes
  const handleViewDetails = (participant: Participant) => {
    setSelectedParticipant(participant);
    setShowDetailsModal(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedParticipant(null);
  };

  if (loadingEvents) {
    return (
      <div className="min-h-screen bg-tickety-black flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary-green/30 border-t-primary-green rounded-full animate-spin"></div>
          <span className="text-gray-400">Carregando eventos...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-tickety-black flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary-green/30 border-t-primary-green rounded-full animate-spin"></div>
          <span className="text-gray-400">Carregando participantes...</span>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-tickety-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Nenhum evento encontrado</p>
          <p className="text-sm text-gray-500">Crie um evento primeiro para ver os participantes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tickety-black text-white">
      <AuthenticatedHeader />
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="px-4">
            <h1 className="text-2xl font-semibold text-white">Participantes</h1>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-card rounded-lg p-5 h-full hover:border-primary-green/30 transition-all duration-300">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Total de Ingressos</h3>
              <div className="flex items-end justify-between mb-3">
                <span className="text-2xl font-bold text-white">{stats.total}</span>
              </div>
            </div>

            <div className="glass-card rounded-lg p-5 h-full hover:border-primary-green/30 transition-all duration-300">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Confirmados</h3>
              <div className="flex items-end justify-between mb-3">
                <span className="text-2xl font-bold text-white">{stats.confirmed}</span>
              </div>
            </div>



            <div className="glass-card rounded-lg p-5 h-full hover:border-primary-green/30 transition-all duration-300">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Cancelados</h3>
              <div className="flex items-end justify-between mb-3">
                <span className="text-2xl font-bold text-white">{stats.cancelled}</span>
              </div>
            </div>
          </div>

          {/* Participants List */}
          <div className="glass-card rounded-lg p-6">
            {/* Filters and Search */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="w-full sm:w-64 bg-black/40 border-gray-800/80 text-white hover:border-primary-green/50">
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gray-800">
                    {events.map((event) => (
                      <SelectItem 
                        key={event.id} 
                        value={event.id} 
                        className="text-white hover:bg-primary-green hover:text-black data-[highlighted]:bg-primary-green data-[highlighted]:text-black"
                      >
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Buscar por nome, email ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/40 border-gray-800/80 text-white placeholder-gray-400 focus:border-primary-green/50"
                    disabled={!selectedEvent}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter} disabled={!selectedEvent}>
                  <SelectTrigger className="w-full sm:w-48 bg-black/40 border-gray-800/80 text-white hover:border-primary-green/50 disabled:opacity-50">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gray-800">
                    <SelectItem value="all" className="text-white hover:bg-primary-green hover:text-black data-[highlighted]:bg-primary-green data-[highlighted]:text-black">Todos os ingressos</SelectItem>
                    <SelectItem value="confirmed" className="text-white hover:bg-primary-green hover:text-black data-[highlighted]:bg-primary-green data-[highlighted]:text-black">Vendidos</SelectItem>
                    <SelectItem value="cancelled" className="text-white hover:bg-primary-green hover:text-black data-[highlighted]:bg-primary-green data-[highlighted]:text-black">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="border-gray-800/80 text-gray-400 hover:text-primary-green hover:bg-transparent gap-2" disabled={!selectedEvent}>
                  <Mail size={16} />
                  Notificar
                </Button>
                <Button variant="outline" className="border-gray-800/80 text-gray-400 hover:text-primary-green hover:bg-transparent gap-2" disabled={!selectedEvent}>
                  <Download size={16} />
                  Exportar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {currentParticipants.map((participant) => (
                <div 
                  key={participant.id} 
                  className="group relative p-4 glass-card rounded-lg hover:border-primary-green/30 transition-all duration-300 cursor-pointer"
                  onClick={() => handleViewDetails(participant)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 transition-colors rounded-xl flex items-center justify-center font-semibold text-sm ${
                      participant.status === 'confirmed' 
                        ? 'bg-primary-green hover:bg-primary-green/90 text-black' 
                        : participant.status === 'cancelled'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                    }`}>
                      {getInitials(participant.name)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white text-sm truncate mb-1">
                        {participant.name}
                      </h3>
                      <p className="text-xs text-gray-400 truncate mb-2">{participant.email}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-mono text-xs truncate">
                          {participant.ticketNumber}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(participant.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>


                </div>
              ))}
            </div>

            {!selectedEvent && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-400 mb-2">Selecione um evento para ver os ingressos</p>
                <p className="text-sm text-gray-500">Escolha um evento na lista acima para visualizar os ingressos vendidos</p>
              </div>
            )}

            {selectedEvent && currentParticipants.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-400 mb-2">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nenhum ingresso encontrado para os filtros aplicados.' 
                    : 'Nenhum ingresso encontrado.'}
                </p>
                <p className="text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca.' 
                    : 'Os ingressos aparecerão aqui quando houver vendas.'}
                </p>
              </div>
            )}

            {/* Paginação */}
            {selectedEvent && totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-800/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-3 text-gray-400 hover:text-primary-green hover:bg-transparent"
                >
                  ←
                </Button>
                
                <span className="text-gray-500 text-xs">
                  {currentPage}/{totalPages}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3 text-gray-400 hover:text-primary-green hover:bg-transparent"
                >
                  →
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedParticipant && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Detalhes do Ingresso</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  className="h-8 w-8 p-0 text-gray-400 hover:bg-primary-green hover:text-black transition-colors"
                >
                  <X size={16} />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Avatar e Nome */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-primary-green rounded-xl flex items-center justify-center text-black font-semibold text-lg">
                    {getInitials(selectedParticipant.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{selectedParticipant.name}</h3>
                    <p className="text-sm text-gray-400">{selectedParticipant.email}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedParticipant.status === 'confirmed' ? 'bg-primary-green' : 
                    selectedParticipant.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-gray-300">
                    {selectedParticipant.status === 'confirmed' ? 'Confirmado' : 
                     selectedParticipant.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                  </span>
                </div>

                {/* Informações do Ingresso */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Código do Ingresso:</span>
                    <span className="text-sm text-white font-mono">{selectedParticipant.ticketNumber}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Evento:</span>
                    <span className="text-sm text-white">{selectedParticipant.eventTitle}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Valor Pago:</span>
                    <span className="text-sm text-primary-green font-semibold">{formatCurrency(selectedParticipant.totalSpent)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Data da Compra:</span>
                    <span className="text-sm text-white">{formatDateTime(selectedParticipant.createdAt)}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-4 border-t border-gray-800/50">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-800/80 text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start"
                  >
                    <XCircle size={14} className="mr-2" />
                    Cancelar Ingresso
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Participants;
