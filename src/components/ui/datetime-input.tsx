import React from 'react';
import { Input } from './input';
import { Label } from './label';

interface DateTimeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  description?: string;
}

export const DateTimeInput: React.FC<DateTimeInputProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  description
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-300">
        {label} {required && '*'}
      </Label>
      <Input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-black/30 border-gray-800 text-white h-12 focus:border-primary-green"
      />
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
};

interface DurationPreviewProps {
  startDate: string;
  endDate: string;
}

export const DurationPreview: React.FC<DurationPreviewProps> = ({ startDate, endDate }) => {
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return '';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffInMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

    const hours = Math.floor(diffInMinutes / 60);
    const minutes = Math.floor(diffInMinutes % 60);

    if (hours === 0 && minutes === 0) {
      return 'Menos de 1 minuto';
    }

    if (hours === 0) {
      return `${minutes} min`;
    }

    if (minutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${minutes}min`;
  };

  if (!startDate || !endDate) return null;

  return (
    <div className="text-sm text-gray-400">
      Duração: {calculateDuration(startDate, endDate)}
    </div>
  );
};
