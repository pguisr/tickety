import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, CreditCard, Copy, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TicketData, Batch, TicketQuantities } from '@/types';
import { formatPriceWithoutSymbol } from '@/lib/utils';

interface TicketDataFormProps {
  eventBatches: Batch[];
  ticketQuantities: TicketQuantities;
  ticketData: TicketData[];
  onTicketDataChange: (ticketData: TicketData[]) => void;
}

const TicketDataForm: React.FC<TicketDataFormProps> = ({
  eventBatches,
  ticketQuantities,
  ticketData,
  onTicketDataChange
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Inicializar dados dos ingressos se estiver vazio
  useEffect(() => {
    if (ticketData.length === 0) {
      const initialTicketData: TicketData[] = [];
      
      eventBatches.forEach(batch => {
        const quantity = ticketQuantities[batch.id] || 0;
        for (let i = 0; i < quantity; i++) {
          initialTicketData.push({
            id: `${batch.id}-${i}-${Date.now()}`,
            batchId: batch.id,
            attendeeName: '',
            attendeeEmail: '',
            attendeePhone: '',
            attendeeCpf: ''
          });
        }
      });
      
      onTicketDataChange(initialTicketData);
    }
  }, [eventBatches, ticketQuantities, ticketData.length, onTicketDataChange]);

  const updateTicketData = (index: number, field: keyof TicketData, value: string) => {
    const updatedData = [...ticketData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    onTicketDataChange(updatedData);
  };

  const copyFromPrevious = (index: number) => {
    if (index > 0) {
      const previousTicket = ticketData[index - 1];
      const updatedData = [...ticketData];
      updatedData[index] = {
        ...updatedData[index],
        attendeeName: previousTicket.attendeeName,
        attendeeEmail: previousTicket.attendeeEmail,
        attendeePhone: previousTicket.attendeePhone,
        attendeeCpf: previousTicket.attendeeCpf
      };
      onTicketDataChange(updatedData);
      
      // Mostrar feedback visual
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const clearTicketData = (index: number) => {
    const updatedData = [...ticketData];
    updatedData[index] = {
      ...updatedData[index],
      attendeeName: '',
      attendeeEmail: '',
      attendeePhone: '',
      attendeeCpf: ''
    };
    onTicketDataChange(updatedData);
  };

  const isFormValid = () => {
    return ticketData.every(ticket => ticket.attendeeName.trim() !== '');
  };

  const getBatchInfo = (batchId: string) => {
    return eventBatches.find(batch => batch.id === batchId);
  };

  // Agrupar tickets por lote para melhor organização
  const ticketsByBatch = ticketData.reduce((acc, ticket) => {
    const batchId = ticket.batchId;
    if (!acc[batchId]) {
      acc[batchId] = [];
    }
    acc[batchId].push(ticket);
    return acc;
  }, {} as Record<string, TicketData[]>);

  return (
    <div className="max-w-4xl mx-auto space-y-6">




      {/* Formulários dos ingressos */}
      <div className="space-y-6">
        {Object.entries(ticketsByBatch).map(([batchId, tickets]) => {
          const batch = getBatchInfo(batchId);
          if (!batch) return null;

          return (
            <Card key={batchId} className="glass-card border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>{batch.title}</span>
                  <Badge variant="secondary" className="ml-2">
                    {tickets.length} ingresso{tickets.length > 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tickets.map((ticket, ticketIndex) => {
                  const globalIndex = ticketData.findIndex(t => t.id === ticket.id);
                  return (
                    <div key={ticket.id} className="p-4 bg-black/20 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-white font-medium">
                          Ingresso #{ticketIndex + 1}
                        </h4>
                        {globalIndex > 0 && (
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => copyFromPrevious(globalIndex)}
                              className="btn-hover-subtle"
                            >
                              <Copy size={14} className="mr-1" />
                              {copiedIndex === globalIndex ? 'Copiado!' : 'Copiar anterior'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => clearTicketData(globalIndex)}
                              className="btn-hover-subtle"
                            >
                              Limpar
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`attendeeName-${ticket.id}`} className="text-white">
                            Nome do participante *
                          </Label>
                          <Input
                            id={`attendeeName-${ticket.id}`}
                            value={ticket.attendeeName}
                            onChange={(e) => updateTicketData(globalIndex, 'attendeeName', e.target.value)}
                            className="glass-card border-gray-600 text-white"
                            placeholder="Nome completo"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`attendeeEmail-${ticket.id}`} className="text-white">
                            E-mail
                          </Label>
                          <Input
                            id={`attendeeEmail-${ticket.id}`}
                            type="email"
                            value={ticket.attendeeEmail || ''}
                            onChange={(e) => updateTicketData(globalIndex, 'attendeeEmail', e.target.value)}
                            className="glass-card border-gray-600 text-white"
                            placeholder="email@exemplo.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`attendeePhone-${ticket.id}`} className="text-white">
                            Telefone
                          </Label>
                          <Input
                            id={`attendeePhone-${ticket.id}`}
                            value={ticket.attendeePhone || ''}
                            onChange={(e) => updateTicketData(globalIndex, 'attendeePhone', e.target.value)}
                            className="glass-card border-gray-600 text-white"
                            placeholder="(11) 99999-9999"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`attendeeCpf-${ticket.id}`} className="text-white">
                            CPF
                          </Label>
                          <Input
                            id={`attendeeCpf-${ticket.id}`}
                            value={ticket.attendeeCpf || ''}
                            onChange={(e) => updateTicketData(globalIndex, 'attendeeCpf', e.target.value)}
                            className="glass-card border-gray-600 text-white"
                            placeholder="000.000.000-00"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>


    </div>
  );
};

export default TicketDataForm;
