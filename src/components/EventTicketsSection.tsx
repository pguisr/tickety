import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Batch } from '@/types';
import { formatPriceWithoutSymbol } from '@/lib/utils';

interface EventTicketsSectionProps {
  batches: Batch[];
  onAddBatch: () => void;
  onRemoveBatch: (batchId: string) => void;
  onUpdateBatch: (batchId: string, field: keyof Batch, value: string | number | boolean) => void;
}

const EventTicketsSection: React.FC<EventTicketsSectionProps> = ({
  batches,
  onAddBatch,
  onRemoveBatch,
  onUpdateBatch
}) => {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-green/20 rounded-lg flex items-center justify-center">
            <span className="text-primary-green font-semibold">3</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Ingressos</h2>
            <p className="text-xs text-gray-400">Configure tipos e preços</p>
          </div>
        </div>
        <Button
          onClick={onAddBatch}
          variant="outline"
          size="sm"
          className="border-primary-green text-primary-green hover:bg-primary-green hover:text-black"
        >
          <Plus size={14} className="mr-2" />
          Criar
        </Button>
      </div>
      
      {batches?.length > 0 ? (
        <div className="space-y-4">
          {(batches || []).map((batch, index) => (
            <div key={batch.id} className="bg-black/20 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-medium text-gray-400 block">
                        Nome do Lote
                      </Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveBatch(batch.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <Input
                      value={batch.title}
                      onChange={(e) => onUpdateBatch(batch.id, 'title', e.target.value)}
                      className="bg-black/30 border-gray-800 text-white h-9 focus:border-primary-green"
                      placeholder="Ex: Lote Promocional"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-400 mb-2 block">
                        Preço (R$)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={batch.price}
                          onChange={(e) => onUpdateBatch(batch.id, 'price', parseFloat(e.target.value) || 0)}
                          className="bg-black/30 border-gray-800 text-white h-9 pl-10 focus:border-primary-green [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-gray-400 mb-2 block">
                        Quantidade
                      </Label>
                      <Input
                        type="number"
                                      value={batch.quantity}
              onChange={(e) => onUpdateBatch(batch.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="bg-black/30 border-gray-800 text-white h-9 focus:border-primary-green [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-gray-400 mb-2 block">
                        Visibilidade
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateBatch(batch.id, 'isActive', !batch.isActive)}
                        className={`h-9 w-full justify-start gap-2 transition-colors ${
                          batch.isActive 
                            ? 'text-primary-green border border-primary-green/30 bg-primary-green/10 hover:bg-primary-green/20' 
                            : 'text-gray-400 border border-gray-700 bg-gray-800/30 hover:bg-gray-700/40'
                        }`}
                      >
                        {batch.isActive ? (
                          <>
                            <Eye size={14} />
                            Visível
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} />
                            Oculto
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-primary-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Plus size={20} className="text-primary-green" />
          </div>
          <p className="text-gray-400 text-sm">Nenhum ingresso configurado</p>
          <p className="text-gray-500 text-xs mt-1">Clique em "Criar" para começar</p>
        </div>
      )}
    </div>
  );
};

export default EventTicketsSection;
