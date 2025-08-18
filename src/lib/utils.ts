import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata uma hora no formato HH:MM:SS para o padrão brasileiro HHhMM
 * @param time - Hora no formato "HH:MM:SS" (ex: "22:00:00")
 * @returns Hora formatada no padrão brasileiro (ex: "22h00")
 */
export function formatTime(time: string): string {
  if (!time) return '';
  
  // Remove espaços
  const cleanTime = time.trim();
  
  // Se já está no formato brasileiro, retorna como está
  if (cleanTime.includes('h')) {
    return cleanTime;
  }
  
  // Remove os segundos se existirem (HH:MM:SS -> HH:MM)
  const timeWithoutSeconds = cleanTime.split(':').slice(0, 2).join(':');
  
  // Converte de HH:MM para HHhMM
  return timeWithoutSeconds.replace(':', 'h');
}

/**
 * Formata uma data e hora no formato brasileiro completo
 * @param date - Data no formato "YYYY-MM-DD" (ex: "2025-08-10")
 * @param time - Hora no formato "HH:MM:SS" (ex: "22:00:00")
 * @returns Data e hora formatada (ex: "Domingo, 10/08/2025 às 22h00")
 */
export function formatDateTime(date: string, time: string): string {
  if (!date || !time) return '';
  
  const dateObj = new Date(date);
  
  // Verifica se a data é válida
  if (isNaN(dateObj.getTime())) return '';
  
  // Nomes dos dias da semana em português
  const weekdays = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];
  
  // Formata a data
  const dayName = weekdays[dateObj.getDay()];
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  // Formata a hora
  const formattedTime = formatTime(time);
  
  return `${dayName}, ${day}/${month}/${year} às ${formattedTime}`;
}

/**
 * Formata um intervalo de datas e horários
 * @param startDate - Data de início
 * @param startTime - Hora de início
 * @param endDate - Data de fim
 * @param endTime - Hora de fim
 * @returns Intervalo formatado (ex: "Domingo, 10/08/2025 às 22h00 até Segunda-feira, 11/08/2025 às 05h00")
 */
export function formatDateTimeRange(
  startDate: string, 
  startTime: string, 
  endDate: string, 
  endTime: string
): string {
  if (!startDate || !startTime || !endDate || !endTime) return '';
  
  const startFormatted = formatDateTime(startDate, startTime);
  const endFormatted = formatDateTime(endDate, endTime);
  
  return `${startFormatted} até ${endFormatted}`;
}

/**
 * Extrai data e hora de um timestamp ISO preservando o horário original
 * @param timestamp - Timestamp ISO (ex: "2025-08-10T22:00:00.000Z")
 * @returns Objeto com data e hora extraídas
 */
function extractDateTimeFromISO(timestamp: string): { date: Date; hours: number; minutes: number } | null {
  if (!timestamp) return null;
  
  try {
    // Extrair data e hora diretamente do timestamp
    const match = timestamp.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (!match) return null;
    
    const [, year, month, day, hours, minutes, seconds] = match;
    
    // Criar data local sem conversão de fuso horário
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1, // Mês é 0-indexed
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );
    
    return {
      date,
      hours: parseInt(hours),
      minutes: parseInt(minutes)
    };
  } catch (error) {
    console.error('Erro ao extrair data/hora do timestamp:', error);
    return null;
  }
}

/**
 * Formata um timestamp para o formato brasileiro conciso
 * @param timestamp - Timestamp ISO (ex: "2025-08-10T22:00:00.000Z")
 * @returns Data e hora formatada (ex: "Segunda, 10/08/2025 às 22:00")
 */
export function formatDateTimeFromTimestamp(timestamp: string): string {
  if (!timestamp) return '';
  
  const extracted = extractDateTimeFromISO(timestamp);
  if (!extracted) return '';
  
  const { date, hours, minutes } = extracted;
  
  // Nomes dos dias da semana em português (abreviados)
  const weekdays = [
    'Dom', 'Seg', 'Ter', 'Qua',
    'Qui', 'Sex', 'Sáb'
  ];
  
  // Formata a data usando a data extraída
  const dayName = weekdays[date.getDay()];
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  // Formata a hora usando os valores extraídos diretamente
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  return `${dayName}, ${day}/${month}/${year} às ${formattedTime}`;
}

/**
 * Formata um intervalo de timestamps de forma concisa
 * @param startTimestamp - Timestamp de início
 * @param endTimestamp - Timestamp de fim
 * @returns Intervalo formatado (ex: "Segunda, 10/08/2025 às 22:00 até 11/08/2025 às 05:00")
 */
export function formatDateTimeRangeFromTimestamps(
  startTimestamp: string, 
  endTimestamp: string
): string {
  if (!startTimestamp || !endTimestamp) return '';
  
  const startExtracted = extractDateTimeFromISO(startTimestamp);
  const endExtracted = extractDateTimeFromISO(endTimestamp);
  
  if (!startExtracted || !endExtracted) return '';
  
  const { date: startDate, hours: startHours, minutes: startMinutes } = startExtracted;
  const { date: endDate, hours: endHours, minutes: endMinutes } = endExtracted;
  
  // Nomes dos dias da semana em português (abreviados)
  const weekdays = [
    'Dom', 'Seg', 'Ter', 'Qua',
    'Qui', 'Sex', 'Sáb'
  ];
  
  // Formata a data de início
  const startDayName = weekdays[startDate.getDay()];
  const startDay = startDate.getDate().toString().padStart(2, '0');
  const startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
  const startYear = startDate.getFullYear();
  
  // Formata a data de fim
  const endDay = endDate.getDate().toString().padStart(2, '0');
  const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
  const endYear = endDate.getFullYear();
  
  // Verifica se é o mesmo dia
  const isSameDay = startDate.toDateString() === endDate.toDateString();
  
  const startTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
  const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  
  if (isSameDay) {
    return `${startDayName}, ${startDay}/${startMonth}/${startYear} às ${startTime} até ${endTime}`;
  } else {
    return `${startDayName}, ${startDay}/${startMonth}/${startYear} às ${startTime} até ${endDay}/${endMonth}/${endYear} às ${endTime}`;
  }
}

// Função para formatar preços no formato brasileiro
export const formatPrice = (price: number): string => {
  return price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para formatar preços sem o símbolo R$
export const formatPriceWithoutSymbol = (price: number): string => {
  return price.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para formatar telefone (11) 99999-9999
export const formatPhone = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11);
  
  // Aplica a formatação
  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  }
};

// Função para formatar CPF 000.000.000-00
export const formatCPF = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11);
  
  // Aplica a formatação
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}.${limited.slice(3)}`;
  } else if (limited.length <= 9) {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
  } else {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
  }
};
