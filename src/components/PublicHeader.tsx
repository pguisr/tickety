import React, { useState } from 'react';
import { Menu, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

const PublicHeader: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAccountClick = () => {
    // Sempre vai para a página de autenticação (usuário não logado)
    navigate('/auth');
  };

  const handleCreateEventClick = () => {
    // Sempre vai para a página de autenticação (usuário não logado)
    navigate('/auth');
  };

  const handleEventsClick = () => {
    // Redirecionar para auth primeiro
    navigate('/auth');
  };

  const handleProducersClick = () => {
    // Redirecionar para auth primeiro
    navigate('/auth');
  };

  const handleLogoClick = () => {
    // Redirecionar para auth primeiro
    navigate('/auth');
  };
  
  return (
    <header className="sticky top-0 z-10 px-4 py-4">
      <div className="bg-black/50 backdrop-blur-lg border border-gray-800/50 shadow-lg rounded-2xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Lado Esquerdo - Menu Mobile */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 rounded-full p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <Menu 
                  size={20} 
                  className={`absolute transition-all duration-300 ease-out ${
                    isMobileMenuOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
                  }`}
                />
                <X 
                  size={20} 
                  className={`absolute transition-all duration-300 ease-out ${
                    isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
                  }`}
                />
              </div>
            </Button>
          </div>
          
          {/* Logo - Centralizada no mobile, esquerda no desktop */}
          <div className="lg:hidden flex-1 flex justify-center">
            <a 
              href="/onboarding" 
              className="hover:opacity-80 transition-opacity cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                handleLogoClick();
              }}
            >
              <div className="flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M38.6299 14.0729L37.0301 12.4726C35.8085 13.2894 34.3415 13.6573 32.8791 13.5133C31.4168 13.3694 30.0496 12.7227 29.0106 11.6833C27.9716 10.644 27.325 9.27637 27.1812 7.81358C27.0373 6.35079 27.405 4.88336 28.2216 3.6614L25.9334 1.37253C25.0505 0.493492 23.8555 0 22.6098 0C21.364 0 20.169 0.493492 19.2861 1.37253L1.37211 19.2838C0.49334 20.167 0 21.3624 0 22.6085C0 23.8546 0.49334 25.05 1.37211 25.9332L3.46361 28.0233C4.65994 27.4074 6.02093 27.1875 7.35029 27.3953C8.67964 27.6031 9.90865 28.2279 10.8601 29.1796C11.8115 30.1313 12.4361 31.3607 12.6439 32.6905C12.8516 34.0202 12.6318 35.3817 12.016 36.5784L14.0645 38.6275C14.9474 39.5065 16.1425 40 17.3882 40C18.6339 40 19.8289 39.5065 20.7118 38.6275L38.6299 20.7182C39.5075 19.8352 40 18.6407 40 17.3956C40 16.1505 39.5075 14.956 38.6299 14.0729ZM24.7289 17.079H21.0539V23.7202C21.0539 25.2672 21.6685 26.0398 22.9242 26.0398H24.7289V30.1031H22.3117C18.5405 30.1031 16.3178 27.7815 16.3178 23.9128V17.079H13.2881V13.3701H16.3178V10.3087L21.0539 7.82519V13.3701H24.7289V17.079Z" fill="#6EFC2A"/>
                </svg>
              </div>
            </a>
          </div>
          
          {/* Logo Desktop - Lado Esquerdo */}
          <div className="hidden lg:block">
            <a 
              href="/onboarding" 
              className="hover:opacity-80 transition-opacity cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                handleLogoClick();
              }}
            >
              <Logo size="md" />
            </a>
          </div>
          
          {/* Lado Direito - Navegação Desktop + Menu Mobile User */}
          <div className="flex items-center">
            {/* Navegação Desktop */}
            <nav className="hidden lg:flex items-center space-x-8">
              <ul className="flex items-center space-x-6">
                <li>
                  <a 
                    href="/eventos" 
                    className="text-white hover:text-primary-green transition-colors text-xs lg:text-sm font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEventsClick();
                    }}
                  >
                    Explorar
                  </a>
                </li>
                <li>
                  <a 
                    href="/" 
                    className="text-white hover:text-primary-green transition-colors text-xs lg:text-sm font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      handleProducersClick();
                    }}
                  >
                    Para produtores
                  </a>
                </li>
              </ul>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-hover-subtle rounded-full px-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={handleAccountClick}
                >
                  <User size={16} className="mr-2" />
                  Minha conta
                </Button>
                <Button
                  size="sm"
                  className="bg-primary-green hover:bg-primary-green/90 text-black font-semibold rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={handleCreateEventClick}
                >
                  Criar evento
                </Button>
              </div>
            </nav>
            
            {/* Menu Mobile - User */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 lg:hidden rounded-full p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={handleAccountClick}
            >
              <User size={20} />
            </Button>
          </div>
        </div>
        
        {/* Menu Mobile Expandido */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden mt-4 pt-4 border-t border-gray-700/50">
            <ul className="space-y-3">
              <li>
                <a 
                  href="/eventos" 
                  className="block text-white hover:text-primary-green transition-colors text-sm font-medium py-2 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    handleEventsClick();
                  }}
                >
                  Explorar
                </a>
              </li>
              <li>
                <a 
                  href="/" 
                  className="block text-white hover:text-primary-green transition-colors text-sm font-medium py-2 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    handleProducersClick();
                  }}
                >
                  Para produtores
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="block text-white hover:text-primary-green transition-colors text-sm font-medium py-2 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    handleAccountClick();
                  }}
                >
                  Minha conta
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="block text-white hover:text-primary-green transition-colors text-sm font-medium py-2 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    handleCreateEventClick();
                  }}
                >
                  Criar evento
                </a>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default PublicHeader;
