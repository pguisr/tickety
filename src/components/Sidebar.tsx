import React from 'react';
import { Plus, HelpCircle, Settings, LayoutDashboard, FileText, Palette, QrCode, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <aside className="glass-card rounded-xl p-6 max-h-[calc(100vh-8.5rem)] sticky top-[6.5rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
      <div className="flex flex-col h-full space-y-6">
        {/* Botão Principal - Novo Evento */}
        <div>
          <Button 
            onClick={() => navigate('/evento/criar')}
            className="w-full bg-primary-green hover:bg-primary-green/90 text-black font-semibold gap-2 h-12 shadow-lg shadow-primary-green/25 rounded-lg"
          >
            <Plus size={18} />
            <span>Criar Novo Evento</span>
          </Button>
        </div>
        

        
        {/* Card de Suporte Redesenhado */}
        <div className="bg-gradient-to-br from-primary-green/10 to-primary-green/5 border border-primary-green/20 rounded-xl p-5 text-center">
          <div className="w-12 h-12 bg-primary-green/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageCircle size={20} className="text-primary-green" />
          </div>
          <h4 className="text-sm font-semibold text-white mb-2">Precisa de Ajuda?</h4>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Nossa equipe de suporte está disponível 24/7 para ajudar você
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-sm h-9 border-primary-green/50 text-primary-green hover:bg-primary-green hover:text-black rounded-lg"
          >
            <MessageCircle size={14} className="mr-2" />
            Iniciar Chat
          </Button>
        </div>
        


      </div>
    </aside>
  );
};

export default Sidebar;
