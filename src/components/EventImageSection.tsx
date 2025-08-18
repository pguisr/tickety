import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, ImageIcon } from 'lucide-react';

interface EventImageSectionProps {
  imagePreview: string;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
}

const EventImageSection: React.FC<EventImageSectionProps> = ({
  imagePreview,
  onImageUpload,
  onRemoveImage
}) => {
  return (
    <div className="hidden lg:block glass-card rounded-xl p-6 lg:mt-6">
      <h3 className="text-base font-semibold text-white mb-4">Imagem do Evento</h3>
      
      {imagePreview ? (
        <div className="relative group">
          <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                className="hidden"
              />
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm">
                <Upload size={14} className="mr-2" />
                Alterar
              </Button>
            </label>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={onRemoveImage}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 backdrop-blur-sm"
            >
              <Trash2 size={14} className="mr-2" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-primary-green/10 to-primary-green/5 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-center hover:border-primary-green/50 transition-colors cursor-pointer">
          <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
            <div className="w-12 h-12 bg-primary-green/20 rounded-full flex items-center justify-center mb-3">
              <ImageIcon size={24} className="text-primary-green" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Clique para adicionar imagem</p>
            <p className="text-gray-500 text-xs">PNG, JPG até 5MB</p>
          </label>
        </div>
      )}
    </div>
  );
};

export default EventImageSection;
