/**
 * Utilitários para gerenciamento de nomes de usuário
 */

export interface NameParts {
  firstName: string;
  fullName: string;
}

/**
 * Separa um nome completo em primeiro nome
 */
export const splitName = (fullName: string): NameParts => {
  const trimmedName = fullName.trim();
  if (!trimmedName) {
    return { firstName: '', fullName: '' };
  }

  const nameParts = trimmedName.split(' ').filter(part => part.length > 0);
  
  if (nameParts.length === 0) {
    return { firstName: '', fullName: '' };
  }
  
  const firstName = nameParts[0];

  return {
    firstName,
    fullName: trimmedName
  };
};

/**
 * Combina primeiro nome em nome completo (mantido por compatibilidade)
 */
export const combineName = (firstName: string, lastName?: string): string => {
  const parts = [firstName, lastName].filter(part => part && part.trim().length > 0);
  return parts.join(' ');
};

/**
 * Obtém o nome de exibição (primeiro nome apenas)
 */
export const getDisplayName = (fullName: string): string => {
  const { firstName } = splitName(fullName);
  return firstName || 'Usuário';
};

/**
 * Obtém as iniciais do nome (primeira letra do primeiro nome)
 */
export const getInitials = (fullName: string): string => {
  const { firstName } = splitName(fullName);
  
  if (!firstName) return '';
  
  return firstName.charAt(0).toUpperCase();
};

/**
 * Formata nome para exibição em diferentes contextos
 */
export const formatName = (fullName: string, format: 'full' | 'display' | 'initials' = 'display'): string => {
  switch (format) {
    case 'full':
      return fullName;
    case 'display':
      return getDisplayName(fullName);
    case 'initials':
      return getInitials(fullName);
    default:
      return getDisplayName(fullName);
  }
};
