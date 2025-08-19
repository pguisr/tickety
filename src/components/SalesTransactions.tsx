import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RefreshCw, Download, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSales, SalesTransaction } from '@/hooks/use-sales';
import { cn } from '@/lib/utils';

// Tipos
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Componente principal
const SalesTransactions: React.FC = () => {
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [currentPage, setCurrentPage] = useState(1);
  const [calendarKey, setCalendarKey] = useState(0);
  
  // Constantes
  const SALES_PER_PAGE = 5;
  
  // Hooks
  const { sales, loading, error, refreshSales } = useSales();

  // Funções utilitárias
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'paid': 'Pago',
      'pending': 'Pendente',
      'failed': 'Falhou',
      'cancelled': 'Cancelado',
      'expired': 'Expirado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'paid': 'bg-primary-green',
      'pending': 'bg-yellow-500',
      'cancelled': 'bg-red-500',
      'failed': 'bg-red-500',
      'expired': 'bg-red-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  // Filtros
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Filtro por termo de busca
      const matchesSearch = searchTerm === '' || 
        sale.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.buyerEmail.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por data
      const saleDate = new Date(sale.createdAt);
      const matchesDateFrom = !dateRange.from || saleDate >= dateRange.from;
      const matchesDateTo = !dateRange.to || saleDate <= dateRange.to;

      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [sales, searchTerm, dateRange]);

  // Paginação
  const totalPages = Math.ceil(filteredSales.length / SALES_PER_PAGE);
  const startIndex = (currentPage - 1) * SALES_PER_PAGE;
  const endIndex = startIndex + SALES_PER_PAGE;
  const currentSales = filteredSales.slice(startIndex, endIndex);

  // Handlers
  const handleDateSelect = (date: Date | undefined, type: 'from' | 'to') => {
    if (type === 'from') {
      // Se clicar na mesma data, limpa
      if (date && dateRange.from && date.getTime() === dateRange.from.getTime()) {
        setDateRange(prev => ({ ...prev, from: undefined }));
      } else {
        setDateRange(prev => ({ ...prev, from: date }));
      }
    } else {
      // Se clicar na mesma data, limpa
      if (date && dateRange.to && date.getTime() === dateRange.to.getTime()) {
        setDateRange(prev => ({ ...prev, to: undefined }));
      } else {
        setDateRange(prev => ({ ...prev, to: date }));
      }
    }
    setCalendarKey(prev => prev + 1);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const exportToCSV = () => {
    const headers = [
      'Data',
      'Evento',
      'Comprador',
      'Email',
      'Quantidade',
      'Valor Total',
      'Status'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredSales.map(sale => [
        formatDate(sale.createdAt),
        `"${sale.eventTitle}"`,
        `"${sale.buyerName}"`,
        `"${sale.buyerEmail}"`,
        sale.quantity,
        formatCurrency(sale.totalAmount).replace(/[^\d,]/g, '').replace(',', '.'),
        translateStatus(sale.status)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendas-${format(new Date(), 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset paginação quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateRange]);

  // Estados de loading e erro
  if (error) {
    return (
      <div className="glass-card rounded-lg p-6 w-full">
        <div className="text-center text-red-400">
          <p>Erro ao carregar movimentações: {error}</p>
          <Button 
            onClick={refreshSales} 
            variant="ghost"
            className="mt-4 text-primary-green hover:text-primary-green/80"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg p-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-white">Histórico de Vendas</h2>
        <div className="flex gap-1">
          <Button
            onClick={refreshSales}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="h-8 w-8 p-0 text-gray-500 hover:text-primary-green hover:bg-transparent"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button
            onClick={exportToCSV}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-primary-green hover:bg-transparent"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar vendas..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 bg-black/40 border-gray-800/80 text-white placeholder-gray-400 focus:border-primary-green/50"
          />
        </div>
        
        <div className="flex gap-1">
          {/* Calendário Data Inicial */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-gray-500 hover:text-black hover:bg-primary-green border border-gray-800/80"
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                {dateRange.from ? format(dateRange.from, 'dd/MM') : 'Inicial'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-black/90 border-gray-800/80">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => handleDateSelect(date, 'from')}
                key={`calendar-from-${calendarKey}`}
                initialFocus
                className="bg-black/90"
              />
            </PopoverContent>
          </Popover>

          {/* Calendário Data Final */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-gray-500 hover:text-black hover:bg-primary-green border border-gray-800/80"
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                {dateRange.to ? format(dateRange.to, 'dd/MM') : 'Final'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-black/90 border-gray-800/80">
              <Calendar
                mode="single"
                selected={dateRange.to}
                onSelect={(date) => handleDateSelect(date, 'to')}
                key={`calendar-to-${calendarKey}`}
                initialFocus
                className="bg-black/90"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-green/30 border-t-primary-green rounded-full animate-spin mr-3"></div>
          <span className="text-gray-400">Carregando movimentações...</span>
        </div>
      ) : currentSales.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">
            {searchTerm || dateRange.from || dateRange.to 
              ? 'Nenhuma venda encontrada para os filtros aplicados.' 
              : 'Nenhuma venda encontrada.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-800/50 hover:bg-transparent">
                    <TableHead className="text-gray-400 text-xs uppercase tracking-wider font-normal">Data</TableHead>
                    <TableHead className="text-gray-400 text-xs uppercase tracking-wider font-normal">Evento</TableHead>
                    <TableHead className="text-gray-400 text-xs uppercase tracking-wider font-normal">Comprador</TableHead>
                    <TableHead className="text-gray-400 text-xs uppercase tracking-wider font-normal text-right">Qtd</TableHead>
                    <TableHead className="text-gray-400 text-xs uppercase tracking-wider font-normal text-right">Total</TableHead>
                    <TableHead className="text-gray-400 text-xs uppercase tracking-wider font-normal text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentSales.map((sale) => (
                    <TableRow 
                      key={sale.id} 
                      className="border-b border-gray-800/50 transition-colors duration-200 hover:bg-black/20"
                    >
                                             <TableCell className="py-3">
                         <span className="text-gray-400 text-xs">{formatDate(sale.createdAt)}</span>
                       </TableCell>
                       <TableCell className="py-3">
                         <span className="text-white text-xs">{sale.eventTitle}</span>
                       </TableCell>
                       <TableCell className="py-3">
                         <div>
                           <div className="text-white text-xs">{sale.buyerName}</div>
                           <div className="text-gray-400 text-xs">{sale.buyerEmail}</div>
                         </div>
                       </TableCell>
                       <TableCell className="py-3 text-right">
                         <span className="text-white text-xs">{sale.quantity}</span>
                       </TableCell>
                       <TableCell className="py-3 text-right">
                         <span className="text-white text-xs font-medium">{formatCurrency(sale.totalAmount)}</span>
                       </TableCell>
                       <TableCell className="py-3 text-center">
                         <div className={cn("w-1.5 h-1.5 rounded-full mx-auto", getStatusColor(sale.status))}></div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-gray-800/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-2 text-gray-400 hover:text-primary-green hover:bg-transparent"
              >
                ←
              </Button>
              
              <span className="text-gray-500 text-xs">
                {currentPage}/{totalPages}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-2 text-gray-400 hover:text-primary-green hover:bg-transparent"
              >
                →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SalesTransactions;
