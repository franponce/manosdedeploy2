export const CATEGORY_CONSTANTS = {
  MAX_CATEGORIES: 8,
  MAX_NAME_LENGTH: 20,
  ERROR_MESSAGES: {
    DUPLICATE: 'Ya existe una categoría con este nombre',
    LIMIT_REACHED: '¡Has alcanzado el límite de categorías! 🎯',
    NAME_TOO_LONG: `El nombre debe tener máximo ${20} caracteres`,
    EMPTY_NAME: 'El nombre no puede estar vacío'
  },
  INFO_MESSAGES: {
    LIMIT_INFO: (current: number) => 
      `Has creado ${current} de ${8} categorías disponibles`,
    CANNOT_CREATE: 'Has alcanzado el límite de categorías. Considera reorganizar las existentes para una mejor organización 🎯'
  }
}; 