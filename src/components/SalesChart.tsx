import React, { useState, useEffect } from 'react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Interface para dados de vendas
interface SalesData {
  date: string;
  vendas: number;
}

const SalesChart = () => {
  const [period, setPeriod] = useState("7D");
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);

  // Gerar dados reais baseados no período
  const generateRealData = (days: number): SalesData[] => {
    const data: SalesData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        vendas: 0 // Inicialmente 0, será atualizado quando tivermos dados reais
      });
    }
    
    return data;
  };

  // Atualiza os dados quando o período muda
  const handlePeriodChange = (newPeriod: string) => {
    if (!newPeriod) return;
    setPeriod(newPeriod);
    const days = parseInt(newPeriod);
    setData(generateRealData(days));
  };

  useEffect(() => {
    // Inicializar com dados vazios
    setData(generateRealData(7));
    setLoading(false);
  }, []);

  return (
    <div className="glass-card p-6 rounded-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-base font-medium text-white">Vendas</h2>
        
        {/* Filtros de Período */}
        <div className="flex bg-black/20 rounded-lg p-1 gap-1 w-full sm:w-auto">
          {["7D", "14D", "30D"].map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`
                flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all
                ${period === p 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white'
                }
              `}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 25, left: 25, bottom: 10 }}
          >
            {/* Grid */}
            <CartesianGrid 
              stroke="rgba(255,255,255,0.05)" 
              vertical={false}
            />
            
            {/* Eixo X */}
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: '#6B7280', 
                fontSize: 12,
                fontWeight: 500 
              }}
              dy={15}
              minTickGap={30}
              padding={{ left: 10, right: 10 }}
              tickFormatter={(value) => {
                const [day, month] = value.split('/');
                return `${day}.${month}`;
              }}
            />
            
            {/* Eixo Y */}
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: '#6B7280', 
                fontSize: 12,
                fontWeight: 500
              }}
              width={35}
              tickCount={5}
              domain={[0, (dataMax: number) => Math.ceil(dataMax / 10) * 10]}
              tickFormatter={(value) => Math.round(value).toString()}
              padding={{ top: 20, bottom: 20 }}
              dx={0}
            />
            
            {/* Tooltip */}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-black/90 border border-white/10 rounded-lg p-2.5 shadow-lg">
                      <p className="text-gray-400 mb-1">{label}</p>
                      <p className="text-white">{payload[0].value} vendas</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* Linha */}
            <Line
              type="monotone"
              dataKey="vendas"
              stroke="#6EFC2A"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: '#6EFC2A',
                stroke: '#fff',
                strokeWidth: 1,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;