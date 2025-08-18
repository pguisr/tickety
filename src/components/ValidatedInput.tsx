import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ValidationResult } from '@/utils/validations';

interface ValidatedInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  validate: (value: string) => ValidationResult;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  required?: boolean;
  className?: string;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({
  id,
  label,
  value,
  onChange,
  validate,
  placeholder,
  type = 'text',
  maxLength,
  required = false,
  className = ''
}) => {
  const [validation, setValidation] = useState<ValidationResult>({ valid: true });
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Validar quando o valor muda
  useEffect(() => {
    if (isTouched || value) {
      const result = validate(value);
      setValidation(result);
    }
  }, [value, isTouched, validate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
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
    if (validation.valid) return 'valid';
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
    if (!isTouched || validation.valid) return null;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-white flex items-center gap-2">
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
      {isTouched && !validation.valid && validation.error && (
        <p className="text-red-400 text-sm">
          {validation.error}
        </p>
      )}
    </div>
  );
};

export default ValidatedInput;
