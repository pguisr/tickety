import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, AlertCircle, CreditCard } from 'lucide-react';

interface CreditCardInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  required?: boolean;
  className?: string;
  validationType?: 'cardNumber' | 'expiry' | 'cvv' | 'holder';
}

const CreditCardInput: React.FC<CreditCardInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  required = false,
  className = '',
  validationType = 'holder'
}) => {
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validar campos de cartão
  const validateField = (value: string, type: string) => {
    switch (type) {
      case 'cardNumber':
        const cleanNumber = value.replace(/\s/g, '');
        return cleanNumber.length >= 13 && cleanNumber.length <= 19;
      
      case 'expiry':
        const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!expiryRegex.test(value)) return false;
        
        const [month, year] = value.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;
        
        const expYear = parseInt(year);
        const expMonth = parseInt(month);
        
        if (expYear < currentYear) return false;
        if (expYear === currentYear && expMonth < currentMonth) return false;
        
        return true;
      
      case 'cvv':
        return value.length >= 3 && value.length <= 4;
      
      case 'holder':
        return value.trim().length >= 3;
      
      default:
        return true;
    }
  };

  // Formatar campos conforme necessário
  const formatValue = (value: string, type: string) => {
    switch (type) {
      case 'cardNumber':
        return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      
      case 'expiry':
        const clean = value.replace(/\D/g, '');
        if (clean.length >= 2) {
          return clean.slice(0, 2) + '/' + clean.slice(2, 4);
        }
        return clean;
      
      case 'cvv':
        return value.replace(/\D/g, '').slice(0, 4);
      
      default:
        return value;
    }
  };

  useEffect(() => {
    if (isTouched || value) {
      const valid = validateField(value, validationType);
      setIsValid(valid);
    }
  }, [value, isTouched, validationType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatValue(e.target.value, validationType);
    onChange(formattedValue);
  };

  const handleBlur = () => {
    setIsTouched(true);
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // Determinar o estado visual do input
  const getInputState = () => {
    if (!isTouched && !value) return 'default';
    if (isFocused) return 'focused';
    if (isValid) return 'valid';
    return 'invalid';
  };

  const inputState = getInputState();

  // Classes CSS baseadas no estado
  const getInputClasses = () => {
    const baseClasses = 'glass-card border-gray-600 text-white transition-all duration-200';
    
    switch (inputState) {
      case 'focused':
        return `${baseClasses} border-primary-green/50`;
      case 'valid':
        return `${baseClasses} border-green-500/50`;
      case 'invalid':
        return `${baseClasses} border-red-500/50`;
      default:
        return baseClasses;
    }
  };

  // Ícone de status (apenas para campos inválidos)
  const getStatusIcon = () => {
    if (!isTouched || isValid) return null;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  // Mensagem de erro específica
  const getErrorMessage = () => {
    if (!isTouched || isValid) return '';
    
    switch (validationType) {
      case 'cardNumber':
        return 'Número do cartão inválido';
      case 'expiry':
        return 'Data de validade inválida';
      case 'cvv':
        return 'CVV inválido';
      case 'holder':
        return 'Nome do titular é obrigatório';
      default:
        return 'Campo inválido';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-white flex items-center gap-2">
        {validationType === 'cardNumber' && <CreditCard className="w-4 h-4" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          maxLength={maxLength}
          className={getInputClasses()}
        />
        
        {/* Ícone de status */}
        {getStatusIcon() && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getStatusIcon()}
          </div>
        )}
      </div>
      
      {/* Mensagem de erro */}
      {getErrorMessage() && (
        <p className="text-red-400 text-sm">
          {getErrorMessage()}
        </p>
      )}
    </div>
  );
};

export default CreditCardInput;
