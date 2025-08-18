import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import PageTransition from "@/components/PageTransition";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-tickety-black flex items-center justify-center px-4">
      <PageTransition>
        <div className="text-center max-w-md mx-auto">
          {/* Número 404 estilizado */}
          <div className="mb-8">
            <h1 className="text-8xl md:text-9xl font-bold text-white/10 mb-4">404</h1>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-green to-transparent mx-auto rounded-full"></div>
          </div>

          {/* Mensagem principal */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">
              Página não encontrada
            </h2>
            <p className="text-gray-400 text-base leading-relaxed">
              A página que você está procurando não existe ou foi movida para outro endereço.
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => navigate('/')}
              className="bg-primary-green hover:bg-primary-green/90 text-black font-semibold min-w-[140px] order-1 sm:order-2"
            >
              <Home size={16} className="mr-2" />
              Início
            </Button>
            
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="btn-hover-subtle min-w-[140px] order-2 sm:order-1"
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar
            </Button>
          </div>

          {/* Informação adicional */}
          <div className="mt-12 pt-8 border-t border-gray-800/50">
            <p className="text-xs text-gray-500">
              URL tentada: <span className="font-mono text-gray-400">{location.pathname}</span>
            </p>
          </div>
        </div>
      </PageTransition>
    </div>
  );
};

export default NotFound;
