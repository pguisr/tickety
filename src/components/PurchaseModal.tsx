import React from 'react';
import { X, CreditCard, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatTime, formatDateTime, formatDateTimeRange, formatDateTimeRangeFromTimestamps, formatDateTimeFromTimestamp } from '@/lib/utils';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    name: string;
    price: number;
    benefits: string[];
  } | null;
  quantity: number;
  event: {
    title: string;
    startDate: string;
    startTime: string;
    endDate?: string;
    endTime?: string;
    location: string;
    startsAt: string;
    endsAt: string;
  };
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  ticket,
  quantity,
  event
}) => {
  if (!ticket) return null;

  const subtotal = ticket.price * quantity;
  const serviceFee = 5;
  const total = subtotal + serviceFee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-gray-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Confirmar Compra</DialogTitle>
          <DialogDescription className="text-gray-300">
            Revise os detalhes do seu pedido antes de finalizar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do evento */}
          <Card className="bg-black/30 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Data</span>
                <span className="text-white">
                  {event.endsAt
                    ? formatDateTimeRangeFromTimestamps(event.startsAt, event.endsAt)
                    : formatDateTimeFromTimestamp(event.startsAt)
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Local</span>
                <span className="text-white">{event.location}</span>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes do ingresso */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white">Ingresso Selecionado</h4>
            <Card className="bg-black/30 border-gray-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-semibold text-white">{ticket.name}</h5>
                    <p className="text-sm text-gray-400">Quantidade: {quantity}</p>
                  </div>
                  <Badge className="bg-primary-green text-black">
                    R$ {ticket.price}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {ticket.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle size={12} className="text-primary-green flex-shrink-0" />
                      <span className="text-xs text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo financeiro */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white">Resumo do Pedido</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal ({quantity}x R$ {ticket.price})</span>
                <span className="text-white">R$ {subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Taxa de serviço</span>
                <span className="text-white">R$ {serviceFee}</span>
              </div>
              <Separator className="bg-gray-700" />
              <div className="flex justify-between font-semibold">
                <span className="text-white">Total</span>
                <span className="text-primary-green">R$ {total}</span>
              </div>
            </div>
          </div>

          {/* Informações de segurança */}
          <div className="bg-primary-green/10 border border-primary-green/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield size={16} className="text-primary-green mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Compra 100% Segura</p>
                <p className="text-xs text-gray-300">
                  Seus dados estão protegidos com criptografia SSL e não serão compartilhados
                </p>
              </div>
            </div>
          </div>

          {/* Aviso importante */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-500">Aviso Importante</p>
                <p className="text-xs text-gray-300">
                  Ingressos não são reembolsáveis. Verifique a data e local antes de confirmar.
                </p>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="btn-hover-subtle flex-1"
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-primary-green hover:bg-primary-green/90 text-black font-semibold"
              onClick={() => {
                // Aqui você implementaria a lógica de pagamento
                alert('Redirecionando para o pagamento...');
                onClose();
              }}
            >
              <CreditCard size={16} className="mr-2" />
              Finalizar Compra
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseModal; 