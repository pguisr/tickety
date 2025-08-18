/**
 * Utilitários para formatação e validação de documentos brasileiros
 */

/**
 * Formata CPF no padrão XXX.XXX.XXX-XX
 */
export const formatCPF = (cpf: string): string => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Aplica máscara
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNPJ no padrão XX.XXX.XXX/XXXX-XX
 */
export const formatCNPJ = (cnpj: string): string => {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Aplica máscara
  return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Remove formatação de CPF
 */
export const unformatCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

/**
 * Remove formatação de CNPJ
 */
export const unformatCNPJ = (cnpj: string): string => {
  return cnpj.replace(/\D/g, '');
};

/**
 * Valida CPF
 */
export const validateCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se não são todos iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

/**
 * Valida CNPJ
 */
export const validateCNPJ = (cnpj: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se não são todos iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Validação dos dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return digit1 === parseInt(cleanCNPJ.charAt(12)) && 
         digit2 === parseInt(cleanCNPJ.charAt(13));
};

/**
 * Aplica máscara de CPF em tempo real
 */
export const applyCPFMask = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length <= 3) {
    return cleanValue;
  } else if (cleanValue.length <= 6) {
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
  } else if (cleanValue.length <= 9) {
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
  } else {
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9, 11)}`;
  }
};

/**
 * Aplica máscara de CNPJ em tempo real
 */
export const applyCNPJMask = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length <= 2) {
    return cleanValue;
  } else if (cleanValue.length <= 5) {
    return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2)}`;
  } else if (cleanValue.length <= 8) {
    return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2, 5)}.${cleanValue.slice(5)}`;
  } else if (cleanValue.length <= 12) {
    return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2, 5)}.${cleanValue.slice(5, 8)}/${cleanValue.slice(8)}`;
  } else {
    return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2, 5)}.${cleanValue.slice(5, 8)}/${cleanValue.slice(8, 12)}-${cleanValue.slice(12, 14)}`;
  }
};

/**
 * Obtém o tipo de documento baseado no role (deprecated - agora flexível)
 */
export const getDocumentType = (role: 'buyer' | 'producer' | 'admin'): 'cpf' | 'cnpj' => {
  return role === 'buyer' ? 'cpf' : 'cnpj';
};

/**
 * Obtém o label do documento baseado no role (deprecated - agora flexível)
 */
export const getDocumentLabel = (role: 'buyer' | 'producer' | 'admin'): string => {
  return role === 'buyer' ? 'CPF' : 'CNPJ';
};

/**
 * Obtém o placeholder do documento baseado no role (deprecated - agora flexível)
 */
export const getDocumentPlaceholder = (role: 'buyer' | 'producer' | 'admin'): string => {
  return role === 'buyer' ? '000.000.000-00' : '00.000.000/0000-00';
};

/**
 * Obtém o placeholder do documento baseado no tipo
 */
export const getDocumentPlaceholderByType = (type: 'cpf' | 'cnpj'): string => {
  return type === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00';
};

/**
 * Obtém o label do documento baseado no tipo
 */
export const getDocumentLabelByType = (type: 'cpf' | 'cnpj'): string => {
  return type === 'cpf' ? 'CPF' : 'CNPJ';
};
