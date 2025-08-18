import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-400',
          button: 'bg-red-500 hover:bg-red-600 text-white',
          iconBg: 'bg-red-500/10'
        };
      case 'warning':
        return {
          icon: 'text-yellow-400',
          button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
          iconBg: 'bg-yellow-500/10'
        };
      case 'info':
        return {
          icon: 'text-blue-400',
          button: 'bg-blue-500 hover:bg-blue-600 text-white',
          iconBg: 'bg-blue-500/10'
        };
      default:
        return {
          icon: 'text-red-400',
          button: 'bg-red-500 hover:bg-red-600 text-white',
          iconBg: 'bg-red-500/10'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 backdrop-blur-lg border border-gray-800 text-white max-w-[90vw] w-full mx-auto sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${styles.iconBg}`}>
              <AlertTriangle size={16} className={`${styles.icon} sm:w-5 sm:h-5`} />
            </div>
            <DialogTitle className="text-base sm:text-lg font-semibold text-white">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-300 text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex gap-3 mt-4 sm:mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="btn-hover-subtle flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`${styles.button} flex-1`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Excluindo...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
