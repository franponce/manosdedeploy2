export const CATEGORY_CONSTANTS = {
  MAX_CATEGORIES: 8,
  MAX_NAME_LENGTH: 50,
  ERROR_MESSAGES: {
    EMPTY_NAME: "El nombre de la categoría no puede estar vacío",
    LIMIT_REACHED: "Has alcanzado el límite máximo de categorías",
  },
  INFO_MESSAGES: {
    LIMIT_INFO: (current: number) => `Tienes ${current} categorías de ${CATEGORY_CONSTANTS.MAX_CATEGORIES}`,
    CANNOT_CREATE: "No se pueden crear más categorías",
  },
}; 