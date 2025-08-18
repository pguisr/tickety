import React, { useState } from 'react';
import { ArrowLeft, Heart, Share2, MapPin, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import PublicHeader from '@/components/PublicHeader';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { useAuth } from '@/contexts/AuthContext';
import type { Event, Batch, TicketQuantities } from '@/types';
import { SupabaseEventsRepository } from '@/repositories/SupabaseRepository';
import PageTransition from '@/components/PageTransition';
import { toast as sonnerToast } from 'sonner';
import { formatTime, formatDateTime, formatDateTimeRange, formatDateTimeRangeFromTimestamps, formatDateTimeFromTimestamp, formatPriceWithoutSymbol } from '@/lib/utils';
import { CheckoutService } from '@/services/checkout';


const Event: React.FC = () => {
  const navigate = useNavigate();
  const { url } = useParams<{ url: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketQuantities, setTicketQuantities] = useState<TicketQuantities>({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [repository] = useState(() => new SupabaseEventsRepository());

  // Função para formatar data no formato brasileiro
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Busca o evento pela URL
  useEffect(() => {
    const loadEvent = async () => {
      if (!url) {
        setError('URL do evento não fornecida');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const eventData = await repository.findByUrl(url);
        if (!eventData) {
          setError('Evento não encontrado');
          setLoading(false);
          return;
        }
        setEvent(eventData);
      } catch (err) {
        console.error('Erro ao carregar evento:', err);
        setError('Erro ao carregar evento');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [url, repository]);

  // Garante que a página comece no topo
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Criar ordem e navegar para checkout
  const checkAvailabilityAndNavigate = async () => {
    if (!event || checkoutLoading) return;

    console.log('Event - Verificando autenticação:', { user: !!user, totalQuantity });

    // Verificar se o usuário está logado (OBRIGATÓRIO)
    if (!user) {
      console.log('Event - Usuário não logado, redirecionando para login');
      
      // Salvar os dados do evento no localStorage para voltar após o login
      const eventData = {
        event: event,
        ticketQuantities: ticketQuantities,
        returnUrl: `/eventos/${url}`
      };
      localStorage.setItem('pendingCheckout', JSON.stringify(eventData));
      
      // Redirecionar para a página de autenticação
      navigate('/auth', { 
        state: { 
          message: 'É necessário fazer login para comprar ingressos',
          returnUrl: `/eventos/${url}`
        }
      });
      return;
    }

    setCheckoutLoading(true);
    
    try {
      // Verificar se há pelo menos um ingresso selecionado
      if (totalQuantity === 0) {
        sonnerToast.error('Selecione pelo menos um ingresso para continuar.');
        setCheckoutLoading(false);
        return;
      }

      // Criar a ordem (usuário autenticado obrigatório)
      const result = await CheckoutService.createOrder(
        event, 
        ticketQuantities, 
        user.id // Sempre terá user.id aqui
      );

      if (result.success && result.order) {
        // Navegar para a página de compra com o ID da ordem
        navigate('/compra', { 
          state: { 
            event: event, 
            ticketQuantities,
            orderId: result.order.id
          } 
        });
      } else {
        sonnerToast.error(result.error || 'Não foi possível criar seu pedido. Tente novamente.');
      }
      
    } catch (error) {
      console.error('Erro ao criar ordem:', error);
      sonnerToast.error('Não foi possível criar seu pedido. Tente novamente.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="min-h-screen bg-tickety-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-green/30 border-t-primary-green rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-tickety-black">
        {user ? <AuthenticatedHeader /> : <PublicHeader />}
        <PageTransition>
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center max-w-md mx-auto">
              {/* Ícone de erro */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>

              {/* Mensagem principal */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-3">Evento não encontrado</h1>
                <p className="text-gray-400 text-base leading-relaxed">
                  O evento que você está procurando não existe ou foi removido.
                </p>
              </div>


            </div>
          </div>
        </PageTransition>
      </div>
    );
  }

  const batches = event.batches || [];
  const availableBatches = batches.filter(batch => batch.isActive);
  const totalQuantity = Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0);
  const totalValue = availableBatches.reduce((sum, batch) => {
    return sum + (batch.price * (ticketQuantities[batch.id] || 0));
  }, 0);

  const updateQuantity = (batchId: string, change: number) => {
    setTicketQuantities(prev => {
      const currentQuantity = prev[batchId] || 0;
      const batch = batches.find(b => b.id === batchId);
      
      if (!batch) return prev;
      
      const newQuantity = Math.max(0, currentQuantity + change);
      // Limite máximo de 10 ingressos por lote
      const maxQuantity = Math.min(batch.quantity, 10);
      
      return {
        ...prev,
        [batchId]: Math.min(newQuantity, maxQuantity)
      };
    });
  };

  return (
    <div className="min-h-screen bg-tickety-black">
      {user ? <AuthenticatedHeader /> : <PublicHeader />}
      <PageTransition>
        <main className="container mx-auto px-4 py-4 max-w-4xl pb-24">
         {/* Imagem de capa do evento */}
         <div className="mb-6">
           <div className="relative aspect-video bg-gradient-to-br from-primary-green/20 via-purple-500/20 to-blue-500/20 rounded-xl overflow-hidden">
             {event.image && event.image !== '/placeholder.svg' ? (
               <img 
                 src={event.image} 
                 alt={event.title}
                 className="w-full h-full object-cover"
               />
             ) : (
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
             {(!event.image || event.image === '/placeholder.svg') && (
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="text-center text-white/60">
                   <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">🎵</div>
                   <p className="text-sm sm:text-base">Imagem do evento</p>
                 </div>
               </div>
             )}
           </div>
         </div>

         {/* Informações básicas do evento */}
         <div className="mb-6 text-center">
           <div className="mb-3 sm:mb-4">
             <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3">{event.title}</h1>
             {event.description && (
               <p className="text-gray-300 text-sm lg:text-base">{event.description}</p>
             )}
           </div>
           
           <div className="flex items-center justify-center text-sm text-gray-400 mb-4 sm:mb-6">
             <span>
               {event.endsAt 
                 ? formatDateTimeRangeFromTimestamps(event.startsAt, event.endsAt)
                 : formatDateTimeFromTimestamp(event.startsAt)
               }
             </span>
           </div>
        </div>

                 {/* Seção de Ingressos - Minimalista */}
         <div className="mb-8 sm:mb-12">
           <h2 className="text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4">Ingressos</h2>
           
           {availableBatches.length > 0 ? (
             <div className="glass-card rounded-xl overflow-hidden">
               {availableBatches.map((batch, index) => {
                 const isSoldOut = batch.quantity === 0;
                 return (
                   <div key={batch.id}>
                     <div className={`flex items-center justify-between p-3 sm:p-4 transition-colors ${
                       isSoldOut ? 'opacity-50' : 'hover:bg-black/20'
                     }`}>
                       <div className="flex-1 min-w-0">
                         <h3 className="font-bold text-white text-base lg:text-lg mb-1 truncate">{batch.title}</h3>
                         <p className={`text-base sm:text-lg ${
                           isSoldOut ? 'text-gray-500' : 'text-primary-green'
                         }`}>R$ {formatPriceWithoutSymbol(batch.price)}</p>
                       </div>
                       
                       {isSoldOut ? (
                         <div className="flex-shrink-0">
                           <span className="text-gray-500 font-bold text-sm">Esgotado</span>
                         </div>
                       ) : (
                         <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => updateQuantity(batch.id, -1)}
                             disabled={!ticketQuantities[batch.id] || ticketQuantities[batch.id] <= 0}
                             className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full p-0 ${
                               !ticketQuantities[batch.id] || ticketQuantities[batch.id] <= 0
                                 ? 'border-gray-600 text-gray-600'
                                 : 'border-primary-green text-primary-green hover:bg-primary-green hover:text-black'
                             }`}
                           >
                             -
                           </Button>
                           
                           <span className="text-white font-medium min-w-[1.5rem] sm:min-w-[2rem] text-center text-xs">
                             {ticketQuantities[batch.id] || 0}
                           </span>
                           
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => updateQuantity(batch.id, 1)}
                             disabled={ticketQuantities[batch.id] >= Math.min(batch.quantity, 10)}
                             className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full p-0 ${
                                                               ticketQuantities[batch.id] >= Math.min(batch.quantity, 10)
                                 ? 'border-gray-600 text-gray-600 cursor-not-allowed'
                                 : 'border-primary-green text-primary-green hover:bg-primary-green hover:text-black'
                             }`}
                           >
                             +
                           </Button>
                         </div>
                       )}
                     </div>
                     
                     {index < availableBatches.length - 1 && (
                       <div className="border-b border-gray-700/50 mx-6"></div>
                     )}
                   </div>
                 );
               })}
               </div>
             ) : (
               <div className="glass-card rounded-xl p-6 text-center">
                 <p className="text-gray-400 mb-2">Nenhum ingresso disponível</p>
                 <p className="text-sm text-gray-500">Este evento não possui ingressos disponíveis para compra</p>
               </div>
             )}
         </div>

         {/* Seção de Local */}
         <div className="mb-12">
           <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">Local</h3>
           <div className="glass-card rounded-xl p-4">
             <div className="flex items-start space-x-3">
               <div className="flex-shrink-0">
                 <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center border border-gray-800">
                   <MapPin size={16} className="text-primary-green" />
                 </div>
               </div>
               <div className="flex-1">
                 <h4 className="font-bold text-white text-base mb-1">{event.location}</h4>
                 <p className="text-gray-300 text-sm">{event.address}</p>
               </div>
             </div>
           </div>
         </div>



                                   {/* Barra inferior fixa - aparece quando há ingressos selecionados */}
         <div className={`fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-800 shadow-2xl transition-all duration-300 ease-in-out p-5 z-50 ${
           totalQuantity > 0 
             ? 'translate-y-0 opacity-100' 
             : 'translate-y-full opacity-0'
         }`}>
           <div className="container mx-auto max-w-5xl">
             <div className="flex justify-between items-center gap-4">
               <div className="flex flex-col">
                 <small className="text-gray-300 text-sm">
                   {totalQuantity} ingresso{totalQuantity > 1 ? 's' : ''} por
                 </small>
                 <h4 className="text-primary-green font-bold text-xl">
                   R$ {formatPriceWithoutSymbol(totalValue)}
                 </h4>
               </div>
               
               <Button 
                 className="bg-primary-green hover:bg-primary-green/90 text-black font-semibold h-14 px-8 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                 onClick={checkAvailabilityAndNavigate}
                 disabled={checkoutLoading}
               >
                 {checkoutLoading ? (
                   <div className="flex items-center justify-center">
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                     Verificando...
                   </div>
                 ) : (
                   'Finalizar compra'
                 )}
               </Button>
             </div>
           </div>
         </div>
        </main>
      </PageTransition>
    </div>
  );
};

export default Event; 