
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ReservationService } from "@/services/reservationService";

import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Event from "./pages/Event";
import EditEvent from "./pages/EditEvent";
import CreateEvent from "./pages/CreateEvent";
import Settings from "./pages/Settings";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import MyTickets from "./pages/MyTickets";
import Participants from "./pages/Participants";
import NotFound from "./pages/NotFound";
import PageTransition from "./components/PageTransition";

const queryClient = new QueryClient();

// Sistema de reservas temporárias não disponível no schema mínimo

// Componente principal com scroll suave
const AppContent = () => {
  // Inicializar scroll suave
  useSmoothScroll();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AnimatedRoutes />
          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Componente para rotas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-tickety-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Rotas públicas */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/eventos/:url" element={<Event />} />
        <Route path="/compra" element={<Checkout />} />
        
        {/* Rotas protegidas */}
        <Route path="/" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/meus-ingressos" element={
          <ProtectedRoute>
            <MyTickets />
          </ProtectedRoute>
        } />
        <Route path="/participantes" element={
          <ProtectedRoute>
            <Participants />
          </ProtectedRoute>
        } />
        <Route path="/eventos/:url/editar" element={
          <ProtectedRoute>
            <EditEvent />
          </ProtectedRoute>
        } />
        <Route path="/evento/criar" element={
          <ProtectedRoute>
            <CreateEvent />
          </ProtectedRoute>
        } />
        <Route path="/configuracoes" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        
        {/* Rota 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
