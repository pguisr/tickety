import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, MapPin, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import PageTransition from '@/components/PageTransition';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import QRCodeModal from '@/components/QRCodeModal';
import { useUserTickets } from '@/hooks/use-user-tickets';
import { useAuth } from '@/contexts/AuthContext';

const MyTicketsContent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tickets, loading, error } = useUserTickets();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedTicketNumber, setSelectedTicketNumber] = useState<string>('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.split(':').slice(0, 2).join(':');
  };

  const getTicketStatus = (orderStatus: string) => {
    switch (orderStatus) {
      case 'paid':
        return { status: 'paid', label: 'Pago', color: 'bg-primary-green/20 text-primary-green border-0' };
      case 'cancelled':
        return { status: 'cancelled', label: 'Cancelado', color: 'bg-red-500/20 text-red-400' };
      case 'pending':
        return { status: 'pending', label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400' };
      case 'failed':
        return { status: 'failed', label: 'Falhou', color: 'bg-red-500/20 text-red-400' };
      case 'expired':
        return { status: 'expired', label: 'Expirado', color: 'bg-gray-500/20 text-gray-400' };
      default:
        return { status: 'unknown', label: 'Desconhecido', color: 'bg-gray-500/20 text-gray-400' };
    }
  };

  const handleQRCodeClick = (ticket: any, ticketNumber: string) => {
    setSelectedTicket(ticket);
    setSelectedTicketNumber(ticketNumber);
    setQrModalOpen(true);
  };

  const handleCloseQRModal = () => {
    setQrModalOpen(false);
    setSelectedTicket(null);
    setSelectedTicketNumber('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-green mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Ticket className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Erro ao carregar</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            size="sm"
            className="bg-primary-green hover:bg-primary-green/90 text-black"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto">
        {/* Header melhorado */}
        <div className="mb-8">
          <div className="px-4">
            <h1 className="text-2xl font-bold text-white">Meus Ingressos</h1>
            <p className="text-gray-400 text-sm">
              {tickets.length > 0 
                ? `${tickets.length} ingresso${tickets.length > 1 ? 's' : ''}`
                : 'Nenhum ingresso ainda'
              }
            </p>
          </div>
        </div>

        {/* Lista melhorada */}
        {tickets.length > 0 ? (
          <div className="space-y-6 px-4">
            {tickets.map((ticket) => {
              const ticketStatus = getTicketStatus(ticket.status);
              
              return (
                <Card key={ticket.id} className="bg-black/20 backdrop-blur-sm border-gray-800/50 rounded-2xl shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg truncate">
                          {ticket.eventTitle}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {ticket.ticketType}
                        </p>
                      </div>
                      <Badge className={`${ticketStatus.color} font-medium`}>
                        {ticketStatus.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Data e local com ícones melhorados */}
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <div className="w-8 h-8 bg-primary-green/10 rounded-lg flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-primary-green" />
                        </div>
                        <span>{formatDate(ticket.eventDate)} • {formatTime(ticket.eventTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <div className="w-8 h-8 bg-primary-green/10 rounded-lg flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-primary-green" />
                        </div>
                        <span>{ticket.eventLocation}</span>
                      </div>
                    </div>

                    {/* QR Codes melhorados */}
                    {ticket.ticketNumbers.length > 0 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          {ticket.ticketNumbers.map((ticketNumber: string, index: number) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="justify-between h-12 border-gray-700 text-white hover:bg-primary-green/10 hover:border-primary-green/30 hover:text-primary-green transition-all duration-200 group"
                              onClick={() => handleQRCodeClick(ticket, ticketNumber)}
                            >
                              <span className="text-sm font-mono text-gray-300 group-hover:text-primary-green truncate">
                                {ticketNumber}
                              </span>
                              <QrCode className="h-4 w-4 text-gray-400 group-hover:text-primary-green" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Estado vazio melhorado */
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 bg-black/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-800">
              <Ticket className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Nenhum ingresso ainda
            </h3>
            <p className="text-gray-400 text-base mb-8 max-w-md mx-auto">
              Quando você comprar ingressos, eles aparecerão aqui para você acessar facilmente.
            </p>
            <Button 
              onClick={() => navigate('/eventos')}
              className="bg-primary-green hover:bg-primary-green/90 text-black font-semibold px-8 py-3 h-12 rounded-lg"
            >
              Explorar Eventos
            </Button>
          </div>
        )}
      </div>

      {/* Modal de QR Code */}
      <QRCodeModal 
        isOpen={qrModalOpen}
        onClose={handleCloseQRModal}
        ticket={selectedTicket}
        ticketNumber={selectedTicketNumber}
      />
    </>
  );
};

const MyTickets: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Se não está logado, redirecionar para login
  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-tickety-black">
      <AuthenticatedHeader />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <MyTicketsContent />
        </main>
      </PageTransition>
    </div>
  );
};

export default MyTickets;
