import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { X, Save } from 'lucide-react';

interface EventActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  isLoading: boolean;
  hasChanges: boolean;
  saveText: string;
  loadingText: string;
}

const EventActionButtons: React.FC<EventActionButtonsProps> = ({
  onCancel,
  onSave,
  isLoading,
  hasChanges,
  saveText,
  loadingText
}) => {
  return (
    <div className="hidden lg:block glass-card rounded-xl p-6">
      <div className="flex items-center space-x-3">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="btn-hover-subtle flex-1"
        >
          <X size={16} className="mr-2" />
          Cancelar
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onSave}
                disabled={isLoading || !hasChanges}
                className="bg-primary-green hover:bg-primary-green/90 text-black font-semibold gap-2 flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    {loadingText}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {saveText}
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Salvar alterações</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default EventActionButtons;
