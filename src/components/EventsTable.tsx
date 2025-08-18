import React from 'react';
import { Edit, QrCode, Eye, ExternalLink, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';
import { SupabaseEventsRepository } from '@/repositories/SupabaseRepository';
import { useEffect, useState } from 'react';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/lib/supabase';

import ConfirmDialog from './ConfirmDialog';


// Interface para eventos formatados na tabela
interface FormattedEvent {
  id: string;
  url: string;
  name: string;
  date: string;
  dateIcon: string;
  dateTooltip: string;
  participants: number;
  revenue: string;
  status: string;
}

const EventsTable: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [repository] = useState(() => new SupabaseEventsRepository());

  const [events, setEvents] = useState<FormattedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{id: string, hasSales?: boolean} | null>(null);

  // Função para formatar data no formato brasileiro (dd/mm/aaaa)
  const formatDate = (dateString: string): string => {
    try {
      // Se for um timestamp ISO, extrair apenas a data
      if (dateString.includes('T')) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return dateString;
        }
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      
      // Se for apenas uma data (YYYY-MM-DD)
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      const formattedDay = date.getDate().toString().padStart(2, '0');
      const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
      const formattedYear = date.getFullYear();
      return `${formattedDay}/${formattedMonth}/${formattedYear}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };

  // Função para formatar intervalo de datas
  const formatDateRange = (startDate: string, endDate?: string): string => {
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : null;
      
      if (isNaN(start.getTime())) {
        return formatDate(startDate);
      }
      
      const startDay = start.getDate().toString().padStart(2, '0');
      const startMonth = (start.getMonth() + 1).toString().padStart(2, '0');
      const startYear = start.getFullYear();
      
      // Se não há data de fim ou é o mesmo dia, mostra apenas a data de início
      if (!end || isNaN(end.getTime()) || start.toDateString() === end.toDateString()) {
        return `${startDay}/${startMonth}/${startYear}`;
      }
      
      // Se há data de fim diferente, mostra o intervalo
      const endDay = end.getDate().toString().padStart(2, '0');
      const endMonth = (end.getMonth() + 1).toString().padStart(2, '0');
      const endYear = end.getFullYear();
      
      return `${startDay}/${startMonth}/${startYear}-${endDay}/${endMonth}/${endYear}`;
    } catch (error) {
      console.error('Erro ao formatar intervalo de datas:', error);
      return formatDate(startDate);
    }
  };

  // Função para formatar data de forma visual
  const formatDateVisual = (startDate: string, endDate?: string): { text: string; icon: string; tooltip: string } => {
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : null;
      
      if (isNaN(start.getTime())) {
        return { text: 'Data inválida', icon: '❌', tooltip: 'Data inválida' };
      }
      
      const startDay = start.getDate().toString().padStart(2, '0');
      const startMonth = (start.getMonth() + 1).toString().padStart(2, '0');
      const startYear = start.getFullYear();
      const startHours = start.getHours().toString().padStart(2, '0');
      const startMinutes = start.getMinutes().toString().padStart(2, '0');
      
      // Se não há data de fim ou é o mesmo dia
      if (!end || isNaN(end.getTime()) || start.toDateString() === end.toDateString()) {
        const isToday = start.toDateString() === new Date().toDateString();
        const isTomorrow = start.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
        
        let icon = '📅';
        let prefix = '';
        
        if (isToday) {
          icon = '🎯';
          prefix = 'Hoje';
        } else if (isTomorrow) {
          icon = '⏰';
          prefix = 'Amanhã';
        }
        
        const text = prefix ? `${prefix}, ${startDay}/${startMonth}` : `${startDay}/${startMonth}`;
        const tooltip = `${startDay}/${startMonth}/${startYear} às ${startHours}:${startMinutes}`;
        
        return { text, icon, tooltip };
      }
      
      // Se há data de fim diferente
      const endDay = end.getDate().toString().padStart(2, '0');
      const endMonth = (end.getMonth() + 1).toString().padStart(2, '0');
      const endYear = end.getFullYear();
      const endHours = end.getHours().toString().padStart(2, '0');
      const endMinutes = end.getMinutes().toString().padStart(2, '0');
      
      const text = `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
      const tooltip = `${startDay}/${startMonth}/${startYear} às ${startHours}:${startMinutes} até ${endDay}/${endMonth}/${endYear} às ${endHours}:${endMinutes}`;
      
      return { text, icon: '📆', tooltip };
    } catch (error) {
      console.error('Erro ao formatar data visual:', error);
      return { text: 'Erro', icon: '❌', tooltip: 'Erro ao formatar data' };
    }
  };

  // Função para formatar data de forma simples
  const formatDateSimple = (startDate: string, endDate?: string): { text: string; tooltip: string } => {
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : null;
      
      if (isNaN(start.getTime())) {
        return { text: 'Data inválida', tooltip: 'Data inválida' };
      }
      
      const startDay = start.getDate().toString().padStart(2, '0');
      const startMonth = (start.getMonth() + 1).toString().padStart(2, '0');
      const startYear = start.getFullYear();
      const startHours = start.getHours().toString().padStart(2, '0');
      const startMinutes = start.getMinutes().toString().padStart(2, '0');
      
      // Se não há data de fim ou é o mesmo dia
      if (!end || isNaN(end.getTime()) || start.toDateString() === end.toDateString()) {
        const text = `${startDay}/${startMonth}`;
        const tooltip = `${startDay}/${startMonth}/${startYear} às ${startHours}:${startMinutes}`;
        return { text, tooltip };
      }
      
      // Se há data de fim diferente
      const endDay = end.getDate().toString().padStart(2, '0');
      const endMonth = (end.getMonth() + 1).toString().padStart(2, '0');
      const endYear = end.getFullYear();
      const endHours = end.getHours().toString().padStart(2, '0');
      const endMinutes = end.getMinutes().toString().padStart(2, '0');
      
      const text = `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
      const tooltip = `${startDay}/${startMonth}/${startYear} às ${startHours}:${startMinutes} até ${endDay}/${endMonth}/${endYear} às ${endHours}:${endMinutes}`;
      
      return { text, tooltip };
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return { text: 'Erro', tooltip: 'Erro ao formatar data' };
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        setEvents([]);
        return;
      }

      const response = await repository.findByUserId(user.id, {
        includeArchived: false
        // Removido filtro de status para mostrar todos os eventos (draft e published)
      });
      
      // Mapear eventos para o formato da tabela com dados reais
      const eventsWithRevenue = await Promise.all(
        response.events.map(async (event) => {
          const dateInfo = formatDateSimple(event.startsAt, event.endsAt);
          
          // Buscar estatísticas reais do evento
          let participants = 0;
          let revenue = 'R$ 0,00';
          
          try {
            const eventStats = await repository.getEventStats(event.id);
            participants = eventStats.participants;
            revenue = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(eventStats.revenue);
          } catch (error) {
            console.error(`Erro ao buscar estatísticas do evento ${event.id}:`, error);
          }
          
          return {
            id: event.id,
            url: event.url,
            name: event.title,
            date: dateInfo.text,
            dateIcon: '', // Não usado mais
            dateTooltip: dateInfo.tooltip,
            participants,
            revenue,
            status: event.status || 'published'
          };
        })
      );

      setEvents(eventsWithRevenue);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      sonnerToast.error('Não foi possível carregar seus eventos. Atualize a página.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user?.id]);

  const handleDeleteClick = async (eventId: string) => {
    try {
      setEventToDelete({ id: eventId, hasSales: false });
      setShowDeleteDialog(true);
    } catch (error) {
      sonnerToast.error('Não foi possível verificar o status do evento.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      setDeletingEvent(eventToDelete.id);
      const result = await repository.delete(eventToDelete.id);
      
      if (result.action === 'archived') {
        sonnerToast.success(
          'Evento arquivado para preservar suas vendas salvas.',
          { duration: 5000 }
        );
      } else {
        sonnerToast.success('Evento excluído com sucesso.');
      }
      
      await loadEvents();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      sonnerToast.error('Falha ao excluir evento. Tente novamente.');
    } finally {
      setDeletingEvent(null);
      setShowDeleteDialog(false);
      setEventToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setEventToDelete(null);
  };



  return (
    <div className="glass-card rounded-lg p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-medium text-white">Eventos</h2>
        <div className="flex items-center gap-4">
          {/* Opção de arquivos removida */}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-800/50 hover:bg-transparent">
              <TableHead className="text-gray-400 text-[10px] uppercase tracking-wider font-normal">Nome</TableHead>
              <TableHead className="text-gray-400 text-[10px] uppercase tracking-wider font-normal">Data</TableHead>
              <TableHead className="text-gray-400 text-[10px] uppercase tracking-wider font-normal text-right">Participantes</TableHead>
              <TableHead className="text-gray-400 text-[10px] uppercase tracking-wider font-normal text-right">Faturamento</TableHead>
              <TableHead className="text-gray-400 text-[10px] uppercase tracking-wider font-normal text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary-green/30 border-t-primary-green rounded-full animate-spin mr-3"></div>
                    <span className="text-gray-400">Carregando eventos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="text-gray-400">
                    <p className="mb-2">Nenhum evento encontrado</p>
                    <p className="text-sm">Crie seu primeiro evento para começar</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id} className="border-b border-gray-800/50 transition-colors duration-200 hover:bg-black/20">
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">{event.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0 text-gray-500 hover:text-primary-green hover:bg-transparent"
                      onClick={() => window.open(`/eventos/${event.url}`, '_blank')}
                    >
                      <ExternalLink size={12} />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-gray-400 text-sm" title={event.dateTooltip}>{event.date}</span>
                </TableCell>
                <TableCell className="text-right py-4">
                  <span className="text-white text-sm">{event.participants}</span>
                </TableCell>
                <TableCell className="text-right py-4">
                  <span className="text-white text-sm">{event.revenue}</span>
                </TableCell>
                <TableCell className="text-right py-4">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 p-0 text-gray-500 hover:text-primary-green hover:bg-transparent"
                      onClick={() => navigate(`/eventos/${event.url}/editar`)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-400 hover:bg-transparent"
                      onClick={() => handleDeleteClick(event.id)}
                      disabled={deletingEvent === event.id}
                    >
                      {deletingEvent === event.id ? (
                        <div className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Excluir Evento"
        description="Tem certeza que deseja remover este evento? Se o evento tiver vendas registradas, os dados serão preservados. Caso contrário, será excluído permanentemente."
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
        loading={deletingEvent !== null}
      />
    </div>
  );
};

export default EventsTable;
