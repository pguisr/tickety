import React, { useMemo, useCallback } from 'react';
import { Calendar, MapPin, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    id: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    ticketType: string;
    quantity: number;
    price: number;
    ticketNumbers: string[];
    createdAt: string;
  } | null;
  ticketNumber: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, ticket, ticketNumber }) => {
  // Memoizar formatação de data
  const formattedDate = useMemo(() => {
    if (!ticket?.eventDate) return '';
    return new Date(ticket.eventDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  }, [ticket?.eventDate]);

  // Memoizar formatação de hora
  const formattedTime = useMemo(() => {
    if (!ticket?.eventTime) return '';
    return ticket.eventTime.split(':').slice(0, 2).join(':');
  }, [ticket?.eventTime]);

  // Memoizar URL do QR code
  const qrCodeUrl = useMemo(() => {
    if (!ticketNumber) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticketNumber)}`;
  }, [ticketNumber]);

  // Callback para download
  const handleDownloadQR = useCallback(() => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-code-${ticketNumber}.png`;
    link.click();
  }, [qrCodeUrl, ticketNumber]);

  // Callback para fechar modal
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-tickety-black border-0 max-w-none w-full h-full max-h-none mx-0 my-0 p-0 overflow-hidden rounded-none flex flex-col">
        {/* Header fixo */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-white/10 flex-shrink-0">
          <div className="w-8"></div> {/* Espaçador */}
          <h2 className="text-xl sm:text-2xl font-bold text-white">QR Code</h2>
          <button 
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors text-lg font-medium"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        {/* Conteúdo centralizado */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 min-h-0">
          {/* QR Code */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 inline-block shadow-lg">
              <img 
                src={qrCodeUrl} 
                alt="QR Code do ingresso"
                className="w-32 h-32 sm:w-48 sm:h-48"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4 mb-2 sm:mb-3">
              Apresente na entrada do evento
            </p>
            <p className="text-white font-mono text-xs sm:text-sm bg-white/5 rounded-md sm:rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 inline-block border border-white/10">
              {ticketNumber}
            </p>
          </div>

          {/* Informações do evento */}
          <div className="space-y-3 sm:space-y-4 max-w-md px-4">
            <div className="text-center">
              <h3 className="text-white font-semibold text-lg sm:text-xl mb-1 sm:mb-2">{ticket.eventTitle}</h3>
              <p className="text-gray-400 text-sm sm:text-base">{ticket.ticketType}</p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                <p className="text-gray-300">
                  {formattedDate} • {formattedTime}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                <p className="text-gray-300">{ticket.eventLocation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botões fixos embaixo */}
        <div className="flex gap-3 sm:gap-4 px-4 sm:px-8 py-4 sm:py-6 border-t border-white/10 flex-shrink-0">
          <Button 
            variant="outline" 
            className="flex-1 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white h-10 sm:h-12 text-sm sm:text-base"
            onClick={handleDownloadQR}
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Baixar
          </Button>
          <Button 
            className="flex-1 bg-primary-green hover:bg-primary-green/90 text-black h-10 sm:h-12 text-sm sm:text-base font-semibold"
            onClick={handleClose}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(QRCodeModal);
