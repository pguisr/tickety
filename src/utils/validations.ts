// Utilitários de validação reutilizáveis

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface UrlValidationResult extends ValidationResult {
  suggestions?: string[];
}

/**
 * Valida se uma data é futura
 */
export const validateFutureDate = (date: string): ValidationResult => {
  if (!date) {
    return { valid: false, error: 'Data é obrigatória.' };
  }
  
  const dateObj = new Date(date);
  const now = new Date();
  
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Data inválida fornecida.' };
  }
  
  if (dateObj <= now) {
    return { valid: false, error: 'A data deve ser futura.' };
  }
  
  return { valid: true };
};

/**
 * Valida se o período entre duas datas é válido
 */
export const validateDateRange = (startsAt: string, endsAt: string): ValidationResult => {
  if (!startsAt || !endsAt) {
    return { valid: false, error: 'Data de início e término são obrigatórias.' };
  }
  
  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);
  const now = new Date();
  
  // Validar se as datas são válidas
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { valid: false, error: 'Datas inválidas fornecidas.' };
  }
  
  // Validar se a data de início é futura
  if (startDate <= now) {
    return { valid: false, error: 'A data de início deve ser futura.' };
  }
  
  // Validar se a data de término é posterior à data de início
  if (endDate <= startDate) {
    return { valid: false, error: 'A data de término deve ser posterior à data de início.' };
  }
  
  return { valid: true };
};

/**
 * Valida formato de URL personalizada
 */
export const validateUrlFormat = (url: string): ValidationResult => {
  if (!url) {
    return { valid: true };
  }
  
  // Validar formato da URL
  const urlRegex = /^[a-z0-9-]+$/;
  if (!urlRegex.test(url)) {
    return { 
      valid: false, 
      error: 'A URL deve conter apenas letras minúsculas, números e hífens.' 
    };
  }
  
  // Validar comprimento mínimo e máximo
  if (url.length < 3) {
    return { valid: false, error: 'A URL deve ter pelo menos 3 caracteres.' };
  }
  
  if (url.length > 50) {
    return { valid: false, error: 'A URL deve ter no máximo 50 caracteres.' };
  }
  
  return { valid: true };
};

/**
 * Gera sugestões de URL alternativas
 */
export const generateUrlSuggestions = (baseUrl: string): string[] => {
  const suggestions = [];
  const timestamp = Date.now().toString().slice(-4);
  
  suggestions.push(`${baseUrl}-${timestamp}`);
  suggestions.push(`${baseUrl}-evento`);
  suggestions.push(`${baseUrl}-2024`);
  suggestions.push(`${baseUrl}-novo`);
  
  return suggestions;
};

/**
 * Valida formato de email
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { valid: false, error: 'Email é obrigatório.' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Formato de email inválido.' };
  }
  
  return { valid: true };
};

/**
 * Valida formato de CPF
 */
export const validateCPF = (cpf: string): ValidationResult => {
  if (!cpf) {
    return { valid: false, error: 'CPF é obrigatório.' };
  }
  
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) {
    return { valid: false, error: 'CPF deve ter 11 dígitos.' };
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { valid: false, error: 'CPF inválido.' };
  }
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) {
    return { valid: false, error: 'CPF inválido.' };
  }
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) {
    return { valid: false, error: 'CPF inválido.' };
  }
  
  return { valid: true };
};

/**
 * Valida formato de telefone
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone) {
    return { valid: false, error: 'Telefone é obrigatório.' };
  }
  
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Valida telefone brasileiro (10 ou 11 dígitos)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { valid: false, error: 'Telefone deve ter 10 ou 11 dígitos.' };
  }
  
  return { valid: true };
};

/**
 * Valida tamanho e tipo de arquivo de imagem
 */
export const validateImageFile = (file: File): ValidationResult => {
  if (!file) {
    return { valid: false, error: 'Arquivo é obrigatório.' };
  }
  
  // Validação de tipo
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Por favor, selecione apenas arquivos de imagem.' };
  }
  
  // Validação de tamanho (5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'A imagem deve ter no máximo 5MB.' };
  }
  
  return { valid: true };
};

/**
 * Valida se um campo obrigatório está preenchido
 */
export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value?.trim()) {
    return { valid: false, error: `${fieldName} é obrigatório.` };
  }
  
  return { valid: true };
};

/**
 * Valida se um número é positivo
 */
export const validatePositiveNumber = (value: number, fieldName: string): ValidationResult => {
  if (value < 0) {
    return { valid: false, error: `${fieldName} deve ser um número positivo.` };
  }
  
  return { valid: true };
};
