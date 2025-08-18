import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KPICard from './KPICard';
import SalesChart from './SalesChart';
import EventsTable from './EventsTable';
import Sidebar from './Sidebar';
import { useEventStats } from '@/hooks/use-events';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, loading, error } = useEventStats(user?.id);
  

  
  // Formatar valores para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-white mb-6 px-4 fade-in-up">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KPICard 
            title="Faturamento Total" 
            value={loading ? "Carregando..." : formatCurrency(stats.totalRevenue)}
          />
          <KPICard 
            title="Quantidade de Vendas" 
            value={loading ? "Carregando..." : formatNumber(stats.totalTickets)}
          />
          <KPICard 
            title="Eventos Ativos" 
            value={loading ? "Carregando..." : formatNumber(stats.totalEvents)}
          />
        </div>
        
        <div className="mb-8">
          <SalesChart />
        </div>
        
        <div>
          <EventsTable />
        </div>
      </div>
      
      <div className="w-full lg:w-72 shrink-0">
        <Sidebar />
      </div>
    </div>
  );
};

export default Dashboard;
